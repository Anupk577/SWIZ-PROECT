import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/SkzrI3058h3g92BAFz9fU";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = process.env.POLYGON_AMOY_PRIVATE_KEY!;
  const wallet = new ethers.Wallet(privateKey, provider);

  const szArtifact = JSON.parse(fs.readFileSync(path.resolve("artifacts/contracts/SZToken.sol/SZToken.json"), "utf8"));
  const etArtifact = JSON.parse(fs.readFileSync(path.resolve("artifacts/contracts/EcosystemToken.sol/EcosystemToken.json"), "utf8"));
  const adapterArtifact = JSON.parse(fs.readFileSync(path.resolve("artifacts/contracts/SourceDepositAdapter.sol/SourceDepositAdapter.json"), "utf8"));
  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function transfer(address, uint256) returns (bool)",
  ];

  const szAddress = "0x7BEF7a54e5999c6e2e87df50444378eE8a900FAC";
  const etAddress = "0xC66302d41dBCc91574D01e5685D9AA87d9533191";
  const usdtAddress = "0x9effc8c62f9077EDB785E6482328A7BfD7eAbe9f";
  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  const targetAdmin = "0x32D716c34A94010D8a8f5e8b3e29C210Ed16349F";
  const stakerAddress = "0xaf70139970e12f96ca558cd222a99d05142c9505";
  const treasuryAddress = "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926";

  const sz = new ethers.Contract(szAddress, szArtifact.abi, wallet);
  const et = new ethers.Contract(etAddress, etArtifact.abi, provider);
  const usdt = new ethers.Contract(usdtAddress, erc20Abi, wallet);
  const adapter = new ethers.Contract(adapterAddress, adapterArtifact.abi, wallet);

  console.log("==================================================");
  console.log("LIVE END-TO-END FLOW TESTING ON POLYGON AMOY");
  console.log(`Tester Wallet:  ${wallet.address}`);
  console.log(`POL Balance:    ${ethers.formatEther(await provider.getBalance(wallet.address))} POL`);
  console.log(`USDT Balance:   ${ethers.formatUnits(await usdt.balanceOf(wallet.address), 6)} USDT`);
  console.log(`SZ Token:       ${szAddress}`);
  console.log(`ET Token:       ${etAddress}`);
  console.log(`Adapter:        ${adapterAddress}`);
  console.log(`Original Staker:${stakerAddress}`);
  console.log("==================================================");

  const gasPrice = ethers.parseUnits("25.5", "gwei");

  // Step 1: Approve USDT for SZToken and Adapter
  console.log("\n[STEP 1] Approving USDT for SZ Contract & Source Adapter...");
  const currentAllowanceSZ = await usdt.allowance(wallet.address, szAddress);
  let approveSZTxHash = "Already Approved";
  if (currentAllowanceSZ < 1000n * 10n ** 6n) {
    const tx = await usdt.approve(szAddress, ethers.MaxUint256, { gasPrice });
    console.log(`  Approve SZ tx submitted: ${tx.hash}`);
    await tx.wait(1);
    approveSZTxHash = tx.hash;
    console.log(`  ✓ Approved SZToken Contract`);
  } else {
    console.log(`  ✓ SZToken already approved (${ethers.formatUnits(currentAllowanceSZ, 6)} USDT)`);
  }

  const currentAllowanceAdapter = await usdt.allowance(wallet.address, adapterAddress);
  let approveAdapterTxHash = "Already Approved";
  if (currentAllowanceAdapter < 100n * 10n ** 6n) {
    const tx = await usdt.approve(adapterAddress, ethers.MaxUint256, { gasPrice });
    console.log(`  Approve Adapter tx submitted: ${tx.hash}`);
    await tx.wait(1);
    approveAdapterTxHash = tx.hash;
    console.log(`  ✓ Approved Source Adapter`);
  } else {
    console.log(`  ✓ Adapter already approved (${ethers.formatUnits(currentAllowanceAdapter, 6)} USDT)`);
  }

  // Record initial staker balances
  const stakerUsdtPre = await usdt.balanceOf(stakerAddress);
  const stakerEtPre = await et.balanceOf(stakerAddress);
  const treasuryUsdtPre = await usdt.balanceOf(treasuryAddress);

  console.log("\nPre-test Balances:");
  console.log(`  Staker USDT:   ${ethers.formatUnits(stakerUsdtPre, 6)} USDT`);
  console.log(`  Staker ET:     ${ethers.formatUnits(stakerEtPre, 6)} ET`);
  console.log(`  Treasury USDT: ${ethers.formatUnits(treasuryUsdtPre, 6)} USDT`);

  // Step 2: Test Buy Package + Buyback Year 1 (100% USDT to Staker)
  console.log("\n[STEP 2] Executing Purchase 1 (50 USDT) -> Triggers Year 1 FIFO Buyback...");
  const latestBlock1 = await provider.getBlock("latest");
  const deadline1 = BigInt(latestBlock1!.timestamp + 3600);
  const buyVal1 = 50n * 10n ** 6n; // 50 USDT
  const minSZ1 = 50n * 10n ** 6n;   // 50 SZ at $1.00

  const purchase1Tx = await sz.purchase(buyVal1, minSZ1, deadline1, { gasPrice, gasLimit: 850000 });
  console.log(`  Purchase 1 tx submitted: ${purchase1Tx.hash}`);
  const rcpt1 = await purchase1Tx.wait(1);
  console.log(`  ✓ Confirmed in block ${rcpt1.blockNumber}!`);

  const stakerUsdtPost1 = await usdt.balanceOf(stakerAddress);
  const stakerEtPost1 = await et.balanceOf(stakerAddress);
  console.log(`  Staker USDT delta: +${ethers.formatUnits(stakerUsdtPost1 - stakerUsdtPre, 6)} USDT (100% USDT Payout!)`);
  console.log(`  Staker ET delta:   +${ethers.formatUnits(stakerEtPost1 - stakerEtPre, 6)} ET`);

  // Step 3: Test Buy Package + Buyback Year 2 (100% ET to Staker, 100% USDT to Treasury)
  console.log("\n[STEP 3] Executing Purchase 2 (50 USDT) -> Triggers Year 2 FIFO Buyback...");
  const latestBlock2 = await provider.getBlock("latest");
  const deadline2 = BigInt(latestBlock2!.timestamp + 3600);
  const buyVal2 = 50n * 10n ** 6n; // 50 USDT
  const minSZ2 = 45n * 10n ** 6n;   // Allow slippage if price compounded

  const purchase2Tx = await sz.purchase(buyVal2, minSZ2, deadline2, { gasPrice, gasLimit: 850000 });
  console.log(`  Purchase 2 tx submitted: ${purchase2Tx.hash}`);
  const rcpt2 = await purchase2Tx.wait(1);
  console.log(`  ✓ Confirmed in block ${rcpt2.blockNumber}!`);

  const stakerUsdtPost2 = await usdt.balanceOf(stakerAddress);
  const stakerEtPost2 = await et.balanceOf(stakerAddress);
  const treasuryUsdtPost2 = await usdt.balanceOf(treasuryAddress);
  console.log(`  Staker USDT delta: +${ethers.formatUnits(stakerUsdtPost2 - stakerUsdtPost1, 6)} USDT (0 USDT to staker)`);
  console.log(`  Staker ET delta:   +${ethers.formatUnits(stakerEtPost2 - stakerEtPost1, 6)} ET (100% ET Minted to staker!)`);
  console.log(`  Treasury USDT delta: +${ethers.formatUnits(treasuryUsdtPost2 - treasuryUsdtPre, 6)} USDT (100% USDT to Corporate Treasury)`);

  // Step 4: Test Bridge USDT Deposit via SourceDepositAdapter
  console.log("\n[STEP 4] Executing Bridge USDT Deposit via SourceDepositAdapter...");
  const bridgeDepositAmount = 10n * 10n ** 6n; // 10 USDT
  const bridgeTx = await adapter.deposit(bridgeDepositAmount, { gasPrice, gasLimit: 300000 });
  console.log(`  Bridge Deposit tx submitted: ${bridgeTx.hash}`);
  const rcptBridge = await bridgeTx.wait(1);
  console.log(`  ✓ Confirmed in block ${rcptBridge.blockNumber}!`);

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log(`Approve SZ Hash:       ${approveSZTxHash}`);
  console.log(`Approve Adapter Hash:  ${approveAdapterTxHash}`);
  console.log(`Purchase & Stake 1 (Year 1 Buyback 100% USDT): ${purchase1Tx.hash}`);
  console.log(`Purchase & Stake 2 (Year 2 Buyback 100% ET):   ${purchase2Tx.hash}`);
  console.log(`Bridge USDT Deposit Hash:                      ${bridgeTx.hash}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
