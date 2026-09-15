import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpc = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";
  const pk = process.env.DEPLOYER_PRIVATE_KEY || process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Missing PRIVATE_KEY, DEPLOYER_PRIVATE_KEY, or POLYGON_AMOY_PRIVATE_KEY in environment");
  const adminAddr = process.env.ADMIN_WALLET || "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  console.log(`Deployer address: ${wallet.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} POL`);

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/USDTcWrapper.sol/USDTcWrapper.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying open USDTcWrapper (no relayer role required)...");
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 120n) / 100n : ethers.parseUnits("30", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : ethers.parseUnits("25", "gwei");

  const wrapper = await factory.deploy(adminAddr, {
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit: 1200000
  });
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
  console.log("SUCCESS! Open USDTcWrapper contract deployed:");
  console.log(`NEW WRAPPER ADDRESS: ${wrapperAddr}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
