import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const amoyRpc = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/SkzrI3058h3g92BAFz9fU";
  const provider = new ethers.JsonRpcProvider(amoyRpc);

  const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY || "a2b51f5b4ff4991f3dc2b671b3948920a6d006a79322913a5264f18d3c0fcbcf";
  const adminWallet = new ethers.Wallet(adminKey, provider);

  const relayerKey = process.env.RELAYER_PRIVATE_KEY || "0xa594fa84d1f8333a50e5796ad77b2f15aeaed79f4b1913ca42d54a8628d9472d";
  const relayerWallet = new ethers.Wallet(relayerKey, provider);

  console.log("==================================================");
  console.log(`Admin Wallet:   ${adminWallet.address}`);
  console.log(`Relayer Wallet: ${relayerWallet.address}`);
  console.log("==================================================");

  const wrapperAddress = process.env.VITE_WRAPPER_ADDRESS || "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const wrapperAbi = [
    "function adapters(uint256) view returns (address)",
    "function isDepositProcessed(bytes32) view returns (bool)",
    "function depositId(uint256 chain, address adapter, uint256 nonce) public pure returns (bytes32)",
    "function mintDeposit(address recipient, uint256 amount, uint256 chain, address adapter, uint256 nonce, bytes32 sourceTx) external",
    "function balanceOf(address account) view returns (uint256)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account) external",
    "function configureSource(uint256 chain, address adapter) external"
  ];

  const wrapperAsAdmin = new ethers.Contract(wrapperAddress, wrapperAbi, adminWallet);
  const wrapperAsRelayer = new ethers.Contract(wrapperAddress, wrapperAbi, relayerWallet);

  const BRIDGE_RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_RELAYER_ROLE"));

  // 1. Ensure Relayer has BRIDGE_RELAYER_ROLE
  const hasRole = await wrapperAsAdmin.hasRole(BRIDGE_RELAYER_ROLE, relayerWallet.address);
  if (!hasRole) {
    console.log(`Granting BRIDGE_RELAYER_ROLE to ${relayerWallet.address}...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const tx = await wrapperAsAdmin.grantRole(BRIDGE_RELAYER_ROLE, relayerWallet.address, { gasPrice });
    await tx.wait();
    console.log(`✓ BRIDGE_RELAYER_ROLE granted!`);
  } else {
    console.log(`✓ Relayer already has BRIDGE_RELAYER_ROLE`);
  }

  // 2. Ensure Sepolia source adapter is configured
  const sepoliaChainId = 11155111n;
  const sepoliaAdapter = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";
  const registeredAdapter = await wrapperAsAdmin.adapters(sepoliaChainId);
  console.log(`Sepolia Adapter configured: ${registeredAdapter}`);

  if (registeredAdapter.toLowerCase() !== sepoliaAdapter.toLowerCase()) {
    console.log(`Configuring Sepolia Adapter ${sepoliaAdapter} for chain ${sepoliaChainId}...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const cfgTx = await wrapperAsAdmin.configureSource(sepoliaChainId, sepoliaAdapter, { gasPrice });
    await cfgTx.wait();
    console.log(`✓ Sepolia adapter configured!`);
  }

  // 3. Process Pending Deposit
  const recipient = "0x519512475ED7badC7EcCaDF580e7cD58B886DC86";
  const amount = 1000000000n; // 1,000 USDT (6 decimals)
  const nonce = 4n;
  const sourceTx = "0x1e08dd0196d96a4ce38c80e5bec44698f536e0b3080b28eb422a6c43a17b054b";

  const depId = await wrapperAsAdmin.depositId(sepoliaChainId, sepoliaAdapter, nonce);
  const isProcessed = await wrapperAsAdmin.isDepositProcessed(depId);
  console.log(`Deposit ID: ${depId}`);
  console.log(`Is Already Processed: ${isProcessed}`);

  if (isProcessed) {
    console.log("✓ Deposit has already been minted!");
    return;
  }

  console.log(`Submitting mintDeposit from relayer ${relayerWallet.address}...`);
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");

  const mintTx = await wrapperAsRelayer.mintDeposit(
    recipient,
    amount,
    sepoliaChainId,
    sepoliaAdapter,
    nonce,
    sourceTx,
    { gasLimit: 400000, gasPrice }
  );

  console.log(`Transaction sent: ${mintTx.hash}`);
  const receipt = await mintTx.wait();
  console.log(`✓ Mint completed in block ${receipt.blockNumber}! Gas used: ${receipt.gasUsed.toString()}`);

  const bal = await wrapperAsAdmin.balanceOf(recipient);
  console.log(`Recipient USDT.c balance: ${ethers.formatUnits(bal, 6)} USDT.c`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
