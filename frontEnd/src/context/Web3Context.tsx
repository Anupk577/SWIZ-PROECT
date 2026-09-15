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
  Contract,
  isAddress,
  type ContractTransactionResponse,
  type TransactionResponse,
  type TransactionReceipt,
  parseUnits,
} from "ethers";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { appKitModal } from "../config/reown";
import {
  ADDRESSES,
  CHAIN_ID,
  RPC,
  RPC_ENDPOINTS,
  EXPLORER,
  SZ_ABI,
  WRAPPER_ABI,
  TOKEN_ABI,
  ADAPTER_ABI,
} from "../constants/contracts";
import type { Source } from "../services/api";
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
  purchasedAt: number;
  startedAt: number;
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
  deposit: (source: Source, value: bigint) => Promise<TransactionReceipt>;
  mintTestnetUsdt: (targetChainId?: number) => Promise<TransactionReceipt>;
  switchNetwork: (targetChainId?: number) => Promise<void>;
  getSigner: (chain?: number) => Promise<any>;
  readPackages: (who: string) => Promise<Package[]>;
}
const Context = createContext<State | null>(null);
const configured = Object.values(ADDRESSES).every(isAddress);
const reader = new JsonRpcProvider(RPC, CHAIN_ID, {
  staticNetwork: true,
  batchMaxCount: 1,
});
const contract = () => {
  if (!configured)
    throw Error("Contracts are not configured for this environment");
  return new Contract(ADDRESSES.sz, SZ_ABI, reader);
};
export function Web3Provider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [stats, setStats] = useState<Stats | null>(null),
    [packages, setPackages] = useState<Package[]>([]),
    [balances, setBalances] = useState<State["balances"]>(null),
    [isAdmin, setAdmin] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  const readPackages = useCallback(async (who: string) => {
    if (!isAddress(who)) throw Error("Invalid wallet");
    const c = contract();
    const ids: bigint[] = await c.getUserPackageIds(who);
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
  }, []);
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
        [ps, admin] = await Promise.all([
          readPackages(address),
          c.hasRole(await c.ADMIN_ROLE(), address),
        ]);
        const usdtMockContract = new Contract(ADDRESSES.usdt, TOKEN_ABI, reader);
        const usdtcWrapperContract = new Contract(ADDRESSES.wrapper, TOKEN_ABI, reader);
        const [sz, et, usdtMock, usdtc] = await Promise.all([
          c.balanceOf(address),
          new Contract(ADDRESSES.et, TOKEN_ABI, reader).balanceOf(address),
          usdtMockContract.balanceOf(address).catch(() => 0n),
          usdtcWrapperContract.balanceOf(address).catch(() => 0n),
        ]);
        bs = { sz, et, usdt: usdtMock + usdtc };
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
          const chainParams = isBscTestnet
            ? {
                chainId: hexChainId,
                chainName: "BNB Smart Chain Testnet",
                nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
                rpcUrls: ["https://bsc-testnet-rpc.publicnode.com"],
                blockExplorerUrls: ["https://testnet.bscscan.com"],
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
    if (!isConnected || !walletProvider || !address)
      throw Error("Connect a wallet first");
    const wp = walletProvider as any;
    if (wp && typeof wp.request === "function") {
      await ensureCorrectNetwork(wp, chain);
    }
    const p = new BrowserProvider(walletProvider as never);
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
            : `Polygon Amoy Testnet (Chain ID ${chain})`;
        throw Error(`Please switch your wallet network to ${chainName}.`);
      }
    }
    return s;
  }
  async function transact(action: () => Promise<ContractTransactionResponse | TransactionResponse>) {
    setLoading(true);
    setError("");
    try {
      const tx = await action();
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1)
        throw Error("Transaction failed on-chain");
      await refresh();
      return receipt;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      throw e;
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
      if ((await c.allowance(owner, spender)) > 0n)
        await (await c.approve(spender, 0)).wait();
      await (await c.approve(spender, amount)).wait();
    }
  }
  const buy = (value: bigint, minimum: bigint) =>
    transact(async () => {
      const s = await signer(),
        u = new Contract(ADDRESSES.usdt, TOKEN_ABI, s);
      if ((await u.balanceOf(address)) < value) {
        try {
          const usdtMintable = new Contract(
            ADDRESSES.usdt,
            ["function mint(address to, uint256 amount)"],
            s
          );
          const mintTx = await usdtMintable.mint(address!, value * 2n);
          await mintTx.wait();
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
        gasLimit = (estimated * 130n) / 100n;
      } catch {
        gasLimit = 3_000_000n;
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
      ];
      if (!allowed.includes(method)) throw Error("Unsupported action");
      if (method === "addTreasuryFunds")
        await approve(
          new Contract(ADDRESSES.wrapper, TOKEN_ABI, s),
          address!,
          ADDRESSES.sz,
          args[0] as bigint
        );
      return new Contract(
        wrapper ? ADDRESSES.wrapper : ADDRESSES.sz,
        wrapper ? WRAPPER_ABI : SZ_ABI,
        s
      )[method](...args);
    });
  const offline = (sale: Sale) =>
    transact(async () =>
      new Contract(ADDRESSES.sz, SZ_ABI, await signer()).recordOfflineSale(sale)
    );
  const deposit = (source: Source, value: bigint) =>
    transact(async () => {
      const s = await signer(source.chainId),
        a = new Contract(source.adapter, ADAPTER_ABI, s);
      const [token, scale, destination, wrapper, treasury] = await Promise.all([
        a.token(),
        a.scale(),
        a.destinationChainId(),
        a.destinationWrapper(),
        a.treasury(),
      ]);
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
      const p = new BrowserProvider(walletProvider as never);
      const network = await p.getNetwork();
      const currentChainId = Number(network.chainId);

      const targetUsdt =
        currentChainId === 97
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
    if (!walletProvider) throw Error("Wallet not connected");
    await ensureCorrectNetwork(walletProvider as any, targetChainId);
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
        refresh,
        connect: async () => {
          try {
            await appKitModal.open();
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Unable to open wallet connection"
            );
          }
        },
        disconnect: async () => {
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
