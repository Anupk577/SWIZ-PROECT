import fs from "node:fs";
import assert from "node:assert/strict";
import { JsonRpcProvider, ContractFactory } from "ethers";
import { Bridge } from "../../Backend/src/bridge.js";
import { Store } from "../../Backend/src/db/index.js";
import { createProtocol, indexProtocol } from "../../Backend/src/protocol.js";
const rpc = "http://127.0.0.1:8547";
const p = new JsonRpcProvider(rpc, undefined, { cacheTimeout: -1 });
assert.equal(
  Number((await p.getNetwork()).chainId),
  31337,
  "This script runs only on a local chain"
);
const [admin, treasury, relayer, user] = await Promise.all(
  [0, 1, 2, 3].map((i) => p.getSigner(i))
);
async function deploy(name, args = []) {
  const artifact = JSON.parse(
    fs.readFileSync(
      `artifacts/contracts/${name}.sol/${name.split("/").at(-1)}.json`
    )
  );
  const c = await new ContractFactory(
    artifact.abi,
    artifact.bytecode,
    admin
  ).deploy(...args);
  await c.waitForDeployment();
  return c;
}
const token = await deploy("mocks/MockUSDT"),
  et = await deploy("EcosystemToken", [admin.address, 0]),
  w = await deploy("USDTcWrapper", [admin.address, relayer.address]),
  sz = await deploy("SZToken", [
    await w.getAddress(),
    await et.getAddress(),
    treasury.address,
    admin.address,
    1000000n * 1000000n,
  ]);
await (await et.bindMinter(await sz.getAddress())).wait();
const adapter = await deploy("SourceDepositAdapter", [
  await token.getAddress(),
  treasury.address,
  admin.address,
  31337,
  await w.getAddress(),
  1000000,
  100000000000,
]);
await (await w.configureSource(31337, await adapter.getAddress())).wait();
await (await token.mint(user.address, 100000000)).wait();
await (
  await token.connect(user).approve(await adapter.getAddress(), 100000000)
).wait();
await (await adapter.connect(user).deposit(100000000, user.address)).wait();
await p.send("evm_mine", []);
const config = {
  chainId: 31337,
  rpc,
  sz: await sz.getAddress(),
  et: await et.getAddress(),
  wrapper: await w.getAddress(),
  startBlock: 0,
  confirmations: 1,
  sources: [
    {
      name: "Local source test",
      chainId: 31337,
      rpc,
      token: await token.getAddress(),
      treasury: treasury.address,
      adapter: await adapter.getAddress(),
      startBlock: 0,
      confirmations: 1,
      explorer: "",
    },
  ],
};
const store = new Store(":memory:");
const bridge = new Bridge(config, store, { signer: relayer });
await bridge.tick();
assert.equal(await w.balanceOf(user.address), 100000000n);
await p.send("evm_mine", []);
await new Promise((r) => setTimeout(r, 300));
await bridge.tick();
assert.equal(store.deposits()[0].state, "MINTED");
assert.ok(store.deposits()[0].mintTx);
const restarted = new Bridge(config, store, { signer: relayer });
await restarted.tick();
assert.equal(await w.totalSupply(), 100000000n);
await (await w.connect(user).approve(await sz.getAddress(), 100000000)).wait();
await (
  await sz
    .connect(user)
    .purchase(100000000, 100000000, Math.floor(Date.now() / 1000) + 600)
).wait();
await p.send("evm_mine", []);
await indexProtocol(createProtocol(config), store, config);
assert.equal((await sz.packages(1)).amount, 100000000n);
assert.equal(await sz.balanceOf(user.address), 0n);
assert.equal(await sz.outstandingSZ(), 100000000n);
assert.ok(store.events(user.address).some((e) => e.type === "PackageCreated"));
fs.writeFileSync(
  "/private/tmp/swiz-local-deployment.json",
  JSON.stringify(config, null, 2)
);
console.log(
  "PASS: source treasury deposit -> finalized relayer verification -> one mint -> restart idempotency -> custody purchase -> verified history"
);
store.close();
