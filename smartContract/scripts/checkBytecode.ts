import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const szAddress = "0x48D0334c745FE791465E5E62F8EB5Afb40D148E2";
  const code = await ethers.provider.getCode(szAddress);
  console.log("Code length:", code.length);
  
  // Check for replaceWallet selector: e50b2bc2
  console.log("Contains replaceWallet selector (e50b2bc2):", code.includes("e50b2bc2"));

  // Check for setSecondaryWallet selector: 7b35f64f or similar
  const iface = new ethers.Interface([
    "function replaceWallet(address,address)",
    "function setSecondaryWallet(address)",
    "function setSecondaryWalletByAdmin(address,address)",
    "function secondaryWallets(address) view returns (address)",
    "function setWalletPaused(address,bool)",
    "function pausedWallets(address) view returns (bool)"
  ]);

  for (const fn of ["replaceWallet", "setSecondaryWallet", "setSecondaryWalletByAdmin", "secondaryWallets", "setWalletPaused", "pausedWallets"]) {
    const selector = iface.getFunction(fn)!.selector.slice(2);
    console.log(`Selector for ${fn}: ${selector}, found in bytecode: ${code.includes(selector)}`);
  }
}

main().catch(console.error);
