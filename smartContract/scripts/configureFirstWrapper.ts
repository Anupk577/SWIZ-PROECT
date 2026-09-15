import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  const wrapperAddress = "0x10c5318B11D4F9739Fa69e6E47820aB6536f6Aa1";
  const adapterAddress = "0x693C018a441662aEC9377b2F25E59c1D6300d67e";
  const gasPrice = ethers.parseUnits("30", "gwei");

  console.log(`Configuring USDTcWrapper (${wrapperAddress}) with deployer ${deployer.address}...`);

  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);

  // Configure source 80002 -> adapterAddress
  console.log(`Setting source 80002 -> ${adapterAddress}...`);
  const tx = await wrapper.configureSource(80002, adapterAddress, { gasPrice, gasLimit: 150000 });
  await tx.wait();
  console.log("✓ Source 80002 configured successfully on USDTcWrapper!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
