import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  const wrapperAddress = "0x10c5318B11D4F9739Fa69e6E47820aB6536f6Aa1";
  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);

  const BRIDGE_RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_RELAYER_ROLE"));
  const hasRelayer = await wrapper.hasRole(BRIDGE_RELAYER_ROLE, deployer.address);
  console.log(`Does deployer (${deployer.address}) have BRIDGE_RELAYER_ROLE on ${wrapperAddress}? ${hasRelayer}`);
}

main().catch(console.error);
