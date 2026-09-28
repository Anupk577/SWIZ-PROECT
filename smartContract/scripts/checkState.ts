import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const szAddress = "0x48D0334c745FE791465E5E62F8EB5Afb40D148E2";
  const sz = await ethers.getContractAt("SZToken", szAddress);

  const totalPkgs = await sz.totalStakingPackages();
  const totalStakedUSD = await sz.totalStakedAmountUSD();
  const nextId = await sz.nextPackageId();
  const price = await sz.getCurrentPrice();

  console.log("Total Staking Packages:", totalPkgs.toString());
  console.log("Total Staked USD:", totalStakedUSD.toString());
  console.log("Next Package ID:", nextId.toString());
  console.log("Current Price:", price.toString());

  // Check the oldWallet mentioned by the user: 0xaf70139970e12f96ca558cd222a99d05142c9505
  const userAddr = "0xaf70139970e12f96ca558cd222a99d05142c9505";
  const bal = await sz.balanceOf(userAddr);
  console.log(`Balance of ${userAddr}:`, bal.toString());
  try {
    const pkgIds = await sz.getUserPackageIds(userAddr);
    console.log(`Package IDs for ${userAddr}:`, pkgIds.map(x => x.toString()));
  } catch (e: any) {
    console.log("getUserPackageIds failed:", e.message);
  }
}

main().catch(console.error);
