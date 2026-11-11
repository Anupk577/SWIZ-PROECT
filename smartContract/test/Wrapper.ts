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
    // Non-relayer must be blocked
    await expect(
      w.connect(user).mintDeposit(user.address, 1000000, 1, adapter.address, 3, tx)
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
  it("SWZ-H-03: enforces maxDepositLimit on USDTcWrapper", async () => {
    const [a, r, user, adapter] = await ethers.getSigners();
    const w = await ethers.deployContract("USDTcWrapper", [
      a.address,
      r.address,
    ]);
    await w.configureSource(1, adapter.address);
    // Admin sets maxDepositLimit to 500,000 USDT.c
    await expect(w.setMaxDepositLimit(500000))
      .to.emit(w, "MaxDepositLimitUpdated")
      .withArgs(0, 500000);
    expect(await w.maxDepositLimit()).eq(500000);

    // Non-admin cannot set limit
    await expect(w.connect(user).setMaxDepositLimit(1000000)).revert(ethers);

    // Minting amount exceeding limit reverts
    const tx = ethers.id("tx1");
    await expect(
      w.connect(r).mintDeposit(user.address, 600000, 1, adapter.address, 1, tx)
    ).revert(ethers);

    // Minting within limit succeeds
    await w.connect(r).mintDeposit(user.address, 500000, 1, adapter.address, 1, tx);
    expect(await w.balanceOf(user.address)).eq(500000);
  });
  it("SWZ-M-03 & SWZ-L-02: allows admin to update treasury and emits destination in Deposited event", async () => {
    const [a, treasury, user, newTreasury] = await ethers.getSigners();
    const token = await ethers.deployContract("MockUSDT");
    const destChainId = 84532;
    const destWrapper = user.address;
    const adapter = await ethers.deployContract("SourceDepositAdapter", [
      await token.getAddress(),
      treasury.address,
      a.address,
      destChainId,
      destWrapper,
      1000000,
      100000000,
    ]);

    // Update treasury
    await expect(adapter.setTreasury(newTreasury.address))
      .to.emit(adapter, "TreasuryUpdated")
      .withArgs(treasury.address, newTreasury.address);
    expect(await adapter.treasury()).eq(newTreasury.address);

    // Zero address rejected
    await expect(adapter.setTreasury(ethers.ZeroAddress)).revert(ethers);

    // Deposit to new treasury emits all fields including destinationChainId and destinationWrapper
    await token.mint(user.address, 2000000);
    await token.connect(user).approve(await adapter.getAddress(), 2000000);
    await expect(adapter.connect(user).deposit(2000000, user.address))
      .to.emit(adapter, "Deposited")
      .withArgs(1, user.address, user.address, 2000000, 2000000, destChainId, destWrapper);
  });
});
