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
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:5173").split(","),
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
process.on("SIGTERM", () => {
  stopped = true;
  server.close();
});
export default app;
