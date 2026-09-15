import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const amoyRpc = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(amoyRpc);

  const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const relayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!adminKey || !relayerKey) throw new Error("Missing ADMIN_PRIVATE_KEY or RELAYER_PRIVATE_KEY in environment");
  const adminWallet = new ethers.Wallet(adminKey, provider);
  const relayerWallet = new ethers.Wallet(relayerKey, provider);

  console.log(`Admin Wallet:   ${adminWallet.address}`);
  console.log(`Relayer Wallet: ${relayerWallet.address}`);

  const adminBalance = await provider.getBalance(adminWallet.address);
  let relayerBalance = await provider.getBalance(relayerWallet.address);

  console.log(`Admin POL Balance:   ${ethers.formatEther(adminBalance)} POL`);
  console.log(`Relayer POL Balance: ${ethers.formatEther(relayerBalance)} POL`);

  if (relayerBalance < ethers.parseEther("0.05")) {
    console.log("Funding Relayer Wallet with 0.2 POL from Admin...");
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : ethers.parseUnits("30", "gwei");

    const fundTx = await adminWallet.sendTransaction({
      to: relayerWallet.address,
      value: ethers.parseEther("0.2"),
      gasPrice
    });
    console.log(`Funding tx sent: ${fundTx.hash}`);
    await fundTx.wait(2);
    relayerBalance = await provider.getBalance(relayerWallet.address);
    console.log(`✓ Relayer POL Balance after funding: ${ethers.formatEther(relayerBalance)} POL`);
  }

  const wrapperAddress = "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const wrapperAbi = [
    "function adapters(uint256) view returns (address)",
    "function isDepositProcessed(bytes32) view returns (bool)",
    "function depositId(uint256 chain, address adapter, uint256 nonce) public pure returns (bytes32)",
    "function mintDeposit(address recipient, uint256 amount, uint256 chain, address adapter, uint256 nonce, bytes32 sourceTx) external",
    "function balanceOf(address account) view returns (uint256)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function configureSource(uint256 chain, address adapter) external"
  ];

  const wrapperAsAdmin = new ethers.Contract(wrapperAddress, wrapperAbi, adminWallet);
  const wrapperAsRelayer = new ethers.Contract(wrapperAddress, wrapperAbi, relayerWallet);

  const BRIDGE_RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_RELAYER_ROLE"));
  const hasRelayerRole = await wrapperAsAdmin.hasRole(BRIDGE_RELAYER_ROLE, relayerWallet.address);
  console.log(`Relayer Has BRIDGE_RELAYER_ROLE: ${hasRelayerRole}`);

  // 1. Process BSC Testnet Deposit (Chain 97)
  const bscChainId = 97n;
  const bscAdapter = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";
  const bscNonce = 1n;
  const bscRecipient = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";
  const bscAmount6 = 100000000n; // 100 USDT
  const bscTxHash = "0xb6800c80f599fdb9cfc89cdccf551d73b67ae617bd21541562b17ce7d394d133";

  let configuredBscAdapter = await wrapperAsAdmin.adapters(bscChainId);
  console.log(`Configured BSC Adapter on Wrapper: ${configuredBscAdapter}`);

  if (configuredBscAdapter.toLowerCase() !== bscAdapter.toLowerCase()) {
    console.log(`Configuring BSC Adapter ${bscAdapter} for Chain 97...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : ethers.parseUnits("30", "gwei");
    const cfgTx = await wrapperAsAdmin.configureSource(bscChainId, bscAdapter, { gasPrice });
    await cfgTx.wait();
    console.log(`✓ BSC Adapter configured for Chain 97.`);
  }

  const bscDepId = await wrapperAsAdmin.depositId(bscChainId, bscAdapter, bscNonce);
  console.log(`BSC Deposit ID: ${bscDepId}`);

  const isBscProcessed = await wrapperAsAdmin.isDepositProcessed(bscDepId);
  console.log(`BSC Deposit Processed: ${isBscProcessed}`);

  if (!isBscProcessed) {
    console.log("Executing mintDeposit for BSC Testnet deposit...");
    try {
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : ethers.parseUnits("30", "gwei");

      const tx = await wrapperAsRelayer.mintDeposit(
        bscRecipient,
        bscAmount6,
        bscChainId,
        bscAdapter,
        bscNonce,
        bscTxHash,
        { gasLimit: 400000, gasPrice }
      );
      console.log(`Mint tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✓ BSC Deposit Minted successfully! Tx: ${receipt.hash}`);
    } catch (e) {
      console.error("Failed to mint BSC Deposit:", e);
    }
  } else {
    console.log("✓ BSC Deposit was already processed.");
  }

  // 2. Check Polygon Amoy Adapter deposits
  const amoyAdapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  let configuredAmoyAdapter = await wrapperAsAdmin.adapters(80002n);
  console.log(`Configured Amoy Adapter on Wrapper: ${configuredAmoyAdapter}`);

  if (configuredAmoyAdapter.toLowerCase() !== amoyAdapterAddress.toLowerCase()) {
    console.log(`Configuring Amoy Adapter ${amoyAdapterAddress} for Chain 80002...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : ethers.parseUnits("30", "gwei");
    const cfgTx = await wrapperAsAdmin.configureSource(80002n, amoyAdapterAddress, { gasPrice });
    await cfgTx.wait();
    console.log(`✓ Amoy Adapter configured for Chain 80002.`);
  }

  const adapterAbi = [
    "event Deposited(uint256 indexed nonce, address indexed depositor, address indexed recipient, uint256 amount6, uint256 sourceChainId)"
  ];
  const adapterContract = new ethers.Contract(amoyAdapterAddress, adapterAbi, provider);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 5000);
  console.log(`Querying events for Amoy adapter: ${amoyAdapterAddress} from block ${fromBlock} to ${currentBlock}...`);
  const filter = adapterContract.filters.Deposited();
  
  // Fetch in chunks of 10 blocks or directly if provider supports
  let logs: any[] = [];
  for (let b = fromBlock; b <= currentBlock; b += 10) {
    const toB = Math.min(currentBlock, b + 9);
    try {
      const chunk = await adapterContract.queryFilter(filter, b, toB);
      logs.push(...chunk);
    } catch (e) {}
  }

  console.log(`Found ${logs.length} Deposited events on Amoy adapter.`);

  for (const log of logs) {
    const event = log as ethers.EventLog;
    const { nonce, recipient, amount6 } = event.args;
    console.log(`Amoy Deposit Event -> Nonce: ${nonce}, Recipient: ${recipient}, Amount6: ${amount6}, TxHash: ${event.transactionHash}`);

    const amoyDepId = await wrapperAsAdmin.depositId(80002n, amoyAdapterAddress, nonce);
    const isAmoyProcessed = await wrapperAsAdmin.isDepositProcessed(amoyDepId);
    console.log(`Amoy Deposit Nonce ${nonce} Processed: ${isAmoyProcessed}`);

    if (!isAmoyProcessed) {
      console.log(`Executing mintDeposit for Amoy Deposit Nonce ${nonce}...`);
      try {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : ethers.parseUnits("30", "gwei");

        const tx = await wrapperAsRelayer.mintDeposit(
          recipient,
          amount6,
          80002n,
          amoyAdapterAddress,
          nonce,
          event.transactionHash,
          { gasLimit: 400000, gasPrice }
        );
        console.log(`Mint tx sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✓ Amoy Deposit Nonce ${nonce} Minted successfully! Tx: ${receipt.hash}`);
      } catch (e) {
        console.error(`Failed to mint Amoy Deposit Nonce ${nonce}:`, e);
      }
    } else {
      console.log(`✓ Amoy Deposit Nonce ${nonce} was already processed.`);
    }
  }

  const finalUsdtcBalance = await wrapperAsAdmin.balanceOf(bscRecipient);
  console.log(`Final USDT.c Balance for ${bscRecipient}: ${ethers.formatUnits(finalUsdtcBalance, 6)} USDT.c`);
}

main().catch(console.error);
