import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  console.log("Current Signer / Deployer address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance (POL):", ethers.formatEther(balance));

  const targetAdmin = "0x32D716c34A94010D8a8f5e8b3e29C210Ed16349F";
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  // 1. SZToken
  const szAddress = "0xB3E678bAB4152208A3d96dAa164453eC0b4121E9";
  const sz = await ethers.getContractAt("SZToken", szAddress, deployer);
  console.log("\n--- Granting roles on SZToken (" + szAddress + ") ---");
  
  const hasSzAdmin = await sz.hasRole(ADMIN_ROLE, targetAdmin);
  if (!hasSzAdmin) {
    console.log("Granting ADMIN_ROLE to", targetAdmin, "on SZToken...");
    const tx = await sz.grantRole(ADMIN_ROLE, targetAdmin);
    console.log("Tx hash:", tx.hash);
    await tx.wait(1);
    console.log("Granted ADMIN_ROLE on SZToken.");
  } else {
    console.log("Target already has ADMIN_ROLE on SZToken.");
  }

  const hasSzDefaultAdmin = await sz.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin);
  if (!hasSzDefaultAdmin) {
    console.log("Granting DEFAULT_ADMIN_ROLE to", targetAdmin, "on SZToken...");
    const tx = await sz.grantRole(DEFAULT_ADMIN_ROLE, targetAdmin);
    console.log("Tx hash:", tx.hash);
    await tx.wait(1);
    console.log("Granted DEFAULT_ADMIN_ROLE on SZToken.");
  } else {
    console.log("Target already has DEFAULT_ADMIN_ROLE on SZToken.");
  }

  // 2. USDTcWrapper
  const wrapperAddress = "0xAfECBA18585f6C9eb120fD89a56B53243856a4fB";
  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);
  console.log("\n--- Granting roles on USDTcWrapper (" + wrapperAddress + ") ---");

  const hasWrapAdmin = await wrapper.hasRole(ADMIN_ROLE, targetAdmin);
  if (!hasWrapAdmin) {
    console.log("Granting ADMIN_ROLE to", targetAdmin, "on USDTcWrapper...");
    const tx = await wrapper.grantRole(ADMIN_ROLE, targetAdmin);
    console.log("Tx hash:", tx.hash);
    await tx.wait(1);
    console.log("Granted ADMIN_ROLE on USDTcWrapper.");
  } else {
    console.log("Target already has ADMIN_ROLE on USDTcWrapper.");
  }

  const hasWrapDefaultAdmin = await wrapper.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin);
  if (!hasWrapDefaultAdmin) {
    console.log("Granting DEFAULT_ADMIN_ROLE to", targetAdmin, "on USDTcWrapper...");
    const tx = await wrapper.grantRole(DEFAULT_ADMIN_ROLE, targetAdmin);
    console.log("Tx hash:", tx.hash);
    await tx.wait(1);
    console.log("Granted DEFAULT_ADMIN_ROLE on USDTcWrapper.");
  } else {
    console.log("Target already has DEFAULT_ADMIN_ROLE on USDTcWrapper.");
  }

  // 3. SourceDepositAdapter
  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress, deployer);
  console.log("\n--- Granting roles on SourceDepositAdapter (" + adapterAddress + ") ---");

  const hasAdapterAdmin = await adapter.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin);
  if (!hasAdapterAdmin) {
    console.log("Granting DEFAULT_ADMIN_ROLE to", targetAdmin, "on SourceDepositAdapter...");
    const tx = await adapter.grantRole(DEFAULT_ADMIN_ROLE, targetAdmin);
    console.log("Tx hash:", tx.hash);
    await tx.wait(1);
    console.log("Granted DEFAULT_ADMIN_ROLE on SourceDepositAdapter.");
  } else {
    console.log("Target already has DEFAULT_ADMIN_ROLE on SourceDepositAdapter.");
  }

  // Verification
  console.log("\n=== Final Verification ===");
  console.log("SZToken DEFAULT_ADMIN_ROLE:", await sz.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin));
  console.log("SZToken ADMIN_ROLE:", await sz.hasRole(ADMIN_ROLE, targetAdmin));
  console.log("USDTcWrapper DEFAULT_ADMIN_ROLE:", await wrapper.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin));
  console.log("USDTcWrapper ADMIN_ROLE:", await wrapper.hasRole(ADMIN_ROLE, targetAdmin));
  console.log("SourceDepositAdapter DEFAULT_ADMIN_ROLE:", await adapter.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
