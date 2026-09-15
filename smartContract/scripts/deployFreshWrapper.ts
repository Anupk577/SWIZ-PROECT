import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying fresh USDTcWrapper with deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer POL balance: ${ethers.formatEther(balance)} POL`);

  const relayerAddress = "0x2eb5fdfa920ae1e8341288e4f69c698698fc5927";
  const usdtAddress = "0x810DcCaA5026666F93853575b452EcB2F8398FC9";
  const adapterAddress = "0x693C018a441662aEC9377b2F25E59c1D6300d67e";

  const gasPrice = ethers.parseUnits("30", "gwei");

  // 1. Deploy fresh USDTcWrapper
  const wrapper = await ethers.deployContract("USDTcWrapper", [deployer.address, relayerAddress], { gasPrice, gasLimit: 800000 });
  await wrapper.waitForDeployment();
  const wrapperAddress = await wrapper.getAddress();
  console.log(`✓ USDTcWrapper deployed at: ${wrapperAddress}`);

  // 2. Configure source 80002 -> adapterAddress
  console.log(`Configuring source 80002 -> ${adapterAddress} on USDTcWrapper...`);
  const configTx = await wrapper.configureSource(80002, adapterAddress, { gasPrice, gasLimit: 100000 });
  await configTx.wait();
  console.log("✓ Source 80002 configured successfully!");

  console.log("==================================================");
  console.log("UPDATED DEPLOYMENT ADDRESSES:");
  console.log(`MockUSDT:             ${usdtAddress}`);
  console.log(`SourceDepositAdapter: ${adapterAddress}`);
  console.log(`USDTcWrapper:         ${wrapperAddress}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
