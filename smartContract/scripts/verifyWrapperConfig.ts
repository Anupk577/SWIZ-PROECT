import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const wrapperAddress = "0xAfECBA18585f6C9eb120fD89a56B53243856a4fB";
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Wrapper: ${wrapperAddress}`);

  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);
  
  const DEFAULT_ADMIN_ROLE = await wrapper.DEFAULT_ADMIN_ROLE();
  const isAdmin = await wrapper.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log(`Deployer has DEFAULT_ADMIN_ROLE on wrapper: ${isAdmin}`);

  const sepoliaAdapter = await wrapper.adapters(11155111n);
  console.log(`Current adapter for Sepolia (Chain ID 11155111): ${sepoliaAdapter}`);

  const bscAdapter = await wrapper.adapters(97n);
  console.log(`Current adapter for BSC Testnet (Chain ID 97): ${bscAdapter}`);
}

main().catch(console.error);
