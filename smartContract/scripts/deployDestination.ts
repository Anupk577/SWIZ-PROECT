import { network } from "hardhat";
function address(name: string) {
  const value = process.env[name];
  if (!value) throw Error(`${name} is required`);
  return value;
}
function number(name: string) {
  const value = process.env[name];
  if (!value || !/^\d+$/.test(value))
    throw Error(`${name} is required in 6-decimal base units`);
  return BigInt(value);
}
const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();
if (!deployer) throw Error("Configure a deployment private key");
const admin = address("ADMIN_ADDRESS"),
  treasury = address("TREASURY_ADDRESS"),
  relayer = address("RELAYER_ADDRESS");
if (admin.toLowerCase() === relayer.toLowerCase())
  throw Error("Admin and relayer must be separate");
const et = await ethers.deployContract("EcosystemToken", [
  deployer.address,
  process.env.ET_MAX_SUPPLY ? BigInt(process.env.ET_MAX_SUPPLY) : 0n,
]);
await et.waitForDeployment();
const wrapper = await ethers.deployContract("USDTcWrapper", [admin, relayer]);
await wrapper.waitForDeployment();
const sz = await ethers.deployContract("SZToken", [
  await wrapper.getAddress(),
  await et.getAddress(),
  treasury,
  admin,
  number("SZ_TOTAL_SUPPLY"),
]);
await sz.waitForDeployment();
await (await et.bindMinter(await sz.getAddress())).wait();
console.log(
  JSON.stringify(
    {
      deployer: deployer.address,
      admin,
      treasury,
      relayer,
      et: await et.getAddress(),
      wrapper: await wrapper.getAddress(),
      sz: await sz.getAddress(),
    },
    null,
    2
  )
);
