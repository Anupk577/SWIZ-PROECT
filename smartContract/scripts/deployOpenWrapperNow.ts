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

  console.log(`Deployer address: ${wallet.address}`);
  const bal = await provider.getBalance(wallet.address);
  console.log(`Deployer balance: ${ethers.formatEther(bal)} POL`);

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/USDTcWrapper.sol/USDTcWrapper.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying OPEN USDTcWrapper (No relayer role, open to any user wallet)...");
  const gasPrice = ethers.parseUnits("25", "gwei");

  const wrapper = await factory.deploy(adminAddr, {
    type: 2,
    maxFeePerGas: 25000000005n,
    maxPriorityFeePerGas: 25000000000n,
    gasLimit: 260000
  });
  console.log("Deployment tx sent:", wrapper.deploymentTransaction()?.hash);
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log(`✓ OPEN USDTcWrapper deployed at: ${wrapperAddr}`);

  // Configure source 80002 -> 0x098DeA8e03381E8187F472308004530D52E5A0df
  const adapterAmoy = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  console.log(`Configuring source 80002 -> ${adapterAmoy}...`);
  const tx1 = await wrapper.configureSource(80002, adapterAmoy, { gasPrice, gasLimit: 70000 });
  await tx1.wait();
  console.log("✓ Source 80002 configured!");

  // Configure source 97 -> 0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F
  const adapterBsc = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";
  console.log(`Configuring source 97 -> ${adapterBsc}...`);
  const tx2 = await wrapper.configureSource(97, adapterBsc, { gasPrice, gasLimit: 70000 });
  await tx2.wait();
  console.log("✓ Source 97 configured!");

  console.log("==================================================");
  console.log("ALL SUCCESSFUL!");
  console.log(`NEW OPEN WRAPPER ADDRESS: ${wrapperAddr}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
