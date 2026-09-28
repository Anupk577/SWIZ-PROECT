import { Contract, JsonRpcProvider, isAddress } from "ethers";
export const SZ_ABI = [
  "function getCurrentPrice() view returns(uint256)",
  "function totalStakingPackages() view returns(uint256)",
  "function totalStakedAmountUSD() view returns(uint256)",
  "function getBuybackQueueLength() view returns(uint256)",
  "function getUserPackageIds(address) view returns(uint256[])",
  "function packages(uint256) view returns(uint256 id,address owner,uint256 amount,uint256 originalPrice,uint256 startTimestamp,bool isOffline,uint256 etReceived,uint256 purchaseValue,uint256 purchaseTimestamp,uint256 boughtBack,uint256 usdtReceived,bytes32 paymentReference)",
  "event PackageCreated(uint256 indexed packageId,address indexed owner,uint256 amount,uint256 price,uint256 startTimestamp,bool isOffline)",
  "event BuybackExecuted(uint256 indexed packageId,address indexed buyer,address indexed originalStaker,uint256 tranche,uint256 quantity,uint256 usdtAmount,uint256 etAmount,uint256 buybackPrice)",
  "event TreasuryFunded(address indexed from,uint256 amount)",
  "event AdminBuyback(uint256 spent,uint256 quantity)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event OfflineRecorded(uint256 indexed packageId,bytes32 indexed referenceId,bool migration)",
  "event RoleGranted(bytes32 indexed role,address indexed account,address indexed sender)",
  "event RoleRevoked(bytes32 indexed role,address indexed account,address indexed sender)",
  "function secondaryWallets(address) view returns(address)",
  "function setSecondaryWallet(address)",
  "function setSecondaryWalletByAdmin(address,address)",
  "function replaceWallet(address,address)",
  "function pausedWallets(address) view returns(bool)",
  "function setWalletPaused(address,bool)",
  "function balanceOf(address) view returns(uint256)",
  "function activePackages(address) view returns(uint256)",
  "event SecondaryWalletUpdated(address indexed primaryWallet,address indexed secondaryWallet)",
  "event WalletReplaced(address indexed oldWallet,address indexed newWallet,uint256 packagesMigrated,uint256 szBalanceTransferred)",
  "event WalletPaused(address indexed wallet, bool isPaused)",
];
export const jsonSafe = (value) =>
  JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
export function createProtocol(config) {
  const provider = new JsonRpcProvider(config.rpc);
  return { provider, sz: new Contract(config.sz, SZ_ABI, provider) };
}
export function validAddress(value) {
  return (
    typeof value === "string" &&
    isAddress(value) &&
    value.toLowerCase() !== "0x0000000000000000000000000000000000000000"
  );
}
export async function indexProtocol({ provider, sz }, store, config) {
  const last = (await provider.getBlockNumber()) - config.confirmations;
  const from = store.cursor("events", config.startBlock - 1) + 1;
  if (from > last) return;
  const to = Math.min(last, from + 9);
  const logs = await provider.getLogs({
    address: await sz.getAddress(),
    fromBlock: from,
    toBlock: to,
  });
  for (const log of logs) {
    let event;
    try {
      event = sz.interface.parseLog(log);
    } catch {
      continue;
    }
    if (!event) continue;
    const block = await provider.getBlock(log.blockNumber);
    if (!block || block.hash !== log.blockHash)
      throw Error("Destination finality changed");
    const data = {};
    event.fragment.inputs.forEach((input, i) => {
      data[input.name] = jsonSafe(event.args[i]);
    });
    if (event.name === "WalletReplaced") {
      store.replaceWalletOffchain(
        event.args.oldWallet,
        event.args.newWallet,
        log.transactionHash,
        Number(event.args.packagesMigrated || 0)
      );
      continue;
    } else if (event.name === "SecondaryWalletUpdated") {
      store.setSecondaryWallet(
        event.args.primaryWallet,
        event.args.secondaryWallet,
        log.transactionHash
      );
      continue;
    } else if (event.name === "WalletPaused") {
      const isPaused = Boolean(event.args.isPaused);
      store.setWalletPaused(
        event.args.wallet,
        isPaused,
        isPaused ? "On-chain admin freeze event" : "On-chain admin unpause event",
        log.transactionHash
      );
      continue;
    }
    const user =
      event.args.newWallet ||
      event.args.primaryWallet ||
      event.args.oldWallet ||
      event.args.owner ||
      event.args.originalStaker ||
      event.args.from ||
      event.args.account ||
      event.args.buyer ||
      "0x0000000000000000000000000000000000000000";
    store.event({
      id: `${config.chainId}:${log.transactionHash}:${log.index}`,
      user,
      txHash: log.transactionHash,
      type: event.name,
      block: log.blockNumber,
      data: { ...data, timestamp: block.timestamp * 1000 },
    });
  }
  store.setCursor("events", to);
}
