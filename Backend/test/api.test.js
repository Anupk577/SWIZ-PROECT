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
test("secondary wallet registration and admin replacement API endpoints", async () => {
  const store = new Store(":memory:");
  const app = express();
  app.use(express.json());
  app.use(
    "/api/v1",
    api({ store, protocol: {}, config: { sources: [] }, status: {} })
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const primary = "0x1111111111111111111111111111111111111111";
  const secondary = "0x2222222222222222222222222222222222222222";

  try {
    // 1. Register secondary wallet
    const regRes = await fetch(`${baseUrl}/user/secondary-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryWallet: primary, secondaryWallet: secondary }),
    });
    assert.equal(regRes.status, 200);
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.equal(regData.secondary_wallet, secondary.toLowerCase());

    // 2. Reject registering same wallet
    const errRes = await fetch(`${baseUrl}/user/secondary-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryWallet: primary, secondaryWallet: primary }),
    });
    assert.equal(errRes.status, 400);

    // 2b. Reject updating secondary wallet once already configured (one chance rule)
    const updateAttemptRes = await fetch(`${baseUrl}/user/secondary-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryWallet: primary,
        secondaryWallet: "0x3333333333333333333333333333333333333333",
      }),
    });
    assert.equal(updateAttemptRes.status, 403);
    const updateAttemptData = await updateAttemptRes.json();
    assert.match(updateAttemptData.error, /once set, it cannot be updated/i);

    // 3. Query secondary wallet
    const getRes = await fetch(`${baseUrl}/user/secondary-wallet/${primary}`);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.secondaryWallet, secondary.toLowerCase());
    assert.equal(getData.status, "ACTIVE");

    // 4. Admin replace wallet with recorded secondary wallet
    const repRes = await fetch(`${baseUrl}/admin/replace-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldWallet: primary,
        newWallet: secondary,
        txHash: "0xabc",
        packagesMigrated: 2,
      }),
    });
    assert.equal(repRes.status, 200);
    const repData = await repRes.json();
    assert.equal(repData.success, true);
    assert.equal(repData.result.new_wallet, secondary.toLowerCase());

    // 5. Unrecorded wallet cannot be replaced by admin
    const unrecorded = "0x9999999999999999999999999999999999999999";
    const failRepRes = await fetch(`${baseUrl}/admin/replace-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldWallet: unrecorded,
        newWallet: secondary,
      }),
    });
    assert.equal(failRepRes.status, 400);

    // 6. Admin can pause unrecorded or compromised primary wallet
    const pauseRes = await fetch(`${baseUrl}/admin/pause-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: unrecorded,
        isPaused: true,
        reason: "Compromised keys without backup wallet",
      }),
    });
    assert.equal(pauseRes.status, 200);
    const pauseData = await pauseRes.json();
    assert.equal(pauseData.is_paused, true);

    // 7. Check paused status
    const statusRes = await fetch(`${baseUrl}/user/paused-status/${unrecorded}`);
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.isPaused, true);

    // 8. Check admin replacements audit log
    const auditRes = await fetch(`${baseUrl}/admin/replacements`);
    assert.equal(auditRes.status, 200);
    const auditData = await auditRes.json();
    assert.ok(auditData.total >= 1);
    assert.ok(Array.isArray(auditData.replacements));
  } finally {
    server.close();
    store.close();
  }
});

