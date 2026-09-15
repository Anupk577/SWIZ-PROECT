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
  return typeof value === "string" && isAddress(value);
}
export async function indexProtocol({ provider, sz }, store, config) {
  const last = (await provider.getBlockNumber()) - config.confirmations;
  const from = store.cursor("events", config.startBlock - 1) + 1;
  if (from > last) return;
  const to = Math.min(last, from + 999);
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
    const user =
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
