import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Store } from "./db/index.js";
import { loadConfig } from "./config.js";
import { createProtocol, indexProtocol } from "./protocol.js";
import { Bridge } from "./bridge.js";
import { api } from "./routes/api.js";
import { logger } from "./logger.js";

const config = loadConfig();
const store = new Store();
const protocol = createProtocol(config);
const bridge = new Bridge(config, store);
const status = { error: null, lastSuccess: null };
const app = express();

// APP-M-01: Trust first proxy hop behind Cloudflare / reverse proxy
app.set("trust proxy", 1);

// APP-L-01: Industry-standard HTTP security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP managed at edge CDN / frontend level
    crossOriginEmbedderPolicy: false,
  })
);

// Sliding-window rate limiter (300 req/min/IP) with Cloudflare/Reverse-Proxy IP resolution (APP-M-01)
const rateLimits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimits.entries()) {
    if (data.resetAt <= now) rateLimits.delete(ip);
  }
}, 60000).unref();

app.use((req, res, next) => {
  const cfIp = req.headers["cf-connecting-ip"];
  const xForwarded = req.headers["x-forwarded-for"];
  const clientIp =
    (typeof cfIp === "string" ? cfIp : null) ||
    (typeof xForwarded === "string" ? xForwarded.split(",")[0].trim() : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  let record = rateLimits.get(clientIp);
  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + 60000 };
    rateLimits.set(clientIp, record);
    return next();
  }
  record.count++;
  if (record.count > 300) {
    res.setHeader("Retry-After", Math.ceil((record.resetAt - now) / 1000));
    logger.warn("Rate limit exceeded", { clientIp, count: record.count, path: req.path });
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  next();
});

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
  })
);

app.use(express.json({ limit: "32kb" }));
app.use("/api/v1", api({ store, protocol, config, status, bridge }));
app.use((error, req, res, next) => {
  logger.error("Unhandled API error", { error: error.message, stack: error.stack, path: req.path });
  res.status(503).json({ error: "Chain service unavailable; retry later" });
});

let stopped = false;
async function loop() {
  try {
    await bridge.tick();
    await indexProtocol(protocol, store, config);
    status.error = null;
    status.lastSuccess = new Date().toISOString();
  } catch (e) {
    status.error = "Chain synchronization failed; retrying";
    logger.error(status.error, { error: e.message, stack: e.stack });
  }
  if (!stopped) setTimeout(loop, 5000);
}

// APP-H-06: Process decoupling: Allow independent execution as API, Worker, or Monolith
const processType = (process.env.PROCESS_TYPE || "monolith").toLowerCase();
let server = null;

if (processType !== "worker") {
  server = app.listen(
    Number(process.env.PORT || 5001),
    process.env.HOST || "127.0.0.1",
    () => {
      logger.info(`Swiz API listening on ${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 5001} [mode: ${processType}]`);
      if (processType !== "api") {
        loop();
      }
    }
  );
} else {
  logger.info("Swiz Worker started in standalone daemon mode");
  loop();
}

function shutdown() {
  if (stopped) return;
  stopped = true;
  logger.info("Gracefully shutting down Swiz service");
  const exitCleanup = () => {
    try {
      store.close();
    } catch {}
    process.exit(0);
  };

  if (server) {
    server.close(exitCleanup);
  } else {
    exitCleanup();
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
