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
