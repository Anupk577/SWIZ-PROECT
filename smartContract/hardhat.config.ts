import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

function getPrivateKey(): string {
  const key = process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!key) { throw new Error("Set PRIVATE_KEY for configured remote networks"); }
  let cleanKey = key.trim();
  if (cleanKey.length === 64 && !cleanKey.startsWith("0x")) {
    cleanKey = `0x${cleanKey}`;
  }
  if (cleanKey.startsWith("0x") && cleanKey.length === 66 && cleanKey !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return cleanKey;
  }
  throw new Error("PRIVATE_KEY is malformed");
}

const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy.drpc.org";
const deployerPrivateKey = process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY ? getPrivateKey() : undefined;

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    },
  },
  networks: {
    ...(process.env.BSC_TESTNET_RPC_URL ? { bscTestnet: { type: "http" as const, chainType: "generic" as const, url: process.env.BSC_TESTNET_RPC_URL, accounts: deployerPrivateKey ? [deployerPrivateKey] : [] } } : {}),
    ...(process.env.PRODUCTION_RPC_URL ? { production: { type: "http" as const, chainType: "generic" as const, url: process.env.PRODUCTION_RPC_URL, accounts: deployerPrivateKey ? [deployerPrivateKey] : [] } } : {}),
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
    },
    polygonAmoy: {
      type: "http",
      chainType: "generic",
      url: POLYGON_AMOY_RPC,
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
    },
    baseSepolia: {
      type: "http",
      chainType: "generic",
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
    },
  },
});
