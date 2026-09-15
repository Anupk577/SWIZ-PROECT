import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const szAddress = "0x48D0334c745FE791465E5E62F8EB5Afb40D148E2";
  const wrapperAddress = "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const etAddress = "0x32728184F8D739809F1A74C9cAF3F7665E4dDEBd";

  const sz = await ethers.getContractAt("SZToken", szAddress);
  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress);
  const et = await ethers.getContractAt("EcosystemToken", etAddress);

  const secondsPerYear = await sz.SECONDS_PER_YEAR();
  const szUsdt = await sz.usdt();
  const szEt = await sz.et();
  const adapter80002 = await wrapper.adapters(80002n);
  const etMinter = await et.minter();

  console.log("==================================================");
  console.log("LIVE ON-CHAIN VERIFICATION (POLYGON AMOY - 80002)");
  console.log("==================================================");
  console.log(`SZToken Address:          ${szAddress}`);
  console.log(`SZ.SECONDS_PER_YEAR():    ${secondsPerYear} seconds (${Number(secondsPerYear) / 60} minutes)`);
  console.log(`SZ.usdt():                ${szUsdt}`);
  console.log(`SZ.et():                  ${szEt}`);
  console.log(`ET.szContract() (Minter): ${etMinter}`);
  console.log(`USDTcWrapper:             ${wrapperAddress}`);
  console.log(`Wrapper Adapter (80002):  ${adapter80002}`);
  console.log("==================================================");
}

main().catch(console.error);
