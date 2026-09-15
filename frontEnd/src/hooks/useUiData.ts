import { useWeb3 } from "../context/Web3Context";
import { CHAIN_ID } from "../constants/contracts";
/** Presentation adapter for the original layout. Values originate only from the new chain reader. */
export function useUiData() {
  const v = useWeb3();
  const userPackages = v.packages.map((p) => ({
    packageId: Number(p.id),
    user: p.owner,
    initialStakedSZ: p.amount,
    currentStakedSZ: p.amount - p.boughtBack,
    purchasePriceUSD: p.originalPrice,
    stakedAmountUSD: p.purchaseValue,
    stakingTimestamp: Number(p.startTimestamp),
    purchaseTimestamp: Number(p.purchaseTimestamp),
    boughtBack: p.boughtBack,
    etReceived: p.etReceived,
    usdtReceived: p.usdtReceived,
    isOffline: p.isOffline,
    isUnstakedForBuyback: p.schedule.some(
      (s) => s.status === 1 && s.quantity > s.boughtBack
    ),
    isFullyBoughtBack: p.boughtBack === p.amount,
    schedule: p.schedule,
  }));
  return {
    ...v,
    ready: v.stats !== null && (!v.connected || v.balances !== null),
    walletState: {
      isConnected: v.connected,
      address: v.address ?? null,
      isAdmin: v.isAdmin,
      networkName:
        CHAIN_ID === 84532 ? "Base Sepolia Testnet" : `Network ${CHAIN_ID}`,
      usdtBalance: v.balances?.usdt ?? 0n,
      szBalance: v.balances?.sz ?? 0n,
      etBalance: v.balances?.et ?? 0n,
    },
    protocolStats: {
      currentPriceUSD: v.stats?.price ?? 0n,
      totalStakingPackages: Number(v.stats?.packages ?? 0n),
      totalStakedAmountUSD: v.stats?.value ?? 0n,
      buybackQueueLength: Number(v.stats?.queue ?? 0n),
    },
    userPackages,
    connectWallet: v.connect,
    disconnectWallet: v.disconnect,
  };
}
export type UiPackage = ReturnType<typeof useUiData>["userPackages"][number];
