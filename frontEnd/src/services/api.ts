import { normalizeApiBase, requestJson, postJson } from "./http";

const root = normalizeApiBase(import.meta.env.VITE_BACKEND_URL);
export function api<T>(path: string): Promise<T> {
  return requestJson<T>(root, path);
}
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return postJson<T>(root, path, body);
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
  user?: string;
  wallet?: string;
  primaryWallet?: string;
  secondaryWallet?: string;
  oldWallet?: string;
  newWallet?: string;
  oldSecondaryWallet?: string;
  newSecondaryWallet?: string;
  isPaused?: boolean;
  reason?: string;
  packagesMigrated?: number;
  role?: string;
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
export interface SecondaryWalletResponse {
  primaryWallet: string;
  secondaryWallet: string | null;
  status: "ACTIVE" | "REPLACED" | "UNSET";
  onChainSecondaryWallet: string | null;
  isLocked?: boolean;
  canUpdate?: boolean;
  isSecondaryWallet?: boolean;
  primaryForThisSecondary?: string | null;
  isReplaced?: boolean;
  isMigrated?: boolean;
  migratedTo?: string | null;
  isPaused?: boolean;
  createdAt: number | null;
  updatedAt: number | null;
}
export interface UserDetailsResponse {
  primaryWallet: string;
  secondaryWallet: string | null;
  secondaryWalletStatus: string;
  onChainSecondaryWallet: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  packageCount: number;
  activePackages: number;
  szBalance: string;
  packages: any[];
  depositCount: number;
  deposits: Deposit[];
  eventCount: number;
  events: Activity[];
  replacements: Array<{
    id: string;
    old_wallet: string;
    new_wallet: string;
    packages_migrated: number;
    tx_hash: string | null;
    timestamp: number;
  }>;
  isPaused?: boolean;
  pauseInfo?: {
    wallet: string;
    is_paused: boolean;
    reason: string;
    updated_at: number | null;
  };
  isSecondaryPaused?: boolean;
  secondaryPauseInfo?: {
    wallet: string;
    is_paused: boolean;
    reason: string;
    updated_at: number | null;
  };
}
export interface SecurityActivityResponse {
  total: number;
  activities: Activity[];
}
