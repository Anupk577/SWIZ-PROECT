import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/db/index.js";
import { depositId, validateEvent } from "../src/bridge.js";
test("deposit identities include source chain and adapter; store is idempotent", () => {
  const adapter = "0x0000000000000000000000000000000000000001";
  assert.notEqual(depositId(1, adapter, 1), depositId(2, adapter, 1));
  const s = new Store(":memory:");
  const d = {
    id: "one",
    source: 1,
    nonce: "1",
    recipient: adapter,
    amount: "1000000",
    sourceTx: "tx",
    blockHash: "block",
    blockNumber: 1,
  };
  s.deposit(d);
  s.deposit(d);
  assert.equal(s.deposits().length, 1);
  s.update("one", "SUBMITTED", "mint");
  assert.equal(s.pending()[0].mintTx, "mint");
  s.update("one", "MINTED");
  assert.equal(s.pending().length, 0);
  s.close();
});
test("normalizes six and eighteen decimal source deposits exactly", () => {
  validateEvent(
    { amount6: 1000000n, sourceAmount: 1000000000000000000n },
    1000000000000n
  );
  assert.throws(() => validateEvent({ amount6: 1n, sourceAmount: 2n }, 1n));
});
test("secondary wallet persistence and offchain wallet replacement migration", () => {
  const s = new Store(":memory:");
  const primary = "0x1111111111111111111111111111111111111111";
  const secondary = "0x2222222222222222222222222222222222222222";

  // Register secondary wallet
  s.setSecondaryWallet(primary, secondary);
  const record = s.getSecondaryWallet(primary);
  assert.equal(record.secondary_wallet, secondary.toLowerCase());
  assert.equal(record.status, "ACTIVE");

  // Create deposit and event for primary
  s.deposit({
    id: "dep1",
    source: 1,
    nonce: "1",
    recipient: primary,
    amount: "5000000",
    sourceTx: "tx1",
    blockHash: "bh1",
    blockNumber: 10,
  });
  s.event({
    id: "ev1",
    user: primary,
    txHash: "tx1",
    type: "PackageCreated",
    block: 10,
    data: { amount: "100" },
  });

  assert.equal(s.deposits(primary).length, 1);
  assert.equal(s.events(primary).length, 3);

  // Execute offchain replacement
  const rep = s.replaceWalletOffchain(primary, secondary, "tx_replace", 1);
  assert.equal(rep.old_wallet, primary.toLowerCase());
  assert.equal(rep.new_wallet, secondary.toLowerCase());

  // Deposits migrated to secondary
  assert.equal(s.deposits(primary).length, 0);
  assert.equal(s.deposits(secondary).length, 1);
  // Both wallets record the WalletReplaced event in activity
  assert.ok(s.events(primary).some((e) => e.type === "WalletReplaced"));
  assert.ok(s.events(secondary).some((e) => e.type === "WalletReplaced"));

  // Status is updated
  assert.equal(s.getSecondaryWallet(primary).status, "REPLACED");
  assert.equal(s.getWalletReplacements(primary).length, 1);
  s.close();
});

