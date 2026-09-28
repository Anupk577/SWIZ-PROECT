import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const szAddress = "0x48D0334c745FE791465E5E62F8EB5Afb40D148E2";
  const sz = await ethers.getContractAt("SZToken", szAddress);

  console.log("Functions on SZToken ABI:");
  for (const fragment of sz.interface.fragments) {
    if (fragment.type === "function") {
      const selector = fragment.selector;
      const code = await ethers.provider.getCode(szAddress);
      const exists = code.includes(selector.slice(2));
      if (!exists) {
        console.log(`MISSING: ${fragment.format()} (selector: ${selector})`);
      }
    }
  }
}

main().catch(console.error);
