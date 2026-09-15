import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log(`Testing Deposit on Polygon Amoy with deployer: ${deployer.address}`);

  const usdtAddress = "0x810DcCaA5026666F93853575b452EcB2F8398FC9";
  const adapterAddress = "0x693C018a441662aEC9377b2F25E59c1D6300d67e";

  const usdt = await ethers.getContractAt("MockUSDT", usdtAddress, deployer);
  const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress, deployer);

  // 1. Mint 100 USDT to deployer if needed
  const usdtBalance = await usdt.balanceOf(deployer.address);
  console.log(`Current USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);

  if (usdtBalance < 100_000_000n) {
    console.log("Minting 10,000 USDT to deployer...");
    const mintTx = await usdt.mint(deployer.address, 10_000_000_000n);
    await mintTx.wait();
    console.log("✓ Minted 10,000 USDT");
  }

  // 2. Approve Adapter
  console.log("Approving SourceDepositAdapter...");
  const approveTx = await usdt.approve(adapterAddress, 100_000_000n);
  await approveTx.wait();
  console.log("✓ Approved 100 USDT to SourceDepositAdapter");

  // 3. Check Allowance
  const allowance = await usdt.allowance(deployer.address, adapterAddress);
  console.log(`Current Allowance: ${ethers.formatUnits(allowance, 6)} USDT`);

  // 4. Call Deposit
  console.log("Calling deposit(100_000_000, deployer.address)...");
  const depositTx = await adapter.deposit(100_000_000n, deployer.address, { gasLimit: 500000 });
  const receipt = await depositTx.wait();
  console.log(`✓ Deposit Succeeded! Tx Hash: ${receipt?.hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
