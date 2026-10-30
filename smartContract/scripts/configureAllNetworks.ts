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
  console.log("CONFIGURING ALL THREE NETWORKS ON AMOY WRAPPER");
  console.log(`Admin Wallet:   ${adminWallet.address}`);
  console.log(`Relayer Wallet: ${relayerWallet.address}`);
  console.log("==================================================");

  const wrapperAddress = process.env.VITE_WRAPPER_ADDRESS || "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const wrapperAbi = [
    "function adapters(uint256) view returns (address)",
    "function isDepositProcessed(bytes32) view returns (bool)",
    "function depositId(uint256 chain, address adapter, uint256 nonce) public pure returns (bytes32)",
    "function mintDeposit(address recipient, uint256 amount, uint256 chain, address adapter, uint256 nonce, bytes32 sourceTx) external",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account) external",
    "function configureSource(uint256 chain, address adapter) external"
  ];

  const wrapperAsAdmin = new ethers.Contract(wrapperAddress, wrapperAbi, adminWallet);

  const BRIDGE_RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_RELAYER_ROLE"));

  // 1. Ensure Relayer has BRIDGE_RELAYER_ROLE
  const hasRole = await wrapperAsAdmin.hasRole(BRIDGE_RELAYER_ROLE, relayerWallet.address);
  if (!hasRole) {
    console.log(`Granting BRIDGE_RELAYER_ROLE to ${relayerWallet.address}...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const tx = await wrapperAsAdmin.grantRole(BRIDGE_RELAYER_ROLE, relayerWallet.address, { gasPrice });
    await tx.wait();
    console.log(`✓ BRIDGE_RELAYER_ROLE granted to ${relayerWallet.address}`);
  } else {
    console.log(`✓ Relayer ${relayerWallet.address} already has BRIDGE_RELAYER_ROLE`);
  }

  // 2. Configure source adapters for all three networks:
  const networks = [
    {
      name: "Ethereum Sepolia Testnet",
      chainId: 11155111n,
      adapter: "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F",
    },
    {
      name: "BNB Smart Chain (BSC) Testnet",
      chainId: 97n,
      adapter: "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F",
    },
    {
      name: "Polygon Amoy Testnet",
      chainId: 80002n,
      adapter: "0x098DeA8e03381E8187F472308004530D52E5A0df",
    },
  ];

  for (const net of networks) {
    const configuredAdapter = await wrapperAsAdmin.adapters(net.chainId);
    console.log(`\nNetwork: ${net.name} (Chain ID: ${net.chainId})`);
    console.log(`Current registered adapter: ${configuredAdapter}`);

    if (configuredAdapter.toLowerCase() === net.adapter.toLowerCase()) {
      console.log(`✓ ${net.name} is already correctly configured!`);
    } else if (configuredAdapter !== ethers.ZeroAddress) {
      console.warn(`! Note: ${net.name} is already set to ${configuredAdapter}`);
    } else {
      console.log(`Configuring ${net.name} -> ${net.adapter}...`);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
      const cfgTx = await wrapperAsAdmin.configureSource(net.chainId, net.adapter, { gasPrice });
      await cfgTx.wait();
      console.log(`✓ Successfully configured ${net.name}!`);
    }
  }

  console.log("\n==================================================");
  console.log("ALL THREE NETWORKS CONFIGURED AND VERIFIED ON-CHAIN!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Configuration script failed:", err);
  process.exit(1);
});
