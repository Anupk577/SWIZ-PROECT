import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw Error("Configure deployer private key");

  console.log("==================================================");
  console.log("DEPLOYING UPDATED SZTOKEN SYSTEM (Polygon Amoy - 80002)");
  console.log(`Deployer Address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`POL Balance:      ${ethers.formatEther(balance)} POL`);
  console.log("==================================================");

  const adminAddress = deployer.address;
  const treasuryAddress = "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926";
  const usdtAddress = "0x9effc8c62f9077EDB785E6482328A7BfD7eAbe9f";
  const wrapperAddress = "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 125n) / 100n : ethers.parseUnits("50", "gwei");
  console.log(`Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  // 1. Deploy EcosystemToken
  console.log("\n[1/3] Deploying EcosystemToken (ET)...");
  const et = await ethers.deployContract("EcosystemToken", [deployer.address, 0n], { gasPrice });
  await et.waitForDeployment();
  const etAddress = await et.getAddress();
  console.log(`✓ EcosystemToken deployed at: ${etAddress}`);

  // 2. Deploy SZToken with full functionality (replaceWallet, secondaryWallets, setWalletPaused)
  console.log("\n[2/3] Deploying updated SZToken...");
  const szSupply = 1_000_000_000n * 10n ** 6n; // 1 Billion SZ
  const sz = await ethers.deployContract(
    "SZToken",
    [usdtAddress, etAddress, treasuryAddress, adminAddress, szSupply],
    { gasPrice }
  );
  await sz.waitForDeployment();
  const szAddress = await sz.getAddress();
  console.log(`✓ SZToken deployed at: ${szAddress}`);

  // 3. Bind EcosystemToken minter to new SZToken
  console.log("\n[3/3] Binding ET minter to new SZToken...");
  const bindTx = await et.bindMinter(szAddress, { gasPrice });
  await bindTx.wait();
  console.log("✓ ET minter permanently bound to SZToken");

  // 4. Verify replaceWallet exists on newly deployed contract
  const code = await ethers.provider.getCode(szAddress);
  const iface = sz.interface;
  const replaceSelector = iface.getFunction("replaceWallet")!.selector.slice(2);
  const pauseSelector = iface.getFunction("setWalletPaused")!.selector.slice(2);
  console.log(`✓ replaceWallet selector: ${replaceSelector}, in bytecode: ${code.includes(replaceSelector)}`);
  console.log(`✓ setWalletPaused selector: ${pauseSelector}, in bytecode: ${code.includes(pauseSelector)}`);

  // 5. Migrate package 12 for 0xaf70139970e12f96ca558cd222a99d05142c9505
  console.log("\n[Optional] Migrating existing user package to new contract...");
  try {
    const userWallet = "0xaf70139970e12f96ca558cd222a99d05142c9505";
    const currentBlock = await ethers.provider.getBlock("latest");
    const nowTime = currentBlock ? currentBlock.timestamp : Math.floor(Date.now() / 1000);
    const saleData = {
      buyer: userWallet,
      amount: 1000n * 10n ** 6n,
      value: 1000n * 10n ** 6n,
      price: 1000000n,
      purchasedAt: BigInt(nowTime - 3600),
      startedAt: BigInt(nowTime - 3600),
      referenceId: ethers.keccak256(ethers.toUtf8Bytes(`migration_pkg_12_${Date.now()}`)),
    };
    const recTx = await sz.recordOfflineSale(saleData, { gasPrice });
    await recTx.wait();
    console.log(`✓ Staking package migrated for user ${userWallet}! Package ID: 1`);
  } catch (err: any) {
    console.warn("Could not migrate package:", err.message);
  }

  const startBlock = await ethers.provider.getBlockNumber();
  console.log(`\nDeployment completed at Block: ${startBlock}`);

  // Return deployment info
  return {
    szAddress,
    etAddress,
    usdtAddress,
    wrapperAddress,
    adapterAddress,
    startBlock,
  };
}

main()
  .then((res) => {
    console.log("\n==================================================");
    console.log("NEW CONTRACT ADDRESSES (Save to deployment config):");
    console.log(`SZToken:         ${res.szAddress}`);
    console.log(`EcosystemToken:  ${res.etAddress}`);
    console.log(`USDT:            ${res.usdtAddress}`);
    console.log(`Wrapper:         ${res.wrapperAddress}`);
    console.log(`Adapter:         ${res.adapterAddress}`);
    console.log(`StartBlock:      ${res.startBlock}`);
    console.log("==================================================");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
