import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  const wrapperAddress = "0x29741866D0E40e9912Fb7Bd837e499e28733FbB1";
  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);

  const existingAdapter = await wrapper.adapters(80002);
  console.log(`Existing adapter for chain 80002 on USDTcWrapper: ${existingAdapter}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
