import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpc = "https://polygon-amoy-bor-rpc.publicnode.com";
  const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!adminKey || !deployerKey) throw new Error("Missing ADMIN_PRIVATE_KEY, POLYGON_AMOY_PRIVATE_KEY, or DEPLOYER_PRIVATE_KEY in environment");

  const provider = new ethers.JsonRpcProvider(rpc);
  const adminWallet = new ethers.Wallet(adminKey, provider);
  const deployerWallet = new ethers.Wallet(deployerKey, provider);

  console.log(`Admin address: ${adminWallet.address}`);
  console.log(`Deployer address: ${deployerWallet.address}`);

  const adminBal = await provider.getBalance(adminWallet.address);
  const deployerBal = await provider.getBalance(deployerWallet.address);

  console.log(`Admin balance: ${ethers.formatEther(adminBal)} POL`);
  console.log(`Deployer balance: ${ethers.formatEther(deployerBal)} POL`);

  // Transfer skipped, deployer already funded

  const updatedDeployerBal = await provider.getBalance(deployerWallet.address);
  console.log(`Updated Deployer balance: ${ethers.formatEther(updatedDeployerBal)} POL`);

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/USDTcWrapper.sol/USDTcWrapper.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployerWallet);

  console.log("Deploying open USDTcWrapper (no relayer role required)...");
  const gasPrice = ethers.parseUnits("20", "gwei");

  const wrapper = await factory.deploy(adminWallet.address, {
    gasPrice,
    gasLimit: 500000
  });
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log(`✓ Open USDTcWrapper deployed at: ${wrapperAddr}`);

  // Configure source 80002 -> 0x098DeA8e03381E8187F472308004530D52E5A0df
  const adapterAmoy = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  console.log(`Configuring source 80002 -> ${adapterAmoy}...`);
  const tx1 = await wrapper.configureSource(80002, adapterAmoy, { gasPrice, gasLimit: 80000 });
  await tx1.wait();
  console.log("✓ Source 80002 configured!");

  // Configure source 97 -> 0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F
  const adapterBsc = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";
  console.log(`Configuring source 97 -> ${adapterBsc}...`);
  const tx2 = await wrapper.configureSource(97, adapterBsc, { gasPrice, gasLimit: 80000 });
  await tx2.wait();
  console.log("✓ Source 97 configured!");

  console.log("==================================================");
  console.log("SUCCESS! Open USDTcWrapper contract deployed:");
  console.log(`NEW WRAPPER ADDRESS: ${wrapperAddr}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
