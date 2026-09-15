import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { polygonAmoy, bscTestnet, bsc, mainnet, sepolia } from "@reown/appkit/networks";
import { RPC_ENDPOINTS } from "../constants/contracts";

const customPolygonAmoy = {
  ...polygonAmoy,
  rpcUrls: {
    ...polygonAmoy.rpcUrls,
    default: {
      http: RPC_ENDPOINTS,
    },
  },
};

export const appKitModal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [customPolygonAmoy, bscTestnet, bsc, mainnet, sepolia],
  defaultNetwork: customPolygonAmoy,
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
  metadata: {
    name: "Swiz Smart",
    description: "Twenty-year progressive token unlock",
    url: window.location.origin,
    icons: [],
  },
  features: { analytics: false, email: false, socials: [] },
  themeMode: "dark",
});
