import { expect } from "chai";
import { network } from "hardhat";
const { ethers, networkHelpers } = await network.create();
const U = 1000000n,
  YEAR = 365 * 86400;
async function fixture() {
  const [admin, treasury, relayer, alice, bob] = await ethers.getSigners();
  const usdt = await ethers.deployContract("USDTcWrapper", [
    admin.address,
    relayer.address,
  ]);
  const et = await ethers.deployContract("EcosystemToken", [admin.address, 0]);
  const sz = await ethers.deployContract("SZToken", [
    await usdt.getAddress(),
    await et.getAddress(),
    treasury.address,
    admin.address,
    1000000n * U,
  ]);
  await et.bindMinter(await sz.getAddress());
  let n = 1;
  async function mint(w: any, a: bigint) {
    await usdt
      .connect(relayer)
      .mintDeposit(
        w.address,
        a,
        1,
        alice.address,
        n++,
        ethers.keccak256(ethers.toUtf8Bytes(String(n)))
      );
    await usdt.connect(w).approve(await sz.getAddress(), a);
  }
  await usdt.configureSource(1, alice.address);
  return { admin, treasury, alice, bob, usdt, et, sz, mint };
}
function sale(buyer: string, amount = 100n * U, start = 0) {
  return {
    buyer,
    amount,
    value: amount,
    price: U,
    purchasedAt: start || 1,
    startedAt: start || 1,
    referenceId: ethers.keccak256(
      ethers.toUtf8Bytes(`${buyer}-${amount}-${start}`)
    ),
  };
}
describe("SOW fixed supply, custody, pricing and packages", () => {
  it("mints fixed supply to treasury and buys into custody without changing supply", async () => {
    const { sz, usdt, alice, mint } = await fixture();
    await mint(alice, 100n * U);
    const supply = await sz.totalSupply();
    await sz
      .connect(alice)
      .purchase(100n * U, 100n * U, (await networkHelpers.time.latest()) + 60);
    expect(await sz.totalSupply()).eq(supply);
    expect(await sz.balanceOf(alice.address)).eq(0);
    expect(await sz.balanceOf(await sz.getAddress())).eq(100n * U);
    expect(await usdt.balanceOf(alice.address)).eq(0);
  });
  it("uses pre-transaction price and exact paid value for post-transaction counters", async () => {
    const { sz, alice, mint } = await fixture();
    await mint(alice, 100000n * U);
    await sz.setLimits(U, 100000n * U, 0);
    await sz
      .connect(alice)
      .purchase(
        100000n * U,
        100000n * U,
        (await networkHelpers.time.latest()) + 60
      );
    expect((await sz.packages(1)).originalPrice).eq(U);
    expect(await sz.totalStakedAmountUSD()).eq(100000n * U);
    expect(await sz.getCurrentPrice()).eq(1023300n);
  });
  it("creates one package and exact twenty-tranche sum with final dust", async () => {
    const { sz, alice } = await fixture();
    await sz.recordOfflineSale(sale(alice.address, 39n, 1));
    const s = await sz.getUnlockSchedule(1);
    expect(s.reduce((x: any, y: any) => x + y.quantity, 0n)).eq(39n);
    expect(s[0].quantity).eq(1n);
    expect(s[19].quantity).eq(20n);
  });
  it("rejects duplicates, future dates, zero output and enforces active package limit", async () => {
    const { sz, alice, bob, mint } = await fixture();
    const s = sale(alice.address, 20n, 1);
    await sz.recordOfflineSale(s);
    await expect(sz.recordOfflineSale(s)).revert(ethers);
    const future = {
      ...sale(bob.address, 20n, 2),
      startedAt: (await networkHelpers.time.latest()) + 1000,
    };
    await expect(sz.recordOfflineSale(future)).revert(ethers);
    await sz.setLimits(1, 100000n * U, 1);
    await mint(bob, 1n);
    await expect(
      sz
        .connect(bob)
        .purchase(1n, 1n, (await networkHelpers.time.latest()) + 60)
    ).revert(ethers);
  });
});
describe("SOW automatic FIFO and partial buybacks", () => {
  it("retains immature positions then pays Year 1 and creates a new buyer package", async () => {
    const { sz, usdt, alice, bob, mint } = await fixture();
    const now = await networkHelpers.time.latest();
    await sz.recordOfflineSale(sale(alice.address, 100n * U, now));
    await mint(bob, 5n * U);
    await sz.connect(bob).purchase(5n * U, 5n * U, now + 60);
    expect(await usdt.balanceOf(alice.address)).eq(0);
    await networkHelpers.time.increase(YEAR + 1);
    await mint(bob, 5n * U);
    await sz
      .connect(bob)
      .purchase(5n * U, 5n * U, (await networkHelpers.time.latest()) + 60);
    expect(await usdt.balanceOf(alice.address)).eq(5n * U);
    expect((await sz.getUnlockSchedule(1))[0].status).eq(2);
    expect((await sz.getUserPackageIds(bob.address)).length).eq(2);
  });
  it("tracks partial quantity once and never overpays a tranche", async () => {
    const { sz, usdt, alice, bob, mint } = await fixture();
    const now = await networkHelpers.time.latest();
    await sz.recordOfflineSale(sale(alice.address, 100n * U, now));
    await networkHelpers.time.increase(YEAR + 1);
    for (const a of [2n, 2n, 2n]) {
      await mint(bob, a * U);
      await sz
        .connect(bob)
        .purchase(a * U, a * U, (await networkHelpers.time.latest()) + 60);
    }
    expect(await usdt.balanceOf(alice.address)).eq(5n * U);
    expect((await sz.getUnlockSchedule(1))[0].boughtBack).eq(5n * U);
  });
  it("matches globally by earliest unlock timestamp", async () => {
    const { sz, usdt, alice, bob, mint } = await fixture();
    const now = (await networkHelpers.time.latest()) - 2 * YEAR;
    await sz.recordOfflineSale(sale(alice.address, 100n * U, now));
    await sz.recordOfflineSale(sale(bob.address, 100n * U, now + 100 * 86400));
    await networkHelpers.time.increase(500 * 86400);
    await mint(bob, 10n * U);
    await sz
      .connect(bob)
      .purchase(10n * U, 10n * U, (await networkHelpers.time.latest()) + 60);
    expect(await usdt.balanceOf(alice.address)).eq(5n * U);
    expect(await usdt.balanceOf(bob.address)).eq(5n * U);
  });
  it("mints Year 2 ET atomically and routes USDT to treasury", async () => {
    const { sz, usdt, et, treasury, alice, bob, mint } = await fixture();
    const now = await networkHelpers.time.latest();
    await sz.recordOfflineSale(sale(alice.address, 100n * U, now));
    await networkHelpers.time.increase(2 * YEAR + 1);
    await mint(bob, 10n * U);
    await sz
      .connect(bob)
      .purchase(10n * U, 10n * U, (await networkHelpers.time.latest()) + 60);
    expect(await usdt.balanceOf(alice.address)).eq(5n * U);
    expect(await et.balanceOf(alice.address)).eq(5n * U);
    expect(await usdt.balanceOf(treasury.address)).eq(5n * U);
    expect((await sz.packages(1)).etReceived).eq(5n * U);
  });
});
describe("SOW administrator, migration and emergency controls", () => {
  it("executes funded buyback without creating a package and can return unused funds", async () => {
    const { sz, usdt, admin, alice, mint } = await fixture();
    const now = await networkHelpers.time.latest();
    await sz.recordOfflineSale(sale(alice.address, 100n * U, now));
    await networkHelpers.time.increase(YEAR + 1);
    await mint(admin, 8n * U);
    await sz.addTreasuryFunds(8n * U);
    const before = await sz.totalStakingPackages();
    await sz.executeAdminBuyback(5n * U);
    expect(await sz.totalStakingPackages()).eq(before);
    await sz.withdrawTreasuryFunds(3n * U);
    expect(await sz.adminFunds()).eq(0);
  });
  it("imports historical fills once and closes migration", async () => {
    const { sz, alice } = await fixture();
    const now = await networkHelpers.time.latest();
    const start = now - 2 * YEAR;
    const fills = Array(20).fill(0n);
    fills[0] = 5n * U;
    fills[1] = 2n * U;
    await sz.importHistoricalSale(
      sale(alice.address, 100n * U, start),
      fills,
      2n * U,
      5n * U
    );
    expect((await sz.packages(1)).boughtBack).eq(7n * U);
    await sz.closeMigration();
    await expect(
      sz.importHistoricalSale(
        {
          ...sale(alice.address, 100n * U, start),
          referenceId: ethers.id("next"),
        },
        fills,
        0,
        0
      )
    ).revert(ethers);
  });
  it("pause blocks purchases and all SZ transfers", async () => {
    const { sz, alice, mint } = await fixture();
    await mint(alice, 20n * U);
    await sz.pause();
    await expect(
      sz
        .connect(alice)
        .purchase(20n * U, 20n * U, (await networkHelpers.time.latest()) + 60)
    ).revert(ethers);
    await expect(sz.transfer(alice.address, 1)).revert(ethers);
  });
  it("ET minter is permanently bound to SZ and arbitrary mint is impossible", async () => {
    const { et, sz, admin, alice } = await fixture();
    expect(await et.owner()).eq(ethers.ZeroAddress);
    expect(await et.minter()).eq(await sz.getAddress());
    await expect(et.connect(admin).mint(alice.address, U)).revert(ethers);
  });
});
describe("Accounting failure paths and conservation", () => {
  it("reverts all state and collateral movements when ET cap prevents settlement", async () => {
    const [a, t, r, alice, bob] = await ethers.getSigners();
    const w = await ethers.deployContract("USDTcWrapper", [
      a.address,
      r.address,
    ]);
    const e = await ethers.deployContract("EcosystemToken", [a.address, 1]);
    const s = await ethers.deployContract("SZToken", [
      await w.getAddress(),
      await e.getAddress(),
      t.address,
      a.address,
      1000n * U,
    ]);
    await e.bindMinter(await s.getAddress());
    await w.configureSource(1, alice.address);
    await w
      .connect(r)
      .mintDeposit(bob.address, 10n * U, 1, alice.address, 1, ethers.id("cap"));
    await w.connect(bob).approve(await s.getAddress(), 10n * U);
    await s.recordOfflineSale(
      sale(
        alice.address,
        100n * U,
        (await networkHelpers.time.latest()) - 2 * YEAR
      )
    );
    await expect(
      s
        .connect(bob)
        .purchase(10n * U, 10n * U, (await networkHelpers.time.latest()) + 60)
    ).revert(ethers);
    expect(await w.balanceOf(bob.address)).eq(10n * U);
    expect((await s.packages(1)).boughtBack).eq(0);
    expect(await s.outstandingSZ()).eq(100n * U);
  });
  it("conserves custody through varying partial fills over twenty years", async () => {
    const { sz, alice, bob, mint } = await fixture();
    const now = await networkHelpers.time.latest();
    await sz.recordOfflineSale(sale(alice.address, 100n * U, now));
    const supply = await sz.totalSupply();
    for (let year = 1; year <= 20; year++) {
      await networkHelpers.time.increase(YEAR);
      for (const q of [1n, 3n, 1n]) {
        await mint(bob, q * U);
        await sz
          .connect(bob)
          .purchase(q * U, q * U, (await networkHelpers.time.latest()) + 60);
        expect(await sz.totalSupply()).eq(supply);
        expect(await sz.balanceOf(await sz.getAddress())).eq(
          await sz.outstandingSZ()
        );
      }
    }
    const p = await sz.packages(1);
    expect(p.boughtBack <= p.amount).eq(true);
  });
  it("caps payout while preserving buyer quantity and sends price spread to treasury", async () => {
    const { sz, usdt, treasury, alice, bob, mint } = await fixture();
    const old = {
      ...sale(
        alice.address,
        100n * U,
        (await networkHelpers.time.latest()) - YEAR
      ),
      price: 1000n,
    };
    await sz.recordOfflineSale(old);
    await mint(bob, 5n * U);
    await sz
      .connect(bob)
      .purchase(5n * U, 5n * U, (await networkHelpers.time.latest()) + 60);
    expect(await usdt.balanceOf(alice.address)).eq(500000n);
    expect(await usdt.balanceOf(treasury.address)).eq(4500000n);
    expect((await sz.packages(2)).amount).eq(5n * U);
  });
  it("rejects purchase slippage and does not move payment", async () => {
    const { sz, usdt, alice, mint } = await fixture();
    await mint(alice, 10n * U);
    await expect(
      sz
        .connect(alice)
        .purchase(10n * U, 11n * U, (await networkHelpers.time.latest()) + 60)
    ).revert(ethers);
    expect(await usdt.balanceOf(alice.address)).eq(10n * U);
  });
});
