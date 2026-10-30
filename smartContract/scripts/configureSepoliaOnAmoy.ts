import { network } from "hardhat";

const AMOY_WRAPPER_ADDRESS = process.env.VITE_WRAPPER_ADDRESS || "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_ADAPTER_ADDRESS = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("==================================================");
  console.log("Configuring Sepolia Source Adapter on Polygon Amoy USDTcWrapper");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Wrapper: ${AMOY_WRAPPER_ADDRESS}`);
  console.log(`Sepolia Chain ID: ${SEPOLIA_CHAIN_ID}`);
  console.log(`Sepolia Adapter: ${SEPOLIA_ADAPTER_ADDRESS}`);
  console.log("==================================================");

  const wrapper = await ethers.getContractAt("USDTcWrapper", AMOY_WRAPPER_ADDRESS, deployer);

  const currentAdapter = await wrapper.adapters(SEPOLIA_CHAIN_ID);
  console.log(`Current registered adapter for chain ${SEPOLIA_CHAIN_ID}: ${currentAdapter}`);

  if (currentAdapter.toLowerCase() === SEPOLIA_ADAPTER_ADDRESS.toLowerCase()) {
    console.log("✓ Sepolia adapter is already properly registered on USDTcWrapper!");
    return;
  }

  console.log(`Calling configureSource(${SEPOLIA_CHAIN_ID}, ${SEPOLIA_ADAPTER_ADDRESS})...`);
  const tx = await wrapper.configureSource(SEPOLIA_CHAIN_ID, SEPOLIA_ADAPTER_ADDRESS);
  console.log(`Transaction submitted: ${tx.hash}. Waiting for confirmation...`);
  await tx.wait();
  console.log("✓ Successfully registered Sepolia adapter on Polygon Amoy USDTcWrapper!");

  const updatedAdapter = await wrapper.adapters(SEPOLIA_CHAIN_ID);
  console.log(`Verified registered adapter for chain ${SEPOLIA_CHAIN_ID}: ${updatedAdapter}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
