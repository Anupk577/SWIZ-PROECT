import { network } from "hardhat";
function required(name: string) {
  const v = process.env[name];
  if (!v) throw Error(`${name} is required`);
  return v;
}
const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();
if (!deployer) throw Error("Configure a deployment private key");
const adapter = await ethers.deployContract("SourceDepositAdapter", [
  required("SOURCE_USDT_ADDRESS"),
  required("SOURCE_TREASURY_ADDRESS"),
  required("ADMIN_ADDRESS"),
  BigInt(required("DESTINATION_CHAIN_ID")),
  required("WRAPPER_ADDRESS"),
  BigInt(required("DEPOSIT_MIN")),
  BigInt(required("DEPOSIT_MAX")),
]);
await adapter.waitForDeployment();
console.log(
  JSON.stringify(
    { deployer: deployer.address, adapter: await adapter.getAddress() },
    null,
    2
  )
);
