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
  const pk = process.env.ADMIN_PRIVATE_KEY || process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Missing PRIVATE_KEY, ADMIN_PRIVATE_KEY, or POLYGON_AMOY_PRIVATE_KEY in environment");
  const adminAddr = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  console.log(`Admin Wallet address: ${wallet.address}`);
  const bal = await provider.getBalance(wallet.address);
  console.log(`Admin POL balance: ${ethers.formatEther(bal)} POL`);

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/USDTcWrapper.sol/USDTcWrapper.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying Open USDTcWrapper (No relayer role required)...");
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 130n) / 100n : ethers.parseUnits("35", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 130n) / 100n : ethers.parseUnits("30", "gwei");

  const wrapper = await factory.deploy(adminAddr, {
    maxFeePerGas,
    maxPriorityFeePerGas
  });
  console.log("Deployment tx hash:", wrapper.deploymentTransaction()?.hash);
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log(`✓ Open USDTcWrapper deployed at: ${wrapperAddr}`);

  // Configure source 80002 -> 0x098DeA8e03381E8187F472308004530D52E5A0df
  const adapterAmoy = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  console.log(`Configuring source 80002 -> ${adapterAmoy}...`);
  const tx1 = await wrapper.configureSource(80002, adapterAmoy, { maxFeePerGas, maxPriorityFeePerGas });
  await tx1.wait();
  console.log("✓ Source 80002 configured!");

  // Configure source 97 -> 0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F
  const adapterBsc = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";
  console.log(`Configuring source 97 -> ${adapterBsc}...`);
  const tx2 = await wrapper.configureSource(97, adapterBsc, { maxFeePerGas, maxPriorityFeePerGas });
  await tx2.wait();
  console.log("✓ Source 97 configured!");

  console.log("==================================================");
  console.log("DEPLOYMENT COMPLETE! Open USDTcWrapper Address:");
  console.log(`NEW WRAPPER ADDRESS: ${wrapperAddr}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
