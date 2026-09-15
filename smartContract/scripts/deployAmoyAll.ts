import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  if (!deployer) throw Error("Configure deployer private key");

  console.log("==================================================");
  console.log("Deploying Swiz Smart Ecosystem to Polygon Amoy");
  console.log(`Deployer Address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`POL Balance:      ${ethers.formatEther(balance)} POL`);
  console.log("==================================================");

  const adminAddress = ethers.getAddress((process.env.ADMIN_WALLET || deployer.address).toLowerCase());
  const treasuryAddress = ethers.getAddress((process.env.ECOSYSTEM_WALLET || deployer.address).toLowerCase());

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : ethers.parseUnits("40", "gwei");
  console.log(`Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  const usdtAddress = "0x810DcCaA5026666F93853575b452EcB2F8398FC9";
  const etAddress = "0x06837bafe39454EeeAbf06A594c2e284a8E54f66";
  const szAddress = "0xAfB1d83EF86b9D53be31D06CBAc9bE05b565a594";
  const wrapperAddress = "0x29741866D0E40e9912Fb7Bd837e499e28733FbB1";

  // Deploy SourceDepositAdapter
  console.log("[1/1] Deploying SourceDepositAdapter...");
  const adapter = await ethers.deployContract(
    "SourceDepositAdapter",
    [usdtAddress, treasuryAddress, adminAddress, 80002n, wrapperAddress, 1_000_000n, 1_000_000_000_000n],
    { gasPrice, gasLimit: 3000000 }
  );
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log(`✓ SourceDepositAdapter deployed at: ${adapterAddress}`);

  console.log("==================================================");
  console.log("DEPLOYMENT COMPLETE (Polygon Amoy Testnet, Chain ID 80002):");
  console.log(`MockUSDT:             ${usdtAddress}`);
  console.log(`EcosystemToken:       ${etAddress}`);
  console.log(`SZToken:              ${szAddress}`);
  console.log(`USDTcWrapper:         ${wrapperAddress}`);
  console.log(`SourceDepositAdapter: ${adapterAddress}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
