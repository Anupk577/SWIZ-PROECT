import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const amoyRpc = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(amoyRpc);

  const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const newRelayerKey = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!adminKey || !newRelayerKey) throw new Error("Missing ADMIN_PRIVATE_KEY or RELAYER_PRIVATE_KEY in environment");
  const adminWallet = new ethers.Wallet(adminKey, provider);
  const relayerWallet = new ethers.Wallet(newRelayerKey, provider);

  const oldRelayerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  console.log("==================================================");
  console.log(`Admin Wallet:       ${adminWallet.address}`);
  console.log(`New Relayer Wallet: ${relayerWallet.address}`);
  console.log("==================================================");

  const adminBalance = await provider.getBalance(adminWallet.address);
  console.log(`Admin POL Balance: ${ethers.formatEther(adminBalance)} POL`);

  const wrapperAddress = "0x2C74e4FBC2Da0DAE929c7f717Fc921bd81015C68";
  const wrapperAbi = [
    "function adapters(uint256) view returns (address)",
    "function isDepositProcessed(bytes32) view returns (bool)",
    "function depositId(uint256 chain, address adapter, uint256 nonce) public pure returns (bytes32)",
    "function mintDeposit(address recipient, uint256 amount, uint256 chain, address adapter, uint256 nonce, bytes32 sourceTx) external",
    "function balanceOf(address account) view returns (uint256)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account) external",
    "function revokeRole(bytes32 role, address account) external",
    "function configureSource(uint256 chain, address adapter) external"
  ];

  const wrapperAsAdmin = new ethers.Contract(wrapperAddress, wrapperAbi, adminWallet);
  const wrapperAsRelayer = new ethers.Contract(wrapperAddress, wrapperAbi, relayerWallet);

  const BRIDGE_RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_RELAYER_ROLE"));

  // 1. Manage Relayer Roles
  const hasNewRole = await wrapperAsAdmin.hasRole(BRIDGE_RELAYER_ROLE, relayerWallet.address);
  if (!hasNewRole) {
    console.log(`Granting BRIDGE_RELAYER_ROLE to ${relayerWallet.address}...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const grantTx = await wrapperAsAdmin.grantRole(BRIDGE_RELAYER_ROLE, relayerWallet.address, { gasPrice });
    await grantTx.wait();
    console.log(`✓ Granted BRIDGE_RELAYER_ROLE to ${relayerWallet.address}`);
  } else {
    console.log(`✓ ${relayerWallet.address} already has BRIDGE_RELAYER_ROLE`);
  }

  const hasOldRole = await wrapperAsAdmin.hasRole(BRIDGE_RELAYER_ROLE, oldRelayerAddress);
  if (hasOldRole) {
    console.log(`Revoking BRIDGE_RELAYER_ROLE from old relayer ${oldRelayerAddress}...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const revokeTx = await wrapperAsAdmin.revokeRole(BRIDGE_RELAYER_ROLE, oldRelayerAddress, { gasPrice });
    await revokeTx.wait();
    console.log(`✓ Revoked BRIDGE_RELAYER_ROLE from ${oldRelayerAddress}`);
  }

  // 2. Fund New Relayer
  let relayerBalance = await provider.getBalance(relayerWallet.address);
  console.log(`Current Relayer POL Balance: ${ethers.formatEther(relayerBalance)} POL`);

  if (relayerBalance < ethers.parseEther("0.08")) {
    console.log("Funding New Relayer Wallet with 0.12 POL from Admin...");
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const fundTx = await adminWallet.sendTransaction({
      to: relayerWallet.address,
      value: ethers.parseEther("0.12"),
      gasPrice
    });
    console.log(`Funding tx sent: ${fundTx.hash}`);
    await fundTx.wait();
    relayerBalance = await provider.getBalance(relayerWallet.address);
    console.log(`✓ Relayer POL Balance after funding: ${ethers.formatEther(relayerBalance)} POL`);
  }

  // 3. Configure BSC Adapter on Wrapper if needed
  const bscChainId = 97n;
  const bscAdapter = "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F";
  let configuredBscAdapter = await wrapperAsAdmin.adapters(bscChainId);
  console.log(`Configured BSC Adapter on Wrapper: ${configuredBscAdapter}`);

  if (configuredBscAdapter.toLowerCase() !== bscAdapter.toLowerCase()) {
    console.log(`Configuring BSC Adapter ${bscAdapter} for Chain 97...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const cfgTx = await wrapperAsAdmin.configureSource(bscChainId, bscAdapter, { gasPrice });
    await cfgTx.wait();
    console.log(`✓ BSC Adapter configured for Chain 97.`);
  }

  // 4. Configure Amoy Adapter on Wrapper if needed
  const amoyAdapterAddress = "0x098DeA8e03381E8187F472308004530D52E5A0df";
  let configuredAmoyAdapter = await wrapperAsAdmin.adapters(80002n);
  console.log(`Configured Amoy Adapter on Wrapper: ${configuredAmoyAdapter}`);

  if (configuredAmoyAdapter.toLowerCase() !== amoyAdapterAddress.toLowerCase()) {
    console.log(`Configuring Amoy Adapter ${amoyAdapterAddress} for Chain 80002...`);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");
    const cfgTx = await wrapperAsAdmin.configureSource(80002n, amoyAdapterAddress, { gasPrice });
    await cfgTx.wait();
    console.log(`✓ Amoy Adapter configured for Chain 80002.`);
  }

  // 5. Mint BSC Testnet Deposit
  const bscNonce = 1n;
  const bscRecipient = "0x9B5AfF6e8e7d6079bf35E77e35492f8e49e39c8E";
  const bscAmount6 = 100000000n; // 100 USDT
  const bscTxHash = "0xb6800c80f599fdb9cfc89cdccf551d73b67ae617bd21541562b17ce7d394d133";

  const bscDepId = await wrapperAsAdmin.depositId(bscChainId, bscAdapter, bscNonce);
  console.log(`BSC Deposit ID: ${bscDepId}`);

  const isBscProcessed = await wrapperAsAdmin.isDepositProcessed(bscDepId);
  console.log(`BSC Deposit Processed: ${isBscProcessed}`);

  if (!isBscProcessed) {
    console.log("Executing mintDeposit for BSC Testnet deposit...");
    try {
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");

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
      console.log(`✓ BSC Deposit Minted successfully! Tx Hash: ${receipt.hash}`);
    } catch (e) {
      console.error("Failed to mint BSC Deposit:", e);
    }
  } else {
    console.log("✓ BSC Deposit was already processed.");
  }

  // 6. Check Amoy Deposits from all candidate Amoy adapters
  const candidateAmoyAdapters = [
    "0x098DeA8e03381E8187F472308004530D52E5A0df",
    "0x693C018a441662aEC9377b2F25E59c1D6300d67e"
  ];

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 5000);
  const adapterAbi = [
    "event Deposited(uint256 indexed nonce, address indexed depositor, address indexed recipient, uint256 amount6, uint256 sourceChainId)"
  ];

  for (const adapt of candidateAmoyAdapters) {
    console.log(`Querying events for Amoy adapter: ${adapt}...`);
    const adapterContract = new ethers.Contract(adapt, adapterAbi, provider);
    const filter = adapterContract.filters.Deposited();

    let logs: any[] = [];
    for (let b = fromBlock; b <= currentBlock; b += 10) {
      const toB = Math.min(currentBlock, b + 9);
      try {
        const chunk = await adapterContract.queryFilter(filter, b, toB);
        logs.push(...chunk);
      } catch (e) {}
    }

    console.log(`Found ${logs.length} Deposited events on adapter ${adapt}`);

    for (const log of logs) {
      const event = log as ethers.EventLog;
      const { nonce, recipient, amount6 } = event.args;
      console.log(`Amoy Deposit Event -> Nonce: ${nonce}, Recipient: ${recipient}, Amount6: ${amount6}, TxHash: ${event.transactionHash}`);

      const amoyDepId = await wrapperAsAdmin.depositId(80002n, adapt, nonce);
      const isAmoyProcessed = await wrapperAsAdmin.isDepositProcessed(amoyDepId);
      console.log(`Amoy Deposit (Adapter ${adapt}, Nonce ${nonce}) Processed: ${isAmoyProcessed}`);

      if (!isAmoyProcessed) {
        console.log(`Executing mintDeposit for Amoy Deposit Nonce ${nonce}...`);
        try {
          const feeData = await provider.getFeeData();
          const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 130n) / 100n : ethers.parseUnits("35", "gwei");

          const tx = await wrapperAsRelayer.mintDeposit(
            recipient,
            amount6,
            80002n,
            adapt,
            nonce,
            event.transactionHash,
            { gasLimit: 400000, gasPrice }
          );
          console.log(`Mint tx sent: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`✓ Amoy Deposit Nonce ${nonce} Minted successfully! Tx Hash: ${receipt.hash}`);
        } catch (e) {
          console.error(`Failed to mint Amoy Deposit Nonce ${nonce}:`, e);
        }
      } else {
        console.log(`✓ Amoy Deposit Nonce ${nonce} was already processed.`);
      }
    }
  }

  const finalUsdtcBalance = await wrapperAsAdmin.balanceOf(bscRecipient);
  console.log("==================================================");
  console.log(`Final USDT.c Balance for ${bscRecipient}: ${ethers.formatUnits(finalUsdtcBalance, 6)} USDT.c`);
  console.log("==================================================");
}

main().catch(console.error);
