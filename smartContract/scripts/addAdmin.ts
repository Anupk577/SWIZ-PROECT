import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("GRANTING ADMIN ROLES TO NEW ACCOUNT");
  console.log("Signer / Deployer Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer POL Balance:     ", ethers.formatEther(balance), "POL");

  const newAdmin = "0x743B5509Cc84415a9E1E20951E2fD94d05E423e9";
  console.log("New Admin Target:         ", newAdmin);
  console.log("==================================================");

  const deployment = JSON.parse(fs.readFileSync(path.resolve("../config/deployment.json"), "utf8"));
  const szAddress = deployment.sz;
  const wrapperAddress = deployment.wrapper;
  const adapterAddress = deployment.adapter || deployment.sources?.[0]?.adapter || "0x098DeA8e03381E8187F472308004530D52E5A0df";

  console.log("Active SZToken:           ", szAddress);
  console.log("Active USDTcWrapper:      ", wrapperAddress);
  console.log("Active SourceAdapter:     ", adapterAddress);

  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const gasPrice = ethers.parseUnits("30", "gwei");

  // 1. SZToken
  console.log("\n[1/3] Configuring roles on SZToken...");
  const sz = await ethers.getContractAt("SZToken", szAddress, deployer);

  const hasSzAdmin = await sz.hasRole(ADMIN_ROLE, newAdmin);
  if (!hasSzAdmin) {
    console.log("Granting ADMIN_ROLE on SZToken...");
    const tx = await sz.grantRole(ADMIN_ROLE, newAdmin, { gasPrice });
    console.log("Tx:", tx.hash);
    await tx.wait(1);
    console.log("✓ Granted ADMIN_ROLE on SZToken");
  } else {
    console.log("✓ Already has ADMIN_ROLE on SZToken");
  }

  const hasSzDefault = await sz.hasRole(DEFAULT_ADMIN_ROLE, newAdmin);
  if (!hasSzDefault) {
    console.log("Granting DEFAULT_ADMIN_ROLE on SZToken...");
    const tx = await sz.grantRole(DEFAULT_ADMIN_ROLE, newAdmin, { gasPrice });
    console.log("Tx:", tx.hash);
    await tx.wait(1);
    console.log("✓ Granted DEFAULT_ADMIN_ROLE on SZToken");
  } else {
    console.log("✓ Already has DEFAULT_ADMIN_ROLE on SZToken");
  }

  // 2. USDTcWrapper
  console.log("\n[2/3] Configuring roles on USDTcWrapper...");
  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);

  const hasWrapAdmin = await wrapper.hasRole(ADMIN_ROLE, newAdmin);
  if (!hasWrapAdmin) {
    console.log("Granting ADMIN_ROLE on USDTcWrapper...");
    const tx = await wrapper.grantRole(ADMIN_ROLE, newAdmin, { gasPrice });
    console.log("Tx:", tx.hash);
    await tx.wait(1);
    console.log("✓ Granted ADMIN_ROLE on USDTcWrapper");
  } else {
    console.log("✓ Already has ADMIN_ROLE on USDTcWrapper");
  }

  const hasWrapDefault = await wrapper.hasRole(DEFAULT_ADMIN_ROLE, newAdmin);
  if (!hasWrapDefault) {
    console.log("Granting DEFAULT_ADMIN_ROLE on USDTcWrapper...");
    const tx = await wrapper.grantRole(DEFAULT_ADMIN_ROLE, newAdmin, { gasPrice });
    console.log("Tx:", tx.hash);
    await tx.wait(1);
    console.log("✓ Granted DEFAULT_ADMIN_ROLE on USDTcWrapper");
  } else {
    console.log("✓ Already has DEFAULT_ADMIN_ROLE on USDTcWrapper");
  }

  // 3. SourceDepositAdapter
  console.log("\n[3/3] Configuring roles on SourceDepositAdapter...");
  const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress, deployer);

  const hasAdapterDefault = await adapter.hasRole(DEFAULT_ADMIN_ROLE, newAdmin);
  if (!hasAdapterDefault) {
    console.log("Granting DEFAULT_ADMIN_ROLE on SourceDepositAdapter...");
    const tx = await adapter.grantRole(DEFAULT_ADMIN_ROLE, newAdmin, { gasPrice });
    console.log("Tx:", tx.hash);
    await tx.wait(1);
    console.log("✓ Granted DEFAULT_ADMIN_ROLE on SourceDepositAdapter");
  } else {
    console.log("✓ Already has DEFAULT_ADMIN_ROLE on SourceDepositAdapter");
  }

  console.log("\n==================================================");
  console.log("VERIFICATION FOR " + newAdmin + ":");
  console.log("SZToken DEFAULT_ADMIN_ROLE:         ", await sz.hasRole(DEFAULT_ADMIN_ROLE, newAdmin));
  console.log("SZToken ADMIN_ROLE:                 ", await sz.hasRole(ADMIN_ROLE, newAdmin));
  console.log("USDTcWrapper DEFAULT_ADMIN_ROLE:    ", await wrapper.hasRole(DEFAULT_ADMIN_ROLE, newAdmin));
  console.log("USDTcWrapper ADMIN_ROLE:            ", await wrapper.hasRole(ADMIN_ROLE, newAdmin));
  console.log("SourceDepositAdapter DEFAULT_ADMIN: ", await adapter.hasRole(DEFAULT_ADMIN_ROLE, newAdmin));
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
