import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpc = "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpc);

  // Deployer or Admin wallet
  const deployerKey = process.env.POLYGON_AMOY_PRIVATE_KEY;
  if (!deployerKey) throw new Error("POLYGON_AMOY_PRIVATE_KEY not set in .env");
  const signer = new ethers.Wallet(deployerKey.startsWith("0x") ? deployerKey : "0x" + deployerKey, provider);

  const deployment = JSON.parse(fs.readFileSync(path.resolve("../config/deployment.json"), "utf8"));
  const szAddress = deployment.sz;
  console.log(`Connecting to SZToken at ${szAddress} using signer ${signer.address}...`);

  const szArtifact = JSON.parse(fs.readFileSync(path.resolve("./artifacts/contracts/SZToken.sol/SZToken.json"), "utf8"));
  const szContract = new ethers.Contract(szAddress, szArtifact.abi, signer);

  // Check stats before
  const priceBefore = await szContract.getCurrentPrice();
  const nextPkgBefore = await szContract.nextPackageId();
  console.log(`Before Batch: Next Package ID = ${nextPkgBefore}, Price = ${ethers.formatUnits(priceBefore, 6)} USD`);

  // Prepare a batch of 3 test offline sales
  const currentBlock = await provider.getBlock("latest");
  const now = currentBlock ? currentBlock.timestamp : Math.floor(Date.now() / 1000);

  const batchSales = [
    {
      buyer: "0x32D716c34A94010D8a8f5e8b3e29C210Ed16349F",
      amount: 150n * 10n ** 6n, // 150 SZ
      value: 150n * 10n ** 6n,  // 150 USD
      price: 1000000n,          // $1.00
      purchasedAt: BigInt(now - 7200),
      startedAt: BigInt(now - 7200),
      referenceId: ethers.keccak256(ethers.toUtf8Bytes(`BATCH_SALE_001_${Date.now()}`)),
    },
    {
      buyer: "0xaf70139970e12f96ca558cd222a99d05142c9505",
      amount: 300n * 10n ** 6n, // 300 SZ
      value: 300n * 10n ** 6n,  // 300 USD
      price: 1000000n,          // $1.00
      purchasedAt: BigInt(now - 3600),
      startedAt: BigInt(now - 3600),
      referenceId: ethers.keccak256(ethers.toUtf8Bytes(`BATCH_SALE_002_${Date.now()}`)),
    },
    {
      buyer: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
      amount: 500n * 10n ** 6n, // 500 SZ
      value: 500n * 10n ** 6n,  // 500 USD
      price: 1000000n,          // $1.00
      purchasedAt: BigInt(now - 1800),
      startedAt: BigInt(now - 1800),
      referenceId: ethers.keccak256(ethers.toUtf8Bytes(`BATCH_SALE_003_${Date.now()}`)),
    },
  ];

  console.log(`Submitting batch of ${batchSales.length} offline sales in 1 SINGLE transaction...`);
  const gasPrice = ethers.parseUnits("30", "gwei");
  const tx = await szContract.recordOfflineSalesBatch(batchSales, { gasPrice });
  console.log(`Transaction sent! Tx Hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait(1);
  console.log(`✓ Confirmed in block ${receipt.blockNumber}! Gas used: ${receipt.gasUsed.toString()}`);

  const nextPkgAfter = await szContract.nextPackageId();
  console.log(`After Batch: Next Package ID = ${nextPkgAfter} (added ${nextPkgAfter - nextPkgBefore} packages)`);

  console.log("\n==================================================");
  console.log("BATCH TEST SUCCESSFUL!");
  console.log(`Tx Hash: https://amoy.polygonscan.com/tx/${tx.hash}`);
  console.log("==================================================");
}

main().catch(console.error);
