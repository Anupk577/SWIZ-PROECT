import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log(`Processing deposit with deployer: ${deployer.address}`);

  const wrapperAddress = "0x29741866D0E40e9912Fb7Bd837e499e28733FbB1";
  const adapterAddress = "0x693C018a441662aEC9377b2F25E59c1D6300d67e";
  const txHash = "0x43d97a8f2165812e5565941cca618a2b8da61043c232c40f33f8a8039a0c48bf";

  const wrapper = await ethers.getContractAt("USDTcWrapper", wrapperAddress, deployer);
  const adapter = await ethers.getContractAt("SourceDepositAdapter", adapterAddress, deployer);

  // 1. Configure source network 80002 on Wrapper if not already configured
  const currentAdapter = await wrapper.adapters(80002);
  if (currentAdapter.toLowerCase() !== adapterAddress.toLowerCase()) {
    console.log(`Configuring source 80002 -> ${adapterAddress} on USDTcWrapper...`);
    const configTx = await wrapper.configureSource(80002, adapterAddress, { gasLimit: 200000 });
    await configTx.wait();
    console.log("✓ Source configured on USDTcWrapper");
  } else {
    console.log("✓ Source 80002 is already configured on USDTcWrapper");
  }

  // 2. Grant BRIDGE_RELAYER_ROLE to deployer if needed
  const BRIDGE_RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_RELAYER_ROLE"));
  const hasRelayer = await wrapper.hasRole(BRIDGE_RELAYER_ROLE, deployer.address);
  if (!hasRelayer) {
    console.log("Granting BRIDGE_RELAYER_ROLE to deployer...");
    const grantTx = await wrapper.grantRole(BRIDGE_RELAYER_ROLE, deployer.address, { gasLimit: 200000 });
    await grantTx.wait();
    console.log("✓ Granted BRIDGE_RELAYER_ROLE to deployer");
  }

  // 3. Inspect Deposited event from transaction 0x43d97a8f2165812e5565941cca618a2b8da61043c232c40f33f8a8039a0c48bf
  console.log(`Inspecting transaction receipt for ${txHash}...`);
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  if (!receipt) throw Error("Transaction receipt not found");

  let recipient = deployer.address;
  let amount6 = 100_000_000n; // 100 USDT
  let nonce = 1n;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === adapterAddress.toLowerCase()) {
      try {
        const parsed = adapter.interface.parseLog(log);
        if (parsed && parsed.name === "Deposited") {
          nonce = parsed.args.nonce;
          recipient = parsed.args.recipient;
          amount6 = parsed.args.amount6;
          console.log(`Found Deposited Event: Nonce=${nonce}, Recipient=${recipient}, Amount6=${amount6}`);
        }
      } catch (e) {}
    }
  }

  // 4. Mint USDT.c to recipient
  console.log(`Minting ${ethers.formatUnits(amount6, 6)} USDT.c to ${recipient}...`);
  const mintTx = await wrapper.mintDeposit(
    recipient,
    amount6,
    80002,
    adapterAddress,
    nonce,
    txHash,
    { gasLimit: 300000 }
  );
  const mintReceipt = await mintTx.wait();
  console.log(`✓ USDT.c Mint Succeeded! Tx Hash: ${mintReceipt?.hash}`);

  const usdtcBalance = await wrapper.balanceOf(recipient);
  console.log(`Updated USDT.c Balance for ${recipient}: ${ethers.formatUnits(usdtcBalance, 6)} USDT.c`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
