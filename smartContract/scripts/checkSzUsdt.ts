import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const szAddress = "0xAfB1d83EF86b9D53be31D06CBAc9bE05b565a594";
  const sz = await ethers.getContractAt("SZToken", szAddress);
  const usdtOnSz = await sz.usdt();
  console.log(`USDT token set on SZToken contract (${szAddress}): ${usdtOnSz}`);
}

main().catch(console.error);
