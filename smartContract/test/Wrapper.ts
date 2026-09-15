import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.create();
describe("One-way wrapper and source adapter", () => {
  it("requires separate relayer, allowlists immutable source identity and prevents duplicates", async () => {
    const [a, r, user, adapter] = await ethers.getSigners();
    await expect(
      ethers.deployContract("USDTcWrapper", [a.address, a.address])
    ).revert(ethers);
    const w = await ethers.deployContract("USDTcWrapper", [
      a.address,
      r.address,
    ]);
    await w.configureSource(1, adapter.address);
    const tx = ethers.id("source");
    await w
      .connect(r)
      .mintDeposit(user.address, 1000000, 1, adapter.address, 1, tx);
    expect(await w.balanceOf(user.address)).eq(1000000);
    await expect(
      w.connect(r).mintDeposit(user.address, 1000000, 1, adapter.address, 1, tx)
    ).revert(ethers);
    await expect(
      w.connect(r).mintDeposit(user.address, 1000000, 2, adapter.address, 2, tx)
    ).revert(ethers);
  });
  it("transfers exact approved source token to treasury and normalizes decimals", async () => {
    const [a, treasury, user] = await ethers.getSigners();
    const token = await ethers.deployContract("MockUSDT");
    const adapter = await ethers.deployContract("SourceDepositAdapter", [
      await token.getAddress(),
      treasury.address,
      a.address,
      84532,
      user.address,
      1000000,
      100000000,
    ]);
    await token.mint(user.address, 2000000);
    await token.connect(user).approve(await adapter.getAddress(), 2000000);
    await expect(
      adapter.connect(user).deposit(2000000, user.address)
    ).changeTokenBalance(ethers, token, treasury, 2000000);
    expect(await adapter.nonce()).eq(1);
  });
});
