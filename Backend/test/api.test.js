import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { Wallet } from "ethers";
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
  const primarySigner = Wallet.createRandom();
  const primary = primarySigner.address;
  const secondary = Wallet.createRandom().address;
  const adminHeaders = {
    "Content-Type": "application/json",
    "x-admin-key": "swiz_admin_secure_live_key_2026",
  };
  const validTxHash = "0x" + "a".repeat(64);

  try {
    // 1. Register secondary wallet with cryptographic signature (APP-H-01)
    const timestamp = Date.now();
    const msg = `Swiz Protocol: Register secondary backup wallet ${secondary.toLowerCase()} for primary ${primary.toLowerCase()} at ${timestamp}`;
    const sig = await primarySigner.signMessage(msg);

    const regRes = await fetch(`${baseUrl}/user/secondary-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryWallet: primary,
        secondaryWallet: secondary,
        signature: sig,
        timestamp,
      }),
    });
    assert.equal(regRes.status, 200);
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.equal(regData.secondary_wallet, secondary.toLowerCase());

    // 2. Reject registering same wallet
    const errRes = await fetch(`${baseUrl}/user/secondary-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryWallet: primary,
        secondaryWallet: primary,
        signature: sig,
      }),
    });
    assert.equal(errRes.status, 400);

    // 2b. Reject updating secondary wallet once already configured (one chance rule)
    const updateSig = await primarySigner.signMessage(
      `Swiz Protocol: Register secondary backup wallet 0x3333333333333333333333333333333333333333 for primary ${primary.toLowerCase()} at ${timestamp}`
    );
    const updateAttemptRes = await fetch(`${baseUrl}/user/secondary-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryWallet: primary,
        secondaryWallet: "0x3333333333333333333333333333333333333333",
        signature: updateSig,
        timestamp,
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
    assert.equal(getData.status, "PENDING_ACTIVATION");

    // 4. Admin replace wallet with recorded secondary wallet (requires admin auth APP-C-02 and valid txHash APP-M-07)
    const repRes = await fetch(`${baseUrl}/admin/replace-wallet`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        oldWallet: primary,
        newWallet: secondary,
        txHash: validTxHash,
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
      headers: adminHeaders,
      body: JSON.stringify({
        oldWallet: unrecorded,
        newWallet: secondary,
        txHash: validTxHash,
      }),
    });
    assert.equal(failRepRes.status, 400);

    // 6. Admin can pause unrecorded or compromised primary wallet
    const pauseRes = await fetch(`${baseUrl}/admin/pause-wallet`, {
      method: "POST",
      headers: adminHeaders,
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
    const auditRes = await fetch(`${baseUrl}/admin/replacements`, {
      headers: adminHeaders,
    });
    assert.equal(auditRes.status, 200);
    const auditData = await auditRes.json();
    assert.ok(auditData.total >= 1);
    assert.ok(Array.isArray(auditData.replacements));
  } finally {
    server.close();
    store.close();
  }
});

