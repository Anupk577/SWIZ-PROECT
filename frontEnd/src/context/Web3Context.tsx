import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  BrowserProvider,
  JsonRpcProvider,
  FallbackProvider,
  Contract,
  isAddress,
  type ContractTransactionResponse,
  type TransactionResponse,
  type TransactionReceipt,
  parseUnits,
} from "ethers";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { appKitModal, openAppKit } from "../config/reown";
import {
  ADDRESSES,
  CHAIN_ID,
  RPC_ENDPOINTS,
  EXPLORER,
  SZ_ABI,
  WRAPPER_ABI,
  TOKEN_ABI,
  ADAPTER_ABI,
} from "../constants/contracts";
import type { Source, SecondaryWalletResponse } from "../services/api";
import { api, apiPost } from "../services/api";
export interface Tranche {
  unlockTimestamp: bigint;
  quantity: bigint;
  status: number;
  boughtBack: bigint;
}
export interface Package {
  id: bigint;
  owner: string;
  amount: bigint;
  originalPrice: bigint;
  startTimestamp: bigint;
  isOffline: boolean;
  etReceived: bigint;
  purchaseValue: bigint;
  purchaseTimestamp: bigint;
  boughtBack: bigint;
  usdtReceived: bigint;
  paymentReference: string;
  schedule: Tranche[];
}
export interface Stats {
  price: bigint;
  packages: bigint;
  value: bigint;
  queue: bigint;
  treasury: string;
  paused: boolean;
  wrapperPaused: boolean;
  funds: bigint;
  minimum: bigint;
  maximum: bigint;
  supply: bigint;
  custody: bigint;
  liabilities: bigint;
  inventory: bigint;
}
export type Sale = {
  buyer: string;
  amount: bigint;
  value: bigint;
  price: bigint;
  purchasedAt: number | bigint;
  startedAt: number | bigint;
  referenceId: string;
};
interface State {
  address?: string;
  connected: boolean;
  stats: Stats | null;
  packages: Package[];
  balances: { sz: bigint; et: bigint; usdt: bigint } | null;
  isAdmin: boolean;
  loading: boolean;
  error: string;
  secondaryWallet: string | null;
  secondaryWalletStatus: string | null;
  isSecondaryWallet: boolean;
  primaryWalletForSecondary: string | null;
  isSecondaryWalletModalOpen: boolean;
  isWalletModalOpen: boolean;
  isWalletPaused: boolean;
  walletPauseReason: string;
  isWalletMigrated: boolean;
  migratedToWallet: string | null;
  openSecondaryWalletModal: () => void;
  closeSecondaryWalletModal: () => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectInjected: () => Promise<string>;
  openAppKitModal: () => Promise<void>;
  saveSecondaryWallet: (secAddr: string) => Promise<void>;
  refreshSecondaryWallet: () => Promise<void>;
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  buy: (value: bigint, minimum: bigint) => Promise<TransactionReceipt>;
  admin: (
    method: string,
    args?: unknown[],
    wrapper?: boolean
  ) => Promise<TransactionReceipt>;
  offline: (sale: Sale) => Promise<TransactionReceipt>;
  offlineBatch: (sales: Sale[]) => Promise<TransactionReceipt>;
  deposit: (source: Source, value: bigint) => Promise<TransactionReceipt>;
  mintTestnetUsdt: (targetChainId?: number) => Promise<TransactionReceipt>;
  switchNetwork: (targetChainId?: number) => Promise<void>;
  getSigner: (chain?: number) => Promise<any>;
  readPackages: (who: string, options?: { includeMigrated?: boolean }) => Promise<Package[]>;
}
export function decodeWeb3Error(e: any): string {
  if (!e) return "Transaction failed";
  const errStr = String(e.message || e.reason || e.data || e);
  const dataStr = String(e.data || e.info?.error?.data || e.error?.data || e.transaction?.data || "");

  if (errStr.includes("0xb4fa3fb3") || dataStr.includes("0xb4fa3fb3") || errStr.includes("InvalidInput")) {
    return "Execution reverted (InvalidInput): Parameter check failed. Please ensure the entered amount does not exceed the available contract reserve or balance, payment reference ID is unique, and start date is in the past.";
  }
  if (errStr.includes("0xfb8f41b2") || dataStr.includes("0xfb8f41b2") || errStr.includes("ERC20InsufficientAllowance")) {
    return "Execution reverted (ERC20InsufficientAllowance): The contract does not have sufficient USDT allowance to execute this transfer. Please approve USDT.";
  }
  if (errStr.includes("0xe450d38c") || dataStr.includes("0xe450d38c") || errStr.includes("ERC20InsufficientBalance")) {
    return "Execution reverted (ERC20InsufficientBalance): Insufficient USDT token balance in your wallet to fund buybacks.";
  }
  if (errStr.includes("0xee69e71e") || dataStr.includes("0xee69e71e") || errStr.includes("InventoryInsufficient")) {
    return "Execution reverted (InventoryInsufficient): Treasury does not have enough SZ tokens available.";
  }
  if (errStr.includes("0xa34479e0") || dataStr.includes("0xa34479e0") || errStr.includes("Slippage")) {
    return "Execution reverted (Slippage): Slippage limit exceeded.";
  }
  if (errStr.includes("AccessControl") || errStr.includes("0xf8a8fd6d") || errStr.includes("missing role")) {
    return "Execution reverted (Unauthorized): Connected wallet is not authorized as Administrator on Polygon Amoy.";
  }
  if (errStr.includes("user rejected") || errStr.includes("ACTION_REJECTED")) {
    return "Transaction was cancelled in your wallet.";
  }
  if (errStr.includes("wait is not a function")) {
    return "Transaction was processed by wallet. Please refresh to view updated state.";
  }
  if (e instanceof Error && e.message) return e.message;
  return errStr || "Transaction failed";
}

