import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const szAddress = "0x48D0334c745FE791465E5E62F8EB5Afb40D148E2";
  const sz = await ethers.getContractAt("SZToken", szAddress);

  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer ? await signer.getAddress() : "None");

  const adminRole = await sz.ADMIN_ROLE();
  console.log("ADMIN_ROLE:", adminRole);

  const oldWallet = "0xaf70139970e12f96ca558cd222a99d05142c9505";
  const newWallet = "0xffdbcbec327871c00e0399c104f9fb18890bf455";
  const adminAddress = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";

  const hasRole = await sz.hasRole(adminRole, adminAddress);
  console.log(`Admin ${adminAddress} has ADMIN_ROLE:`, hasRole);

  try {
    const secWallet = await sz.secondaryWallets(oldWallet);
    console.log(`On-chain secondaryWallets(${oldWallet}):`, secWallet);
  } catch (err: any) {
    console.log("Error querying secondaryWallets:", err?.message || err);
  }

  try {
    const isPaused = await sz.pausedWallets(oldWallet);
    console.log(`On-chain pausedWallets(${oldWallet}):`, isPaused);
  } catch (err: any) {
    console.log("Error querying pausedWallets:", err?.message || err);
  }

  // Check what happens if we simulate replaceWallet
  try {
    await sz.replaceWallet.staticCall(oldWallet, newWallet, { from: adminAddress });
    console.log("Static call to replaceWallet succeeded!");
  } catch (err: any) {
    console.log("Static call to replaceWallet failed:", err?.message || err);
  }
}

main().catch(console.error);
