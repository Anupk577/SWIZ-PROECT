import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { polygonAmoy, bscTestnet, bsc, mainnet, sepolia } from "@reown/appkit/networks";
import { ConnectionController } from "@reown/appkit-controllers";
import { RPC_ENDPOINTS } from "../constants/contracts";

// Bridge extension RDNS on window.ethereum so AppKit checkInstalled detects browser extensions directly
if (typeof window !== "undefined" && (window as any).ethereum) {
  try {
    const eth = (window as any).ethereum;
    if (eth.isMetaMask) {
      eth["io.metamask"] = true;
    }
    if (eth.isCoinbaseWallet) {
      eth["com.coinbase.wallet"] = true;
    }
    if (eth.isRabby) {
      eth["io.rabby"] = true;
    }
  } catch {}
}

const customPolygonAmoy = {
  ...polygonAmoy,
  rpcUrls: {
    ...polygonAmoy.rpcUrls,
    default: {
      http: RPC_ENDPOINTS,
    },
  },
};

const getOrigin = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://sztoken-dapp.vercel.app";
};

const origin = getOrigin();
const iconUrl = `${origin}/swiz-logo-nav.jpg`;

export const appKitModal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [customPolygonAmoy, bscTestnet, bsc, mainnet, sepolia],
  defaultNetwork: customPolygonAmoy,
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID || "9ce8edabce7cd1b12d6efad5b0af9c5f",
  metadata: {
    name: "Swiz Smart",
    description: "Twenty-year progressive token unlock",
    url: origin,
    icons: [iconUrl, "https://sztoken-dapp.vercel.app/swiz-logo-nav.jpg"],
  },
  features: { analytics: false, email: false, socials: [] },
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  allWallets: "SHOW",
  themeMode: "dark",
});

/**
 * Open AppKit modal while resetting any stale WalletConnect connection error flags
 */
export const openAppKit = async (options?: any) => {
  try {
    ConnectionController.setWcError(false);
    ConnectionController.resetWcConnection();
  } catch {}
  return appKitModal.open(options);
};

