// ABIs are generated from freshly compiled contracts by scripts/export-abis.mjs.
import abis from "./abis.json";
export const SZ_ABI = abis.SZToken;
export const WRAPPER_ABI = abis.USDTcWrapper;
export const ADAPTER_ABI = abis.SourceDepositAdapter;
export const TOKEN_ABI = [
  "function balanceOf(address) view returns(uint256)",
  "function allowance(address,address) view returns(uint256)",
  "function approve(address,uint256) returns(bool)",
  "function decimals() view returns(uint8)",
];
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 80002);
export const RPC =
  import.meta.env.VITE_POLYGON_AMOY_RPC_URL ||
  import.meta.env.VITE_RPC_URL ||
  "https://polygon-amoy.g.alchemy.com/v2/SkzrI3058h3g92BAFz9fU";
export const RPC_ENDPOINTS = [RPC];
export const EXPLORER = import.meta.env.VITE_EXPLORER_URL || "https://amoy.polygonscan.com";
export const ADDRESSES = {
  sz: import.meta.env.VITE_SZ_ADDRESS || "0x48D0334c745FE791465E5E62F8EB5Afb40D148E2",
  et: import.meta.env.VITE_ET_ADDRESS || "0x32728184F8D739809F1A74C9cAF3F7665E4dDEBd",
  usdt: import.meta.env.VITE_USDT_ADDRESS || "0x9effc8c62f9077EDB785E6482328A7BfD7eAbe9f",
  wrapper: import.meta.env.VITE_WRAPPER_ADDRESS || "0xAfECBA18585f6C9eb120fD89a56B53243856a4fB",
  adapter: import.meta.env.VITE_ADAPTER_ADDRESS || "0x098DeA8e03381E8187F472308004530D52E5A0df",
};

export const CONTRACT_ADDRESSES = {
  80002: {
    szToken: ADDRESSES.sz,
    etToken: ADDRESSES.et,
    usdtToken: ADDRESSES.usdt,
    usdtcWrapper: ADDRESSES.wrapper,
    sourceAdapter: ADDRESSES.adapter,
    szManager: ADDRESSES.sz,
  },
};
