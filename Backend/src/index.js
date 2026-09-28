import "dotenv/config";
import express from "express";
import cors from "cors";
import { Store } from "./db/index.js";
import { loadConfig } from "./config.js";
import { createProtocol, indexProtocol } from "./protocol.js";
import { Bridge } from "./bridge.js";
import { api } from "./routes/api.js";

const config = loadConfig();
const store = new Store();
const protocol = createProtocol(config);
const bridge = new Bridge(config, store);
const status = { error: null, lastSuccess: null };
const app = express();

// Security headers middleware
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Lightweight sliding-window rate limiter (300 req/min/IP)
const rateLimits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimits.entries()) {
    if (data.resetAt <= now) rateLimits.delete(ip);
  }
}, 60000).unref();

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let record = rateLimits.get(ip);
  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + 60000 };
    rateLimits.set(ip, record);
    return next();
  }
  record.count++;
  if (record.count > 300) {
    res.setHeader("Retry-After", Math.ceil((record.resetAt - now) / 1000));
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
app.use("/api/v1", api({ store, protocol, config, status }));
app.use((error, req, res, next) => {
  console.error(error.message);
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
    console.error(status.error);
  }
  if (!stopped) setTimeout(loop, 5000);
}

const server = app.listen(
  Number(process.env.PORT || 5001),
  process.env.HOST || "127.0.0.1",
  () => {
    console.log("Swiz API listening");
    loop();
  }
);

function shutdown() {
  if (stopped) return;
  stopped = true;
  server.close(() => {
    try {
      store.close();
    } catch {}
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
