import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const randomUser = ethers.Wallet.createRandom().connect(ethers.provider);

  console.log(`Deployer / Treasury Wallet: ${deployer.address}`);
  console.log(`Testing with User Wallet:  ${randomUser.address}`);

  // Send gas POL to randomUser
  const fundTx = await deployer.sendTransaction({
    to: randomUser.address,
    value: ethers.parseEther("0.01"),
  });
  await fundTx.wait();

  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress);
  const usdt = await ethers.getContractAt("MockUSDT", "0x9effc8c62f9077EDB785E6482328A7BfD7eAbe9f");

  // Mint USDT to randomUser
  await (await usdt.mint(randomUser.address, 1_000_000_000n)).wait();

  // Approve & Deposit as randomUser
  const usdtUser = usdt.connect(randomUser) as any;
  await (await usdtUser.approve(adapterAddress, 1_000_000_000n)).wait();

  const adapterUser = adapter.connect(randomUser) as any;
  const depositTx = await adapterUser.deposit(1_000_000_000n, randomUser.address);
  const receipt = await depositTx.wait();

  console.log("==================================================");
  console.log("USER DEPOSIT VERIFICATION SUCCESSFUL!");
  console.log(`Transaction Hash: ${receipt?.hash}`);
  console.log(`Polygonscan Link: https://amoy.polygonscan.com/tx/${receipt?.hash}`);
  console.log("==================================================");
}

main().catch(console.error);
