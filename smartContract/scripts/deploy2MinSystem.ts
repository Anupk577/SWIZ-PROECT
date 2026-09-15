import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  if (!deployer) throw Error("Configure deployer private key");

  console.log("==================================================");
  console.log("Deploying Accelerated 2-Min Tranche System to Polygon Amoy");
  console.log(`Deployer Address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`POL Balance:      ${ethers.formatEther(balance)} POL`);
  console.log("==================================================");

  const adminAddress = ethers.getAddress((process.env.ADMIN_WALLET || deployer.address).toLowerCase());
  const treasuryAddress = ethers.getAddress((process.env.ECOSYSTEM_WALLET || "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926").toLowerCase());
  const relayerAddress = ethers.getAddress((process.env.RELAYER_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8").toLowerCase());

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 125n) / 100n : ethers.parseUnits("50", "gwei");
  console.log(`Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  // 1. Deploy MockUSDT
  console.log("\n[1/5] Deploying MockUSDT...");
  const usdt = await ethers.deployContract("MockUSDT", [], { gasPrice });
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log(`✓ MockUSDT deployed at: ${usdtAddress}`);

  // 2. Deploy EcosystemToken
  console.log("\n[2/5] Deploying EcosystemToken (ET)...");
  const et = await ethers.deployContract("EcosystemToken", [deployer.address, 0n], { gasPrice });
  await et.waitForDeployment();
  const etAddress = await et.getAddress();
  console.log(`✓ EcosystemToken deployed at: ${etAddress}`);

  // 3. Deploy SZToken with 2-min tranche setting
  console.log("\n[3/5] Deploying SZToken (2-min tranche duration)...");
  const szSupply = 1_000_000_000n * 10n ** 6n; // 1 Billion SZ
  const sz = await ethers.deployContract(
    "SZToken",
    [usdtAddress, etAddress, treasuryAddress, adminAddress, szSupply],
    { gasPrice }
  );
  await sz.waitForDeployment();
  const szAddress = await sz.getAddress();
  console.log(`✓ SZToken deployed at: ${szAddress}`);

  // Bind EcosystemToken minter to SZToken
  console.log("Binding ET minter role to SZToken...");
  await (await et.bindMinter(szAddress, { gasPrice })).wait();
  console.log("✓ ET minter bound to SZToken");

  // 4. Deploy USDTcWrapper
  console.log("\n[4/5] Deploying USDTcWrapper...");
  const wrapper = await ethers.deployContract("USDTcWrapper", [adminAddress, relayerAddress], { gasPrice });
  await wrapper.waitForDeployment();
  const wrapperAddress = await wrapper.getAddress();
  console.log(`✓ USDTcWrapper deployed at: ${wrapperAddress}`);

  // 5. Deploy SourceDepositAdapter
  console.log("\n[5/5] Deploying SourceDepositAdapter...");
  const adapter = await ethers.deployContract(
    "SourceDepositAdapter",
    [usdtAddress, treasuryAddress, adminAddress, 80002n, wrapperAddress, 1_000_000n, 1_000_000_000_000n],
    { gasPrice }
  );
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log(`✓ SourceDepositAdapter deployed at: ${adapterAddress}`);

  // Configure USDTcWrapper source adapter for Polygon Amoy (80002)
  console.log("Configuring wrapper source adapter for chain 80002...");
  const adminRole = await wrapper.ADMIN_ROLE();
  if (!(await wrapper.hasRole(adminRole, deployer.address))) {
    console.log("Granting ADMIN_ROLE on wrapper to deployer for configuration...");
    await (await wrapper.grantRole(adminRole, deployer.address, { gasPrice })).wait();
  }
  await (await wrapper.configureSource(80002n, adapterAddress, { gasPrice })).wait();
  console.log("✓ Adapter configured on USDTcWrapper for chain 80002");

  console.log("\n==================================================");
  console.log("NEW ACCELERATED CONTRACTS DEPLOYED (Polygon Amoy - 80002):");
  console.log(`VITE_SZ_ADDRESS=${szAddress}`);
  console.log(`VITE_ET_ADDRESS=${etAddress}`);
  console.log(`VITE_USDT_ADDRESS=${usdtAddress}`);
  console.log(`VITE_WRAPPER_ADDRESS=${wrapperAddress}`);
  console.log(`VITE_ADAPTER_ADDRESS=${adapterAddress}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