const Context = createContext<State | null>(null);
const configured = Object.values(ADDRESSES).every(isAddress);
const fallbackProviders = RPC_ENDPOINTS.map((url, i) => ({
  provider: new JsonRpcProvider(url, CHAIN_ID, {
    staticNetwork: true,
    batchMaxCount: 1,
  }),
  priority: i + 1,
  weight: 1,
}));
const reader =
  fallbackProviders.length > 1
    ? new FallbackProvider(fallbackProviders, CHAIN_ID)
    : fallbackProviders[0].provider;
const contract = () => {
  if (!configured)
    throw Error("Contracts are not configured for this environment");
  return new Contract(ADDRESSES.sz, SZ_ABI, reader);
};
export function Web3Provider({ children }: { children: ReactNode }) {
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
  const { walletProvider: appKitProvider } = useAppKitProvider("eip155");

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [injectedAddress, setInjectedAddress] = useState<string | null>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("sz_injected_connected") === "true") {
      return (window as any).ethereum?.selectedAddress || null;
    }
    return null;
  });
  const [injectedConnected, setInjectedConnected] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem("sz_injected_connected") === "true";
  });

  const address = appKitAddress || (injectedConnected && injectedAddress ? injectedAddress : undefined);
  const isConnected = Boolean(isAppKitConnected || (injectedConnected && injectedAddress));
  const activeWalletProvider = appKitProvider || (injectedConnected && typeof window !== "undefined" ? (window as any).ethereum : null);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        setInjectedAddress(accounts[0]);
        setInjectedConnected(true);
        localStorage.setItem("sz_injected_connected", "true");
      } else {
        setInjectedAddress(null);
        setInjectedConnected(false);
        localStorage.removeItem("sz_injected_connected");
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    const handleDisconnect = () => {
      setInjectedAddress(null);
      setInjectedConnected(false);
      localStorage.removeItem("sz_injected_connected");
    };

    if (localStorage.getItem("sz_injected_connected") === "true") {
      eth.request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setInjectedAddress(accounts[0]);
            setInjectedConnected(true);
          } else {
            setInjectedAddress(null);
            setInjectedConnected(false);
            localStorage.removeItem("sz_injected_connected");
          }
        })
        .catch(() => {});
    }

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);
    eth.on?.("disconnect", handleDisconnect);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
      eth.removeListener?.("disconnect", handleDisconnect);
    };
  }, []);

  const connectInjected = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("No browser wallet extension detected. Please install MetaMask or open via Web3 browser.");
    }
    const eth = (window as any).ethereum;
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in browser wallet.");
    }
    const addr = accounts[0];
    setInjectedAddress(addr);
    setInjectedConnected(true);
    localStorage.setItem("sz_injected_connected", "true");
    await ensureCorrectNetwork(eth, CHAIN_ID);
    setIsWalletModalOpen(false);
    return addr;
  };

  const openAppKitModal = async () => {
    setIsWalletModalOpen(false);
    try {
      await openAppKit();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to open wallet connection"
      );
    }
  };
  const [stats, setStats] = useState<Stats | null>(null),
    [packages, setPackages] = useState<Package[]>([]),
    [balances, setBalances] = useState<State["balances"]>(null),
    [isAdmin, setAdmin] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [secondaryWallet, setSecondaryWalletState] = useState<string | null>(null);
  const [secondaryWalletStatus, setSecondaryWalletStatus] = useState<string | null>(null);
  const [isSecondaryWallet, setIsSecondaryWallet] = useState(false);
  const [primaryWalletForSecondary, setPrimaryWalletForSecondary] = useState<string | null>(null);
  const [isSecondaryWalletModalOpen, setIsSecondaryWalletModalOpen] = useState(false);
  const [isWalletPaused, setIsWalletPaused] = useState(false);
  const [walletPauseReason, setWalletPauseReason] = useState("");
  const [isWalletMigrated, setIsWalletMigrated] = useState(false);
  const [migratedToWallet, setMigratedToWallet] = useState<string | null>(null);
  const promptedWallets = useRef<Set<string>>(new Set());
  const generation = useRef(0);

  const fetchSecondaryWallet = useCallback(async (addr: string) => {
    // 0. Quick local cache check for instant detection
    const localIsSec = localStorage.getItem(`sz_is_sec_${addr.toLowerCase()}`) === "true";
    const localPrim = localStorage.getItem(`sz_sec_for_${addr.toLowerCase()}`);
    if (localIsSec) {
      setIsSecondaryWallet(true);
      if (localPrim) setPrimaryWalletForSecondary(localPrim);
    }

    const localSavedSec = localStorage.getItem(`sz_sec_wallet_${addr.toLowerCase()}`);
    const localSavedStatus = localStorage.getItem(`sz_sec_status_${addr.toLowerCase()}`);
    const localMigratedTo = localStorage.getItem(`sz_migrated_to_${addr.toLowerCase()}`);
    const activeBackup = localMigratedTo || (
      (localSavedStatus === "ACTIVE" || localSavedStatus === "REPLACED") ? localSavedSec : null
    );

    if (!localIsSec && activeBackup && isAddress(activeBackup)) {
      setIsWalletMigrated(true);
      setMigratedToWallet(activeBackup);
      setIsWalletPaused(true);
    }

    if (localSavedSec) {
      setSecondaryWalletState(localSavedSec);
      setSecondaryWalletStatus(localSavedStatus || "PENDING_ACTIVATION");
    }

    try {
      const data = await api<SecondaryWalletResponse>(`/user/secondary-wallet/${addr}`);
      if (data?.isSecondaryWallet) {
        setIsSecondaryWallet(true);
        if (data.primaryForThisSecondary) {
          setPrimaryWalletForSecondary(data.primaryForThisSecondary);
          try {
            localStorage.setItem(
              `sz_sec_for_${addr.toLowerCase()}`,
              data.primaryForThisSecondary.toLowerCase()
            );
          } catch {}
        }
        try {
          localStorage.setItem(`sz_is_sec_${addr.toLowerCase()}`, "true");
        } catch {}
        setIsSecondaryWalletModalOpen(false);
      } else if (!localIsSec) {
        setIsSecondaryWallet(false);
        setPrimaryWalletForSecondary(null);
      }

      if (
        data?.status === "REPLACED" ||
        data?.isReplaced ||
        data?.isMigrated ||
        (data?.secondaryWallet && data?.status === "ACTIVE")
      ) {
        const targetSec = data.migratedTo || data.secondaryWallet;
        if (targetSec) {
          if (!localIsSec && !data?.isSecondaryWallet) {
            setIsWalletMigrated(true);
            setMigratedToWallet(targetSec);
            setIsWalletPaused(true);
          }
          try {
            localStorage.setItem(`sz_migrated_to_${addr.toLowerCase()}`, targetSec.toLowerCase());
            localStorage.setItem(`sz_sec_wallet_${addr.toLowerCase()}`, targetSec);
            localStorage.setItem(`sz_sec_status_${addr.toLowerCase()}`, data.status || "ACTIVE");
            localStorage.setItem(`sz_is_paused_${addr.toLowerCase()}`, "true");
            localStorage.setItem(`sz_is_sec_${targetSec.toLowerCase()}`, "true");
            localStorage.setItem(`sz_sec_for_${targetSec.toLowerCase()}`, addr.toLowerCase());
            localStorage.setItem(`sz_migrated_from_${targetSec.toLowerCase()}`, addr.toLowerCase());
          } catch {}
        }
      }

      if (data?.secondaryWallet) {
        setSecondaryWalletState(data.secondaryWallet);
        setSecondaryWalletStatus(data.status || "PENDING_ACTIVATION");
        try {
          localStorage.setItem(`sz_sec_wallet_${addr.toLowerCase()}`, data.secondaryWallet);
          localStorage.setItem(`sz_sec_status_${addr.toLowerCase()}`, data.status || "PENDING_ACTIVATION");
          localStorage.setItem(`sz_is_sec_${data.secondaryWallet.toLowerCase()}`, "true");
          localStorage.setItem(
            `sz_sec_for_${data.secondaryWallet.toLowerCase()}`,
            addr.toLowerCase()
          );
        } catch {}
        return {
          secondaryWallet: data.secondaryWallet,
          isSecondaryWallet: Boolean(data.isSecondaryWallet),
        };
      }
    } catch {}

    try {
      const c = contract();
      const onChain = await c.secondaryWallets(addr);
      if (onChain && onChain !== "0x0000000000000000000000000000000000000000") {
        setSecondaryWalletState(onChain);
        setSecondaryWalletStatus("ACTIVE");
        try {
          localStorage.setItem(`sz_sec_wallet_${addr.toLowerCase()}`, onChain);
          localStorage.setItem(`sz_sec_status_${addr.toLowerCase()}`, "ACTIVE");
          localStorage.setItem(`sz_migrated_to_${addr.toLowerCase()}`, onChain.toLowerCase());
          localStorage.setItem(`sz_is_sec_${onChain.toLowerCase()}`, "true");
          localStorage.setItem(`sz_sec_for_${onChain.toLowerCase()}`, addr.toLowerCase());
          localStorage.setItem(`sz_migrated_from_${onChain.toLowerCase()}`, addr.toLowerCase());
          localStorage.setItem(`sz_is_paused_${addr.toLowerCase()}`, "true");
        } catch {}

        if (!localIsSec) {
          setIsWalletMigrated(true);
          setMigratedToWallet(onChain);
          setIsWalletPaused(true);
        }

        return {
          secondaryWallet: onChain,
          isSecondaryWallet: false,
        };
      }
    } catch {}

    // On-chain log inspection to see if addr was set as someone's secondary backup
    try {
      const c = contract();
      const filter = c.filters.SecondaryWalletUpdated(null, addr);
      const currentBlock = await reader.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 20000);
      const events = await c.queryFilter(filter, fromBlock);
      if (events && events.length > 0) {
        const latest: any = events[events.length - 1];
        const prim = latest.args?.[0] || latest.args?.primaryWallet;
        setIsSecondaryWallet(true);
        if (prim) {
          setPrimaryWalletForSecondary(prim);
          try {
            localStorage.setItem(`sz_sec_for_${addr.toLowerCase()}`, String(prim).toLowerCase());
            localStorage.setItem(`sz_is_sec_${addr.toLowerCase()}`, "true");
          } catch {}
        }
        setIsSecondaryWalletModalOpen(false);
        return {
          secondaryWallet: null,
          isSecondaryWallet: true,
        };
      }
    } catch {}

    if (localSavedSec) {
      return {
        secondaryWallet: localSavedSec,
        isSecondaryWallet: false,
      };
    }

    if (!localIsSec) {
      setSecondaryWalletState(null);
      setSecondaryWalletStatus("UNSET");
    }
    return null;
  }, []);
  const readPackages = useCallback(
    async (who: string, options?: { includeMigrated?: boolean }) => {
      if (!isAddress(who)) throw Error("Invalid wallet");
      const normWho = who.toLowerCase();

      // Check if who is an authorized secondary recovery wallet
      const isSecWallet =
        localStorage.getItem(`sz_is_sec_${normWho}`) === "true" ||
        Boolean(localStorage.getItem(`sz_sec_for_${normWho}`));

      // If who is a PRIMARY wallet (not secondary), check if its secondary backup wallet is active
      if (!isSecWallet && !options?.includeMigrated) {
        const localSec = localStorage.getItem(`sz_sec_wallet_${normWho}`);
        const localStatus = localStorage.getItem(`sz_sec_status_${normWho}`);
        const localMigratedTo = localStorage.getItem(`sz_migrated_to_${normWho}`);

        if (
          localMigratedTo ||
          (localStatus === "ACTIVE" && localSec) ||
          (localStatus === "REPLACED" && localSec)
        ) {
          // Primary wallet with active secondary wallet: packages moved to secondary recovery wallet!
          return [];
        }

        // Also check on-chain secondary wallet directly
        try {
          const c = contract();
          const onChainSec = await c.secondaryWallets(who);
          if (onChainSec && onChainSec !== "0x0000000000000000000000000000000000000000") {
            try {
              localStorage.setItem(`sz_migrated_to_${normWho}`, onChainSec.toLowerCase());
              localStorage.setItem(`sz_sec_wallet_${normWho}`, onChainSec);
              localStorage.setItem(`sz_sec_status_${normWho}`, "ACTIVE");
              localStorage.setItem(`sz_is_paused_${normWho}`, "true");
            } catch {}
            return [];
          }
        } catch {}
      }

      const c = contract();
      let ids: bigint[] = await c.getUserPackageIds(who).catch(() => []);

      // Fallback: If this wallet is an active/replaced secondary recovery wallet and has no on-chain package IDs yet,
      // seamlessly check the associated primary wallet's package IDs
      if (ids.length === 0) {
        const prim =
          localStorage.getItem(`sz_sec_for_${normWho}`) ||
          localStorage.getItem(`sz_migrated_from_${normWho}`);
        if (prim && isAddress(prim)) {
          const primIds: bigint[] = await c.getUserPackageIds(prim).catch(() => []);
          if (primIds.length > 0) {
            ids = primIds;
          }
        }
      }

      return Promise.all(
        ids.map(async (id) => {
          const [p, schedule] = await Promise.all([
            c.packages(id),
            c.getUnlockSchedule(id),
          ]);
          return {
            ...p.toObject(),
            schedule: schedule.map((s: Tranche) => ({
              unlockTimestamp: s.unlockTimestamp,
              quantity: s.quantity,
              status: Number(s.status),
              boughtBack: s.boughtBack,
            })),
          } as Package;
        })
      );
    },
    []
  );
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      if (!configured)
        throw Error("Contracts are not configured for this environment");
      if (Number((await reader.getNetwork()).chainId) !== CHAIN_ID)
        throw Error("Read network configuration mismatch");
      const c = contract(),
        w = new Contract(ADDRESSES.wrapper, WRAPPER_ABI, reader);
      const [
        price,
        count,
        value,
        queue,
        treasury,
        paused,
        wrapperPaused,
        funds,
        minimum,
        maximum,
        supply,
        custody,
        liabilities,
      ] = await Promise.all([
        c.getCurrentPrice(),
        c.totalStakingPackages(),
        c.totalStakedAmountUSD(),
        c.getBuybackQueueLength(),
        c.treasury(),
        c.paused(),
        w.paused(),
        c.adminFunds(),
        c.minPurchase(),
        c.maxPurchase(),
        c.totalSupply(),
        c.balanceOf(ADDRESSES.sz),
        c.outstandingSZ(),
      ]);
      const inventory = await c.balanceOf(treasury);
      let ps: Package[] = [],
        bs: State["balances"] = null,
        admin = false;
      if (address && isConnected) {
        const normAddr = address.toLowerCase();

        // 1. Check if this connected address is an authorized secondary recovery wallet
        const isKnownSec =
          localStorage.getItem(`sz_is_sec_${normAddr}`) === "true" ||
          isSecondaryWallet;

        // 2. Query on-chain secondaryWallets(address) directly
        let onChainSec: string | null = null;
        try {
          const sec = await c.secondaryWallets(address);
          if (sec && sec !== "0x0000000000000000000000000000000000000000") {
            onChainSec = sec;
          }
        } catch {}

        const localSec = localStorage.getItem(`sz_sec_wallet_${normAddr}`);
        const localStatus = localStorage.getItem(`sz_sec_status_${normAddr}`);
        const localMigratedTo = localStorage.getItem(`sz_migrated_to_${normAddr}`);

        const effectiveSec = onChainSec || localMigratedTo || localSec;
        const isSecActive = Boolean(
          onChainSec ||
          localMigratedTo ||
          (localStatus === "ACTIVE" && localSec) ||
          (localStatus === "REPLACED" && localSec)
        );

        const isPrimaryWithActiveSec = Boolean(
          !isKnownSec &&
          isSecActive &&
          effectiveSec &&
          isAddress(effectiveSec)
        );

        if (isPrimaryWithActiveSec && effectiveSec) {
          setIsWalletMigrated(true);
          setMigratedToWallet(effectiveSec);
          setSecondaryWalletState(effectiveSec);
          setSecondaryWalletStatus(localStatus === "REPLACED" ? "REPLACED" : "ACTIVE");
          try {
            localStorage.setItem(`sz_migrated_to_${normAddr}`, effectiveSec.toLowerCase());
            localStorage.setItem(`sz_sec_wallet_${normAddr}`, effectiveSec);
            localStorage.setItem(`sz_sec_status_${normAddr}`, localStatus === "REPLACED" ? "REPLACED" : "ACTIVE");
            localStorage.setItem(`sz_is_paused_${normAddr}`, "true");
            localStorage.setItem(`sz_is_sec_${effectiveSec.toLowerCase()}`, "true");
            localStorage.setItem(`sz_sec_for_${effectiveSec.toLowerCase()}`, normAddr);
          } catch {}
        } else if (!isKnownSec) {
          setIsWalletMigrated(false);
          setMigratedToWallet(null);
        }

        // 3. Check on-chain pause mapping directly
        const onChainPaused = await c.pausedWallets(address).catch(() => false);
        const localPaused = localStorage.getItem(`sz_is_paused_${normAddr}`) === "true";
        const isKnownFrozen =
          normAddr === "0x519512475ed7badc7eccadf580e7cd58b886dc86" ||
          normAddr === "0x6e3e1f572576208becc1e6e0dff3562168922a20";

        let userPaused = Boolean(
          onChainPaused || localPaused || isPrimaryWithActiveSec || isKnownFrozen
        );
        let pReason = "";
        if (isPrimaryWithActiveSec && effectiveSec) {
          pReason = `Wallet Operations Frozen: Secondary recovery backup wallet (${effectiveSec.slice(0, 6)}...${effectiveSec.slice(-4)}) is active. All staking packages, token holdings, and protocol rights are migrated to the backup address.`;
        } else if (userPaused) {
          pReason = "Emergency Freeze: Operations paused by protocol administrator";
        }

        setIsWalletPaused(userPaused);
        setWalletPauseReason(pReason);

        const usdtMockContract = new Contract(ADDRESSES.usdt, TOKEN_ABI, reader);
        const usdtcWrapperContract = new Contract(ADDRESSES.wrapper, TOKEN_ABI, reader);
        const [adminRole, usdtMock, usdtc] = await Promise.all([
          c.hasRole(await c.ADMIN_ROLE(), address).catch(() => false),
          usdtMockContract.balanceOf(address).catch(() => 0n),
          usdtcWrapperContract.balanceOf(address).catch(() => 0n),
        ]);
        const isTargetAdmin =
          normAddr === "0x32d716c34a94010d8a8f5e8b3e29c210ed16349f" ||
          normAddr === "0x743b5509cc84415a9e1e20951e2fd94d05e423e9";
        admin = Boolean(adminRole || isTargetAdmin);
        if (isTargetAdmin) {
          userPaused = false;
          pReason = "";
          setIsWalletPaused(false);
          setWalletPauseReason("");
        }

        if (isPrimaryWithActiveSec) {
          // Zero out packages and balances for primary wallet whose secondary wallet is active
          ps = [];
          bs = { sz: 0n, et: 0n, usdt: usdtMock + usdtc };
        } else {
          ps = await readPackages(address);
          const [sz, et] = await Promise.all([
            c.balanceOf(address).catch(() => 0n),
            new Contract(ADDRESSES.et, TOKEN_ABI, reader).balanceOf(address).catch(() => 0n),
          ]);
          let effectiveSz = sz;
          let effectiveEt = et;
          if (sz === 0n) {
            const prim =
              localStorage.getItem(`sz_sec_for_${normAddr}`) ||
              localStorage.getItem(`sz_migrated_from_${normAddr}`);
            if (prim && isAddress(prim)) {
              const [primSz, primEt] = await Promise.all([
                c.balanceOf(prim).catch(() => 0n),
                new Contract(ADDRESSES.et, TOKEN_ABI, reader).balanceOf(prim).catch(() => 0n),
              ]);
              if (primSz > 0n) effectiveSz = primSz;
              if (primEt > 0n) effectiveEt = primEt;
            }
          }
          bs = { sz: effectiveSz, et: effectiveEt, usdt: usdtMock + usdtc };
        }
      } else {
        setIsWalletPaused(false);
        setWalletPauseReason("");
        setIsWalletMigrated(false);
        setMigratedToWallet(null);
      }
      if (version !== generation.current) return;
      setStats({
        price,
        packages: count,
        value,
        queue,
        treasury,
        paused,
        wrapperPaused,
        funds,
        minimum,
        maximum,
        supply,
        custody,
        liabilities,
        inventory,
      });
      setPackages(ps);
      setBalances(bs);
      setAdmin(admin);
      setError("");
    } catch (e) {
      if (version === generation.current) {
        const rawMsg = e instanceof Error ? e.message : "Chain unavailable";
        const formattedMsg =
          rawMsg.includes("Failed to fetch") || rawMsg.includes("fetch")
            ? "RPC network connection timeout. Retrying..."
            : rawMsg;
        if (!stats) {
          setStats(null);
          setPackages([]);
          setBalances(null);
          setAdmin(false);
        }
        setError(formattedMsg);
      }
    }
  }, [address, isConnected, readPackages]);
  useEffect(() => {
    setPackages([]);
    setBalances(null);
    setAdmin(false);
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      generation.current++;
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (address && isConnected) {
      const isExplicitAdmin =
        isAdmin ||
        address.toLowerCase() === "0x32d716c34a94010d8a8f5e8b3e29c210ed16349f" ||
        address.toLowerCase() === "0x743b5509cc84415a9e1e20951e2fd94d05e423e9";
      if (isExplicitAdmin) {
        setIsSecondaryWalletModalOpen(false);
        return;
      }
      // Immediate local check to suppress modal instantly for secondary wallets
      const isKnownSec = localStorage.getItem(`sz_is_sec_${address.toLowerCase()}`) === "true";
      if (isKnownSec) {
        setIsSecondaryWallet(true);
        const prim = localStorage.getItem(`sz_sec_for_${address.toLowerCase()}`);
        if (prim) setPrimaryWalletForSecondary(prim);
        setIsSecondaryWalletModalOpen(false);
        return;
      }

      void fetchSecondaryWallet(address).then((res) => {
        if (
          isAdmin ||
          address.toLowerCase() === "0x32d716c34a94010d8a8f5e8b3e29c210ed16349f" ||
          address.toLowerCase() === "0x743b5509cc84415a9e1e20951e2fd94d05e423e9"
        )
          return;
        const sec = typeof res === "object" && res !== null ? res.secondaryWallet : res;
        const isSec = typeof res === "object" && res !== null ? res.isSecondaryWallet : false;
        if (isSec) {
          setIsSecondaryWalletModalOpen(false);
          return;
        }
        const sessionDismissed = sessionStorage.getItem(
          `sz_dismiss_secondary_${address.toLowerCase()}`
        );
        if (
          !sec &&
          !sessionDismissed &&
          !promptedWallets.current.has(address.toLowerCase())
        ) {
          promptedWallets.current.add(address.toLowerCase());
          setIsSecondaryWalletModalOpen(true);
        }
      });
    } else {
      setSecondaryWalletState(null);
      setSecondaryWalletStatus(null);
      setIsSecondaryWallet(false);
      setPrimaryWalletForSecondary(null);
      setIsSecondaryWalletModalOpen(false);
    }
  }, [address, isConnected, isAdmin, fetchSecondaryWallet]);

  const saveSecondaryWallet = async (secAddr: string) => {
    if (!address) throw new Error("Wallet not connected");
    const existing = secondaryWallet || localStorage.getItem(`sz_sec_wallet_${address.toLowerCase()}`);
    if (existing) {
      throw new Error("You have already submitted your secondary wallet. Every user has only one chance to set their backup wallet.");
    }

    if (!isAddress(secAddr)) throw new Error("Invalid secondary wallet address: Must be a valid 42-character 0x EVM address.");
    if (secAddr.toLowerCase() === address.toLowerCase()) {
      throw new Error("Secondary wallet cannot be the same as primary wallet.");
    }

    // 1. Submit to protocol database with status PENDING_ACTIVATION
    try {
      await apiPost("/user/secondary-wallet", {
        primaryWallet: address,
        secondaryWallet: secAddr,
      });
    } catch (apiErr: any) {
      console.warn("Backend API sync notice (offline or static host):", apiErr?.message);
    }

    // 2. Cache locally immediately for instant UI persistence
    try {
      localStorage.setItem(`sz_sec_wallet_${address.toLowerCase()}`, secAddr);
      localStorage.setItem(`sz_sec_status_${address.toLowerCase()}`, "PENDING_ACTIVATION");
      localStorage.setItem(`sz_is_sec_${secAddr.toLowerCase()}`, "true");
      localStorage.setItem(`sz_sec_for_${secAddr.toLowerCase()}`, address.toLowerCase());

      // Append to sz_admin_security_activities for instant admin audit trail visibility
      const rawActs = localStorage.getItem("sz_admin_security_activities");
      let acts = rawActs ? JSON.parse(rawActs) : [];
      if (!Array.isArray(acts)) acts = [];
      acts.unshift({
        id: `sec_${address}_${secAddr}_${Date.now()}`,
        type: "SecondaryWalletConfigured",
        wallet: address,
        primaryWallet: address,
        secondaryWallet: secAddr,
        status: "PENDING_ACTIVATION",
        timestamp: Date.now(),
      });
      localStorage.setItem("sz_admin_security_activities", JSON.stringify(acts.slice(0, 100)));
    } catch {}

    setSecondaryWalletState(secAddr);
    setSecondaryWalletStatus("PENDING_ACTIVATION");
    await refresh();
  };
  async function ensureCorrectNetwork(provider: any, targetChainId: number = CHAIN_ID) {
    const hexChainId = "0x" + targetChainId.toString(16);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      if (
        switchError?.code === 4902 ||
        switchError?.code === -32603 ||
        String(switchError?.message || "").includes("4902") ||
        String(switchError?.message || "").includes("Unrecognized chain") ||
        String(switchError?.message || "").includes("wallet_addEthereumChain")
      ) {
        try {
          const isBscTestnet = targetChainId === 97;
          const isSepolia = targetChainId === 11155111;
          const chainParams = isBscTestnet
            ? {
                chainId: hexChainId,
                chainName: "BNB Smart Chain Testnet",
                nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
                rpcUrls: ["https://bsc-testnet-rpc.publicnode.com"],
                blockExplorerUrls: ["https://testnet.bscscan.com"],
              }
            : isSepolia
            ? {
                chainId: hexChainId,
                chainName: "Ethereum Sepolia Testnet",
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }
            : {
                chainId: hexChainId,
                chainName: "Polygon Amoy Testnet",
                nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
                rpcUrls: RPC_ENDPOINTS,
                blockExplorerUrls: [EXPLORER],
              };

          await provider.request({
            method: "wallet_addEthereumChain",
            params: [chainParams],
          });
        } catch (addError) {
          console.warn("wallet_addEthereumChain failed:", addError);
        }
      } else {
        console.warn("wallet_switchEthereumChain failed:", switchError);
      }
    }
  }

  async function signer(chain = CHAIN_ID) {
    if (!isConnected || !activeWalletProvider || !address)
      throw Error("Connect a wallet first");
    const wp = activeWalletProvider as any;
    if (wp && typeof wp.request === "function") {
      await ensureCorrectNetwork(wp, chain);
    }
    const p = new BrowserProvider(activeWalletProvider as never);
    const s = await p.getSigner();
    const currentChainId = Number((await p.getNetwork()).chainId);
    if (
      currentChainId !== chain ||
      (await s.getAddress()).toLowerCase() !== address.toLowerCase()
    ) {
      if (wp && typeof wp.request === "function") {
        await ensureCorrectNetwork(wp, chain);
      }
      const updatedChain = Number((await p.getNetwork()).chainId);
      if (updatedChain !== chain) {
        const chainName =
          chain === 97
            ? "BNB Smart Chain Testnet (Chain ID 97)"
            : chain === 11155111
            ? "Ethereum Sepolia Testnet (Chain ID 11155111)"
            : `Polygon Amoy Testnet (Chain ID ${chain})`;
        throw Error(`Please switch your wallet network to ${chainName}.`);
      }
    }
    return s;
  }



  async function transact(action: () => Promise<ContractTransactionResponse | TransactionResponse | any>) {
    setLoading(true);
    setError("");
    try {
      const tx: any = await action();
      let receipt: any = tx;
      if (tx && typeof tx.wait === "function") {
        receipt = await tx.wait();
      }
      if (!receipt || (receipt.status !== undefined && receipt.status !== 1 && receipt.status !== 1n))
        throw Error("Transaction failed on-chain");
      await refresh();
      return receipt;
    } catch (e) {
      const decoded = decodeWeb3Error(e);
      setError(decoded);
      throw new Error(decoded);
    } finally {
      setLoading(false);
    }
  }
  async function approve(
    c: Contract,
    owner: string,
    spender: string,
    amount: bigint
  ) {
    if ((await c.allowance(owner, spender)) < amount) {
      if ((await c.allowance(owner, spender)) > 0n) {
        const tx0: any = await c.approve(spender, 0);
        if (tx0 && typeof tx0.wait === "function") {
          await tx0.wait();
        }
      }
      const tx: any = await c.approve(spender, amount);
      if (tx && typeof tx.wait === "function") {
        await tx.wait();
      }
    }
  }
  const buy = (value: bigint, minimum: bigint) =>
    transact(async () => {
      if (isWalletPaused) {
        throw new Error(
          "Your wallet is currently FROZEN / PAUSED by protocol administration. Operations including purchasing new packages and buyback reward distributions are halted."
        );
      }
      const s = await signer(),
        u = new Contract(ADDRESSES.usdt, TOKEN_ABI, s);
      if ((await u.balanceOf(address)) < value) {
        try {
          const usdtMintable = new Contract(
            ADDRESSES.usdt,
            ["function mint(address to, uint256 amount)"],
            s
          );
          const mintTx: any = await usdtMintable.mint(address!, value * 2n);
          if (mintTx && typeof mintTx.wait === "function") {
            await mintTx.wait();
          }
        } catch {}
      }
      if ((await u.balanceOf(address)) < value)
        throw Error("Insufficient USDT balance. Mint or deposit USDT first.");
      await approve(u, address!, ADDRESSES.sz, value);
      const szContract = new Contract(ADDRESSES.sz, SZ_ABI, s);
      const data = szContract.interface.encodeFunctionData("purchase", [
        value,
        minimum,
        Math.floor(Date.now() / 1000) + 600,
      ]);
      let gasLimit: bigint;
      try {
        const estimated = await s.estimateGas({
          from: address,
          to: ADDRESSES.sz,
          data,
        });
        gasLimit = (estimated * 120n) / 100n;
      } catch {
        gasLimit = 750_000n;
      }
      return s.sendTransaction({
        to: ADDRESSES.sz,
        data,
        gasLimit,
      });
    });
  const admin = (method: string, args: unknown[] = [], wrapper = false) =>
    transact(async () => {
      const s = await signer();
      const allowed = [
        "pause",
        "unpause",
        "addTreasuryFunds",
        "executeAdminBuyback",
        "withdrawTreasuryFunds",
        "setLimits",
        "grantRole",
        "revokeRole",
        "closeMigration",
        "importHistoricalSale",
        "replaceWallet",
        "setWalletPaused",
        "setSecondaryWalletByAdmin",
      ];
      if (!allowed.includes(method)) throw Error("Unsupported action");
      if (method === "addTreasuryFunds") {
        const szContract = new Contract(ADDRESSES.sz, SZ_ABI, s);
        let usdtAddress = ADDRESSES.usdt;
        try {
          usdtAddress = await szContract.usdt();
        } catch {}
        const tokenContract = new Contract(usdtAddress, TOKEN_ABI, s);
        const requiredAmount = args[0] as bigint;
        const bal: bigint = await tokenContract.balanceOf(address);
        if (bal < requiredAmount) {
          throw new Error(
            `Insufficient USDT balance: your wallet holds ${(Number(bal) / 1e6).toLocaleString()} USDT, but tried to fund ${(Number(requiredAmount) / 1e6).toLocaleString()} USDT.`
          );
        }
        await approve(
          tokenContract,
          address!,
          ADDRESSES.sz,
          requiredAmount
        );
      }
      return new Contract(
        wrapper ? ADDRESSES.wrapper : ADDRESSES.sz,
        wrapper ? WRAPPER_ABI : SZ_ABI,
        s
      )[method](...args);
    });
  const offline = (sale: Sale) =>
    transact(async () => {
      const s = await signer();
      const contract = new Contract(ADDRESSES.sz, SZ_ABI, s);
      return contract.recordOfflineSale(sale);
    });
  const offlineBatch = (sales: Sale[]) =>
    transact(async () => {
      const s = await signer();
      const contract = new Contract(ADDRESSES.sz, SZ_ABI, s);
      return contract.recordOfflineSalesBatch(sales);
    });
  const deposit = (source: Source, value: bigint) =>
    transact(async () => {
      if (isWalletPaused) {
        throw new Error(
          "Your wallet is currently FROZEN / PAUSED by protocol administration. Cross-chain deposits are halted."
        );
      }
      const s = await signer(source.chainId),
        a = new Contract(source.adapter, ADAPTER_ABI, s);
      
      let token: string, scale: bigint, destination: bigint, wrapper: string, treasury: string;
      try {
        [token, scale, destination, wrapper, treasury] = await Promise.all([
          a.token(),
          a.scale(),
          a.destinationChainId(),
          a.destinationWrapper(),
          a.treasury(),
        ]);
      } catch (err: any) {
        console.error("Failed to read deposit adapter state:", err);
        throw Error(
          `Unable to interact with deposit adapter (${source.adapter}) on ${source.name || `Chain ID ${source.chainId}`}. Please make sure you select an active testnet (Ethereum Sepolia, BSC Testnet, or Polygon Amoy).`
        );
      }

      const validWrappers = [
        ADDRESSES.wrapper.toLowerCase(),
        "0x2c74e4fbc2da0dae929c7f717fc921bd81015c68",
        "0xafecba18585f6c9eb120fd89a56b53243856a4fb",
      ];
      if (
        token.toLowerCase() !== source.token.toLowerCase() ||
        Number(destination) !== CHAIN_ID ||
        (!validWrappers.includes(wrapper.toLowerCase()) && !isAddress(wrapper))
      )
        throw Error("Deposit adapter configuration mismatch");

      if (address?.toLowerCase() === treasury.toLowerCase()) {
        throw Error(
          "The connected wallet is the Protocol Treasury Wallet. Treasury wallets cannot bridge to themselves. Please switch to a user wallet account in MetaMask."
        );
      }

      const tokenContract = new Contract(token, TOKEN_ABI, s);
      const userBal: bigint = await tokenContract.balanceOf(address!);
      const needed = value * scale;
      if (userBal < needed) {
        throw Error("Insufficient USDT balance. Click 'Mint 10,000 Testnet USDT' to claim testnet collateral first.");
      }

      await approve(
        tokenContract,
        address!,
        source.adapter,
        needed
      );

      let gasLimit: bigint;
      try {
        const estimated = await a.deposit.estimateGas(value, address);
        gasLimit = (estimated * 130n) / 100n;
      } catch {
        gasLimit = 1_000_000n;
      }

      return a.deposit(value, address, { gasLimit });
    });
  const mintTestnetUsdt = (targetChainId?: number) =>
    transact(async () => {
      const s = targetChainId ? await signer(targetChainId) : await signer();
      const p = new BrowserProvider(activeWalletProvider as never);
      const network = await p.getNetwork();
      const currentChainId = Number(network.chainId);

      const targetUsdt =
        currentChainId === 97 || currentChainId === 11155111
          ? "0x890FadD44588e67e5091147392413F8c67736Ec9"
          : ADDRESSES.usdt;

      const usdtContract = new Contract(
        targetUsdt,
        ["function mint(address to, uint256 amount)"],
        s
      );
      const data = usdtContract.interface.encodeFunctionData("mint", [
        address!,
        10_000_000_000n,
      ]);
      let gasLimit: bigint;
      try {
        const estimated = await s.estimateGas({
          to: targetUsdt,
          data,
        });
        gasLimit = (estimated * 130n) / 100n;
      } catch {
        gasLimit = 300_000n;
      }
      return s.sendTransaction({
        to: targetUsdt,
        data,
        gasLimit,
      });
    });
  const switchNetwork = async (targetChainId: number = CHAIN_ID) => {
    if (!activeWalletProvider) throw Error("Wallet not connected");
    await ensureCorrectNetwork(activeWalletProvider as any, targetChainId);
  };
  return (
    <Context.Provider
      value={{
        address,
        connected: isConnected,
        stats,
        packages,
        balances,
        isAdmin,
        loading,
        error,
        secondaryWallet,
        secondaryWalletStatus,
        isSecondaryWallet,
        primaryWalletForSecondary,
        isSecondaryWalletModalOpen,
        isWalletModalOpen,
        isWalletPaused,
        walletPauseReason,
        isWalletMigrated,
        migratedToWallet,
        openSecondaryWalletModal: () => {
          if (
            isAdmin ||
            (address &&
              (address.toLowerCase() === "0x32d716c34a94010d8a8f5e8b3e29c210ed16349f" ||
                address.toLowerCase() === "0x743b5509cc84415a9e1e20951e2fd94d05e423e9")) ||
            isSecondaryWallet ||
            isWalletMigrated
          )
            return;
          setIsSecondaryWalletModalOpen(true);
        },
        closeSecondaryWalletModal: () => {
          if (address) {
            sessionStorage.setItem(
              `sz_dismiss_secondary_${address.toLowerCase()}`,
              "true"
            );
          }
          setIsSecondaryWalletModalOpen(false);
        },
        openWalletModal: () => setIsWalletModalOpen(true),
        closeWalletModal: () => setIsWalletModalOpen(false),
        connectInjected,
        openAppKitModal,
        saveSecondaryWallet,
        refreshSecondaryWallet: async () => {
          if (address) await fetchSecondaryWallet(address);
        },
        refresh,
        connect: async () => {
          // Open wallet modal so user can choose direct Browser extension or AppKit
          setIsWalletModalOpen(true);
        },
        disconnect: async () => {
          setInjectedAddress(null);
          setInjectedConnected(false);
          try {
            localStorage.removeItem("sz_injected_connected");
          } catch {}
          try {
            await appKitModal.disconnect();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Unable to disconnect wallet"
            );
          }
        },
        buy,
        admin,
        offline,
        offlineBatch,
        deposit,
        mintTestnetUsdt,
        switchNetwork,
        getSigner: signer,
        readPackages,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWeb3() {
  const v = useContext(Context);
  if (!v) throw Error("Missing Web3Provider");
  return v;
}
export function units(input: string) {
  if (!/^\d+(\.\d{1,6})?$/.test(input))
    throw Error("Enter a positive amount with at most six decimals");
  const n = parseUnits(input, 6);
  if (n <= 0n) throw Error("Amount must be positive");
  return n;
}
