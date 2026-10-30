import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

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

  const targetAdmin = "0x32D716c34A94010D8a8f5e8b3e29C210Ed16349F";
  const treasuryAddress = "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926";
  const usdtAddress = "0x9effc8c62f9077EDB785E6482328A7BfD7eAbe9f";
  const wrapperAddress = "0xAfECBA18585f6C9eb120fD89a56B53243856a4fB";
  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";

  // Use 26 gwei (minimum Amoy requirement is 25 gwei, 26 gwei safely fits within 0.187 POL)
  const gasPrice = ethers.parseUnits("26", "gwei");
  console.log(`Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  // 1. Deploy EcosystemToken
  console.log("\n[1/5] Deploying EcosystemToken (ET)...");
  const et = await ethers.deployContract("EcosystemToken", [deployer.address, 0n], { gasPrice });
  await et.waitForDeployment();
  const etAddress = await et.getAddress();
  console.log(`✓ EcosystemToken deployed at: ${etAddress}`);

  // 2. Deploy SZToken with updated logic (100% ET for years 2-20 & remainder fix)
  console.log("\n[2/5] Deploying updated SZToken (100% ET Year 2-20 & precision fix)...");
  const szSupply = 1_000_000_000n * 10n ** 6n; // 1 Billion SZ
  const sz = await ethers.deployContract(
    "SZToken",
    [usdtAddress, etAddress, treasuryAddress, deployer.address, szSupply],
    { gasPrice }
  );
  await sz.waitForDeployment();
  const szAddress = await sz.getAddress();
  console.log(`✓ SZToken deployed at: ${szAddress}`);

  // 3. Bind EcosystemToken minter to new SZToken
  console.log("\n[3/5] Binding ET minter to new SZToken...");
  const bindTx = await et.bindMinter(szAddress, { gasPrice });
  await bindTx.wait(1);
  console.log("✓ ET minter permanently bound to SZToken");

  // 4. Grant Admin Roles to targetAdmin on SZToken
  console.log(`\n[4/5] Granting ADMIN roles to ${targetAdmin} on new SZToken...`);
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  const grantTx1 = await sz.grantRole(ADMIN_ROLE, targetAdmin, { gasPrice });
  await grantTx1.wait(1);
  console.log("✓ Granted ADMIN_ROLE to targetAdmin on SZToken");

  const grantTx2 = await sz.grantRole(DEFAULT_ADMIN_ROLE, targetAdmin, { gasPrice });
  await grantTx2.wait(1);
  console.log("✓ Granted DEFAULT_ADMIN_ROLE to targetAdmin on SZToken");

  // 5. Migrate package 1 for user 0xaf70139970e12f96ca558cd222a99d05142c9505
  console.log("\n[5/5] Migrating active package for user 0xaf70139970e12f96ca558cd222a99d05142c9505...");
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
      referenceId: ethers.keccak256(ethers.toUtf8Bytes(`migration_pkg_1_${Date.now()}`)),
    };
    const recTx = await sz.recordOfflineSale(saleData, { gasPrice });
    await recTx.wait(1);
    console.log(`✓ Staking package migrated for user ${userWallet}! Package ID: 1`);
  } catch (err: any) {
    console.warn("Could not migrate package:", err.message);
  }

  // Verify roles on Wrapper as well
  try {
    const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);
    const hasWrapAdmin = await wrapper.hasRole(ADMIN_ROLE, targetAdmin);
    if (!hasWrapAdmin) {
      const tx = await wrapper.grantRole(ADMIN_ROLE, targetAdmin, { gasPrice });
      await tx.wait(1);
      console.log("✓ Granted ADMIN_ROLE to targetAdmin on USDTcWrapper");
    }
  } catch (e: any) {
    console.log("Wrapper role check:", e.message);
  }

  const startBlock = await ethers.provider.getBlockNumber();
  console.log(`\nDeployment completed at Block: ${startBlock}`);

  // Automatically update config/deployment.json
  const configPath = path.resolve("../config/deployment.json");
  if (fs.existsSync(configPath)) {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    cfg.sz = szAddress;
    cfg.et = etAddress;
    cfg.startBlock = startBlock;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");
    console.log(`✓ Updated ${configPath}`);
  }

  // Automatically update frontEnd/src/constants/contracts.ts
  const feContractsPath = path.resolve("../frontEnd/src/constants/contracts.ts");
  if (fs.existsSync(feContractsPath)) {
    let content = fs.readFileSync(feContractsPath, "utf8");
    content = content.replace(/sz:\s*import\.meta\.env\.VITE_SZ_ADDRESS\s*\|\|\s*"0x[a-fA-F0-9]+"/, `sz: import.meta.env.VITE_SZ_ADDRESS || "${szAddress}"`);
    content = content.replace(/et:\s*import\.meta\.env\.VITE_ET_ADDRESS\s*\|\|\s*"0x[a-fA-F0-9]+"/, `et: import.meta.env.VITE_ET_ADDRESS || "${etAddress}"`);
    fs.writeFileSync(feContractsPath, content);
    console.log(`✓ Updated ${feContractsPath}`);
  }

  return {
    szAddress,
    etAddress,
    usdtAddress,
    wrapperAddress,
    adapterAddress,
    targetAdmin,
    startBlock,
  };
}

main()
  .then((res) => {
    console.log("\n==================================================");
    console.log("DEPLOYMENT SUCCESSFUL:");
    console.log(`SZToken:         ${res.szAddress}`);
    console.log(`EcosystemToken:  ${res.etAddress}`);
    console.log(`USDT:            ${res.usdtAddress}`);
    console.log(`Wrapper:         ${res.wrapperAddress}`);
    console.log(`Adapter:         ${res.adapterAddress}`);
    console.log(`Target Admin:    ${res.targetAdmin}`);
    console.log(`StartBlock:      ${res.startBlock}`);
    console.log("==================================================");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
