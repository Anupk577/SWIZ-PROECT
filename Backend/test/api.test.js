import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { api } from "../src/routes/api.js";
import { Store } from "../src/db/index.js";
test("forged sale and confirmation posts cannot write records", async () => {
  const store = new Store(":memory:");
  const app = express();
  app.use(express.json());
  app.use(
    "/api/v1",
    api({ store, protocol: {}, config: { sources: [] }, status: {} })
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    for (const route of ["/admin/record-offchain-sale", "/packages/buy"]) {
      const r = await fetch(
        `http://127.0.0.1:${server.address().port}/api/v1${route}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: "0x0000000000000000000000000000000000000001",
            usdtAmountUSD: 1000,
          }),
        }
      );
      assert.equal(r.status, 410);
    }
    assert.equal(store.events().length, 0);
  } finally {
    server.close();
    store.close();
  }
});
