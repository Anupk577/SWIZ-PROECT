import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const amoyRpc = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(amoyRpc);

  const newRelayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!newRelayerKey) throw new Error("Missing RELAYER_PRIVATE_KEY or PRIVATE_KEY in environment");
  const relayerWallet = new ethers.Wallet(newRelayerKey, provider);

  console.log(`Relayer Wallet: ${relayerWallet.address}`);
  const relayerBalance = await provider.getBalance(relayerWallet.address);
  console.log(`Relayer POL Balance: ${ethers.formatEther(relayerBalance)} POL`);

  const wrapperAddress = "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const amoyAdapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";

  const wrapperAbi = [
    "function isDepositProcessed(bytes32) view returns (bool)",
    "function depositId(uint256 chain, address adapter, uint256 nonce) public pure returns (bytes32)",
    "function mintDeposit(address recipient, uint256 amount, uint256 chain, address adapter, uint256 nonce, bytes32 sourceTx) external",
    "function balanceOf(address account) view returns (uint256)"
  ];

  const wrapper = new ethers.Contract(wrapperAddress, wrapperAbi, relayerWallet);

  const amoyDeposits = [
    {
      nonce: 4n,
      recipient: "0xa0E0D6dEf002E92dfcb660A923f778690aa8E694",
      amount6: 1000000000n, // 1000 USDT
      txHash: "0xfb7905345b608aff31d255aa1446c299fe5f45bf0129decc65317372241d4e6b"
    },
    {
      nonce: 5n,
      recipient: "0xa0E0D6dEf002E92dfcb660A923f778690aa8E694",
      amount6: 1000000000n, // 1000 USDT
      txHash: "0x87048a4ba3ed1aaad86f25f9b9db210bff1082ff3226b28ec6a1c4d940e8ec98"
    },
    {
      nonce: 6n,
      recipient: "0xa0E0D6dEf002E92dfcb660A923f778690aa8E694",
      amount6: 100000000n, // 100 USDT
      txHash: "0x9f5ae494b13a05888a1d6a510f19b6f42774733974b793888b95cb55aad86c44"
    }
  ];

  for (const dep of amoyDeposits) {
    const depId = await wrapper.depositId(80002n, amoyAdapterAddress, dep.nonce);
    const isProcessed = await wrapper.isDepositProcessed(depId);
    console.log(`Amoy Deposit Nonce ${dep.nonce} Processed: ${isProcessed}`);

    if (!isProcessed) {
      console.log(`Minting Amoy Deposit Nonce ${dep.nonce} (${ethers.formatUnits(dep.amount6, 6)} USDT.c to ${dep.recipient})...`);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");

      const tx = await wrapper.mintDeposit(
        dep.recipient,
        dep.amount6,
        80002n,
        amoyAdapterAddress,
        dep.nonce,
        dep.txHash,
        { gasLimit: 400000, gasPrice }
      );
      console.log(`Mint tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✓ Amoy Deposit Nonce ${dep.nonce} Minted! Tx Hash: ${receipt.hash}`);
    }
  }

  // Check balances
  const bscUser = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";
  const amoyUser = "0xa0E0D6dEf002E92dfcb660A923f778690aa8E694";
  console.log(`USDT.c Balance for Admin (${bscUser}): ${ethers.formatUnits(await wrapper.balanceOf(bscUser), 6)} USDT.c`);
  console.log(`USDT.c Balance for User (${amoyUser}): ${ethers.formatUnits(await wrapper.balanceOf(amoyUser), 6)} USDT.c`);
}

main().catch(console.error);
