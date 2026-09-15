import { normalizeApiBase, requestJson } from "./http";

const root = normalizeApiBase(import.meta.env.VITE_BACKEND_URL);
export function api<T>(path: string): Promise<T> {
  return requestJson<T>(root, path);
}
export interface Source {
  chainId: number;
  name: string;
  adapter: string;
  token: string;
  treasury: string;
  explorer: string;
}
export interface PublicConfig {
  chainId: number;
  sz: string;
  et: string;
  wrapper: string;
  sources: Source[];
}
export interface Activity {
  id: string;
  txHash: string;
  type: string;
  timestamp: number;
  packageId?: string;
  quantity?: string;
  usdtAmount?: string;
  etAmount?: string;
  status: string;
}
export interface Deposit {
  id: string;
  source: number;
  recipient: string;
  amount: string;
  sourceTx: string;
  mintTx?: string;
  state: string;
  error?: string;
}
