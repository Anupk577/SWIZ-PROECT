import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const user2 = ethers.Wallet.createRandom().connect(ethers.provider);

  // Send POL for gas to user2
  console.log("Funding user2 with 0.1 POL...");
  const fundTx = await deployer.sendTransaction({
    to: user2.address,
    value: ethers.parseEther("0.1"),
  });
  await fundTx.wait();

  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress);
  const tokenAddress = await adapter.token();
  const treasuryAddress = await adapter.treasury();

  console.log(`Adapter:          ${adapterAddress}`);
  console.log(`Token:            ${tokenAddress}`);
  console.log(`Treasury:         ${treasuryAddress}`);
  console.log(`User2 Address:    ${user2.address}`);

  const usdt = await ethers.getContractAt("MockUSDT", tokenAddress);

  console.log("1. Minting 1,000 MockUSDT to user2...");
  await (await usdt.mint(user2.address, 1_000_000_000n)).wait();
  console.log("✓ Minted 1,000 MockUSDT to user2");

  console.log("2. Approving adapter on user2...");
  const usdtAsUser2 = usdt.connect(user2) as any;
  await (await usdtAsUser2.approve(adapterAddress, 1_000_000_000n)).wait();
  console.log("✓ Approved adapter on user2");

  console.log("3. Executing deposit(1000000000, user2) as user2...");
  const adapterAsUser2 = adapter.connect(user2) as any;
  const tx = await adapterAsUser2.deposit(1_000_000_000n, user2.address);
  const receipt = await tx.wait();
  console.log(`==================================================`);
  console.log(`✓ DEPOSIT TRANSACTION SUCCESS!`);
  console.log(`Tx Hash: ${receipt?.hash}`);
  console.log(`==================================================`);
}

main().catch(console.error);
