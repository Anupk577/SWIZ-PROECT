import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  const wrapperAddress = "0x10c5318B11D4F9739Fa69e6E47820aB6536f6Aa1";
  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);

  for (const chainId of [80002, 1, 137, 31337]) {
    try {
      const adp = await wrapper.adapters(chainId);
      console.log(`Chain ${chainId} -> Adapter: ${adp}`);
    } catch (e) {
      console.log(`Chain ${chainId} -> error checking adapter`);
    }
  }
}

main().catch(console.error);
