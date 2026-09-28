import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AMOY_WRAPPER_ADDRESS = "0xAfECBA18585f6C9eb120fD89a56B53243856a4fB";
const TREASURY_ADDRESS = "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926";
const ADMIN_ADDRESS = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  
  console.log("==================================================");
  console.log("Deploying Contracts to Ethereum Sepolia Testnet (Chain ID 11155111)");
  console.log(`Deployer Wallet: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Sepolia ETH Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("==================================================");

  if (balance === 0n) {
    throw new Error("Deployer wallet has 0 ETH on Sepolia Testnet. Please fund wallet with Sepolia ETH.");
  }

  // 1. Deploy Sepolia MockUSDT
  console.log("\n[1/3] Deploying MockUSDT on Sepolia Testnet...");
  const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
  const usdtContract = await MockUSDTFactory.deploy();
  await usdtContract.waitForDeployment();
  const usdtAddress = await usdtContract.getAddress();
  console.log(`✓ Sepolia MockUSDT deployed at: ${usdtAddress}`);

  // Mint 100,000 Sepolia USDT to deployer for testing (100,000 * 10^6)
  console.log("Minting 100,000 Sepolia USDT to deployer...");
  const mintTx = await (usdtContract as any).mint(deployer.address, 100_000_000_000n);
  await mintTx.wait();
  console.log("✓ Minted 100,000 Sepolia USDT to deployer");

  // 2. Deploy SourceDepositAdapter on Sepolia Testnet
  console.log("\n[2/3] Deploying SourceDepositAdapter on Sepolia Testnet...");
  const AdapterFactory = await ethers.getContractFactory("SourceDepositAdapter");
  // Constructor args: [usdt, treasury_, admin, destinationChainId (80002), destinationWrapper, minDeposit (1 USDT = 1_000_000), maxDeposit (1M USDT)]
  const adapterContract = await AdapterFactory.deploy(
    usdtAddress,
    TREASURY_ADDRESS,
    ADMIN_ADDRESS,
    80002n, // Destination Chain ID: Polygon Amoy
    AMOY_WRAPPER_ADDRESS,
    1_000_000n, // $1 USDT min
    1_000_000_000_000n // $1,000,000 USDT max
  );
  await adapterContract.waitForDeployment();
  const adapterAddress = await adapterContract.getAddress();
  console.log(`✓ Sepolia SourceDepositAdapter deployed at: ${adapterAddress}`);

  // Output JSON summary for application update
  const output = {
    sepoliaChainId: 11155111,
    sepoliaUsdtAddress: usdtAddress,
    sepoliaAdapterAddress: adapterAddress,
    amoyWrapperAddress: AMOY_WRAPPER_ADDRESS,
    treasuryAddress: TREASURY_ADDRESS,
    deployerAddress: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, "../sepolia-deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nDeployment details saved to ${outputPath}`);

  console.log("\n==================================================");
  console.log("SEPOLIA (CHAIN ID 11155111) DEPLOYMENT COMPLETE!");
  console.log(`Sepolia USDT Token:       ${usdtAddress}`);
  console.log(`Sepolia Deposit Adapter:  ${adapterAddress}`);
  console.log(`Polygon Amoy USDT.c Wrapper:  ${AMOY_WRAPPER_ADDRESS}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
