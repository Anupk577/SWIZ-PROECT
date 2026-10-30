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

  // SZToken
  const szAddress = "0xB3E678bAB4152208A3d96dAa164453eC0b4121E9";
  try {
    const sz = await ethers.getContractAt("SZToken", szAddress, deployer);
    console.log("\n--- SZToken (" + szAddress + ") ---");
    console.log("Deployer has DEFAULT_ADMIN_ROLE?", await sz.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
    console.log("Deployer has ADMIN_ROLE?", await sz.hasRole(ADMIN_ROLE, deployer.address));
    console.log("Target has DEFAULT_ADMIN_ROLE?", await sz.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin));
    console.log("Target has ADMIN_ROLE?", await sz.hasRole(ADMIN_ROLE, targetAdmin));
  } catch (e: any) {
    console.error("Error checking SZToken:", e.message);
  }

  // USDTcWrapper
  const wrapperAddress = "0xAfECBA18585f6C9eb120fD89a56B53243856a4fB";
  try {
    const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);
    console.log("\n--- USDTcWrapper (" + wrapperAddress + ") ---");
    console.log("Deployer has DEFAULT_ADMIN_ROLE?", await wrapper.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
    console.log("Deployer has ADMIN_ROLE?", await wrapper.hasRole(ADMIN_ROLE, deployer.address));
    console.log("Target has DEFAULT_ADMIN_ROLE?", await wrapper.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin));
    console.log("Target has ADMIN_ROLE?", await wrapper.hasRole(ADMIN_ROLE, targetAdmin));
  } catch (e: any) {
    console.error("Error checking USDTcWrapper:", e.message);
  }

  // SourceDepositAdapter
  const adapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  try {
    const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress, deployer);
    console.log("\n--- SourceDepositAdapter (" + adapterAddress + ") ---");
    try {
      console.log("Owner is:", await (adapter as any).owner());
    } catch {}
    try {
      console.log("Deployer has DEFAULT_ADMIN_ROLE?", await adapter.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
      console.log("Target has DEFAULT_ADMIN_ROLE?", await adapter.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin));
    } catch {}
  } catch (e: any) {
    console.error("Error checking SourceDepositAdapter:", e.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
