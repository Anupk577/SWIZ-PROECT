import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const balance1 = await ethers.provider.getBalance("0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E");
  const balance2 = await ethers.provider.getBalance("0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926");
  console.log(`Deployer 0x9B5Af... POL: ${ethers.formatEther(balance1)} POL`);
  console.log(`Treasury 0x1Eb5F... POL: ${ethers.formatEther(balance2)} POL`);
}

main().catch(console.error);
