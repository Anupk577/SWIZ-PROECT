import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  const wrapperAddress = "0x0A64d7CC3c1cc2307D69744C47C0E03C4CaCE5c7";
  const adapterAddress = "0x693C018a441662aEC9377b2F25E59c1D6300d67e";

  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);

  const existingAdapter = await wrapper.adapters(80002);
  console.log(`Current adapter on 0x0A64d7CC3c1cc2307D69744C47C0E03C4CaCE5c7: ${existingAdapter}`);

  if (existingAdapter.toLowerCase() !== adapterAddress.toLowerCase()) {
    console.log(`Configuring source 80002 -> ${adapterAddress}...`);
    const tx = await wrapper.configureSource(80002, adapterAddress, { gasLimit: 200000 });
    await tx.wait();
    console.log("✓ Source 80002 configured on USDTcWrapper!");
  } else {
    console.log("✓ Source 80002 is already configured!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
