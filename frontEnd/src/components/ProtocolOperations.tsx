import { useEffect, useState, useRef, useMemo, type FormEvent, type ReactNode } from "react";
import { formatUnits, id as hashId, JsonRpcProvider, Interface, zeroPadValue, Contract, isAddress, getAddress, type TransactionReceipt } from "ethers";
import {
  useWeb3,
  units,
  decodeWeb3Error,
  type Package,
  type Sale,
} from "../context/Web3Context";
import {
  api,
  type Activity,
  type Deposit,
  type PublicConfig,
} from "../services/api";
import { ADDRESSES, CHAIN_ID, EXPLORER, ADAPTER_ABI, WRAPPER_ABI, SZ_ABI, RPC } from "../constants/contracts";
import { AdminWalletReplacementSection } from "./AdminWalletReplacementSection";
import {
  Coins,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Play,
} from "lucide-react";
const amount = (n: bigint | string | undefined) =>
  n === undefined ? "—" : formatUnits(n, 6);
const date = (t: bigint | number) =>
  new Date(Number(t) * 1000).toLocaleString();
function Tx({
  hash,
  explorer = EXPLORER,
}: {
  hash: string;
  explorer?: string | null;
}) {
  if (!hash) return <span className="text-[var(--mid)] font-mono text-xs">On-Chain</span>;
  if (!explorer) return <span className="font-mono text-xs">{hash.slice(0, 10)}…</span>;
  return (
    <a href={`${explorer}/tx/${hash}`} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs">
      {hash.slice(0, 10)}…
    </a>
  );
}
export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="lumix-card rounded-2xl p-6 shadow-sm space-y-4 border border-[var(--border)]">
      <h2 className="font-cond font-bold text-lg uppercase tracking-wider text-[var(--ink)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <span className="w-1.5 h-4 bg-[#8B1A1A] rounded-full inline-block"></span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}
function Field({
  label,
  name,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-cond font-bold text-[var(--ink)] uppercase tracking-wider">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={value}
        required
        className="w-full bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-[var(--ink)] text-base font-mono focus:border-[#8B1A1A] focus:outline-none transition-colors"
      />
    </div>
  );
}
function DateTimePickerField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [val, setVal] = useState<string>(defaultValue || "");

  const handleOpenPicker = () => {
    if (inputRef.current) {
      if ("showPicker" in inputRef.current && typeof (inputRef.current as any).showPicker === "function") {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  const handleSetNow = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setVal(localISOTime);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-cond font-bold text-[var(--mid)] uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={handleSetNow}
          className="text-[11px] font-cond font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>⚡ Now</span>
        </button>
      </div>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          name={name}
          type="datetime-local"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          required
          className="w-full bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl pl-4 pr-11 py-3 text-[var(--ink)] text-sm focus:border-[#8B1A1A] focus:outline-none transition-colors cursor-pointer"
        />
        <button
          type="button"
          onClick={handleOpenPicker}
          className="absolute right-3 p-1.5 text-[var(--mid)] hover:text-[var(--ink)] bg-[var(--bg-card)] rounded-lg transition-colors flex items-center justify-center text-sm cursor-pointer"
          title="Open Calendar & Clock Selector"
        >
          📅
        </button>
      </div>
    </div>
  );
}

export function ActionForm({
  title,
  id,
  children,
  submit,
  disabled = false,
  transactionExplorer,
}: {
  title: string;
  id?: string;
  children: ReactNode;
  submit: (f: FormData) => Promise<TransactionReceipt>;
  disabled?: boolean;
  transactionExplorer?: (f: FormData) => string | undefined;
}) {
  const { loading, connected } = useWeb3();
  const [error, setError] = useState(""),
    [tx, setTx] = useState(""),
    [txExplorer, setTxExplorer] = useState<string | null>(EXPLORER);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setTx("");
    try {
      const data = new FormData(e.currentTarget);
      setTxExplorer(
        transactionExplorer ? transactionExplorer(data) ?? null : EXPLORER
      );
      const r = await submit(data);
      setTx(r.hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    }
  }
  return (
    <form id={id} className="lumix-card rounded-2xl p-6 shadow-sm space-y-5 border border-[var(--border)]" onSubmit={onSubmit}>
      <h2 className="font-cond font-bold text-lg uppercase tracking-wider text-[var(--ink)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <span className="w-1.5 h-4 bg-[#8B1A1A] rounded-full inline-block"></span>
        <span>{title}</span>
      </h2>
      <div className="space-y-4 text-[var(--mid)] text-xs sm:text-sm font-body">
        {children}
      </div>
      <button
        disabled={loading || !connected || disabled}
        className="btn btn-red w-full py-4 px-6 rounded-xl text-sm sm:text-base font-bold shadow-md transition-all flex items-center justify-center gap-2"
      >
        {loading ? "Awaiting transaction…" : title}
      </button>
      {error && (
        <p role="alert" className="p-4 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-500/40 rounded-xl text-red-950 dark:text-red-200 text-sm font-semibold break-words">
          {error}
        </p>
      )}
      {tx && (
        <p role="status" className="p-4 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-500/40 rounded-xl text-emerald-950 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2 break-words">
          <span>Confirmed:</span>
          <Tx hash={tx} explorer={txExplorer} />
        </p>
      )}
    </form>
  );
}
function PackageTable({ packages }: { packages: Package[] }) {
  return (
    <>
      {!packages.length && <p>No packages found for this wallet.</p>}
      {packages.map((p) => (
        <details className="panel" key={p.id.toString()}>
          <summary>
            Package #{p.id.toString()} · {amount(p.amount)} SZ ·{" "}
            {p.boughtBack === p.amount ? "Completed" : "Active"}
          </summary>
          <dl>
            <dt>Owner</dt>
            <dd>{p.owner}</dd>
            <dt>Purchase price / value</dt>
            <dd>
              ${amount(p.originalPrice)} / ${amount(p.purchaseValue)}
            </dd>
            <dt>Purchased / staking start</dt>
            <dd>
              {date(p.purchaseTimestamp)} / {date(p.startTimestamp)}
            </dd>
            <dt>Remaining in custody</dt>
            <dd>{amount(p.amount - p.boughtBack)} SZ</dd>
            <dt>Bought back</dt>
            <dd>{amount(p.boughtBack)} SZ</dd>
            <dt>USDT.c / ET received</dt>
            <dd>
              {amount(p.usdtReceived)} / {amount(p.etReceived)}
            </dd>
            <dt>Source</dt>
            <dd>{p.isOffline ? "Recorded offline sale" : "Online purchase"}</dd>
          </dl>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Eligible at</th>
                  <th>SZ quantity</th>
                  <th>Bought back</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {p.schedule.map((s, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{date(s.unlockTimestamp)}</td>
                    <td>{amount(s.quantity)}</td>
                    <td>{amount(s.boughtBack)}</td>
                    <td>
                      {
                        ["Locked", "Eligible for buyback", "Bought back"][
                          s.status
                        ]
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </>
  );
}
function getEventBadge(item: Activity) {
  switch (item.type) {
    case "WalletPaused":
    case "PrimaryWalletPaused":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
          Primary Frozen
        </span>
      );
    case "SecondaryWalletPaused":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
          Secondary Frozen
        </span>
      );
    case "WalletUnpaused":
    case "PrimaryWalletUnpaused":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Primary Restored
        </span>
      );
    case "SecondaryWalletUnpaused":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Secondary Restored
        </span>
      );
    case "WalletReplaced":
    case "SecondaryWalletReplaced":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          Wallet Replaced
        </span>
      );
    case "SecondaryWalletConfigured":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Secondary Configured
        </span>
      );
    case "SecondaryWalletUpdated":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          Secondary Updated
        </span>
      );
    case "PackageCreated":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
          Package Created
        </span>
      );
    case "BuybackExecuted":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          Buyback Executed
        </span>
      );
    case "DepositMinted":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
          Bridge Minted
        </span>
      );
    case "Deposited":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          Bridge Deposited
        </span>
      );
    case "OfflineRecorded":
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
          Offline Recorded
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-500/15 text-[var(--ink)] border border-[var(--border)]">
          {item.type}
        </span>
      );
  }
}

function getEventDetails(item: Activity) {
  if (item.type.includes("Paused")) {
    return item.reason ? (
      <span className="text-[var(--mid)] text-xs">{item.reason}</span>
    ) : (
      <span className="text-red-600 dark:text-red-400 text-xs font-semibold">Emergency Freeze</span>
    );
  }
  if (item.type.includes("Unpaused")) {
    return <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Wallet Restored to Active</span>;
  }
  if (item.type.includes("Replaced")) {
    if (item.newWallet || item.oldWallet) {
      return (
        <span className="text-xs font-mono text-[var(--ink)]">
          {item.oldWallet ? `${item.oldWallet.slice(0, 6)}...` : ""} →{" "}
          {item.newWallet ? `${item.newWallet.slice(0, 6)}...` : ""}
        </span>
      );
    }
    return <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Replacement Complete</span>;
  }
  if (item.type === "SecondaryWalletConfigured" || item.type === "SecondaryWalletUpdated") {
    const sec = item.secondaryWallet || item.newSecondaryWallet;
    return sec ? (
      <span className="text-xs font-mono text-purple-600 dark:text-purple-300">
        Backup: {sec.slice(0, 6)}...{sec.slice(-4)}
      </span>
    ) : (
      <span className="text-xs text-purple-600 dark:text-purple-300">Backup Wallet</span>
    );
  }
  if (item.type === "BuybackExecuted") {
    return (
      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
        Pkg #{item.packageId} • {item.quantity} SZ Claimed
      </span>
    );
  }
  if (item.type === "DepositMinted" || item.type === "Deposited") {
    return (
      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
        {item.usdtAmount ? `${item.usdtAmount} USDT` : "Bridge Transfer"}
      </span>
    );
  }
  if (item.packageId) {
    return (
      <span className="text-xs font-mono text-[var(--ink)]">
        <strong className="text-indigo-600 dark:text-indigo-300">Pkg #{item.packageId}</strong>
        {item.quantity ? ` • ${item.quantity} SZ` : ""}
        {item.usdtAmount ? <span className="text-[var(--mid)]"> (${item.usdtAmount})</span> : ""}
      </span>
    );
  }
  if (item.type === "OfflineRecorded") {
    return (
      <span className="text-xs font-mono text-[var(--ink)]">
        {item.quantity ? `${item.quantity} SZ` : "Offline Allocation"}
        {item.usdtAmount ? <span className="text-[var(--mid)]"> (${item.usdtAmount})</span> : ""}
      </span>
    );
  }
  return <span className="text-gray-500">—</span>;
}

function getDerivedActivities(
  userAddress: string | null | undefined,
  pkgs: Package[] = [],
  secWallet: string | null = null,
  all: boolean = false
): Activity[] {
  const activities: Activity[] = [];
  const normalizedUser = userAddress?.toLowerCase();

  // 1. From On-Chain Staking Packages
  if (Array.isArray(pkgs)) {
    for (const p of pkgs) {
      if (!p) continue;
      const pkgTime = Number(p.purchaseTimestamp || p.startTimestamp || 0) * 1000 || Date.now();
      const qty = p.amount !== undefined ? formatUnits(p.amount, 6) : undefined;
      const usdt = p.purchaseValue !== undefined ? formatUnits(p.purchaseValue, 6) : undefined;

      activities.push({
        id: `pkg-${p.id}`,
        txHash: "",
        type: "PackageCreated",
        timestamp: pkgTime,
        packageId: String(p.id),
        quantity: qty,
        usdtAmount: usdt,
        status: "CONFIRMED",
        user: p.owner || userAddress || "",
      });

      // Buybacks from schedule
      if (Array.isArray(p.schedule)) {
        p.schedule.forEach((tranche, idx) => {
          if (tranche && tranche.boughtBack && tranche.boughtBack > 0n) {
            activities.push({
              id: `bb-${p.id}-${idx}`,
              txHash: "",
              type: "BuybackExecuted",
              timestamp: Number(tranche.unlockTimestamp || 0) * 1000 || pkgTime,
              packageId: String(p.id),
              quantity: formatUnits(tranche.boughtBack, 6),
              status: "CONFIRMED",
              user: p.owner || userAddress || "",
            });
          }
        });
      }
    }
  }

  // 2. From Local Bridge Deposits
  const deposits = getLocalDeposits(all ? undefined : userAddress || undefined);
  for (const d of deposits) {
    if (!d) continue;
    activities.push({
      id: `dep-${d.id || d.sourceTx}`,
      txHash: d.mintTx || d.sourceTx || "",
      type: d.mintTx ? "DepositMinted" : "Deposited",
      timestamp: Date.now() - 1000 * 60 * 10,
      usdtAmount: d.amount,
      status: d.state || "CONFIRMED",
      user: d.recipient,
    });
  }

  // 3. From Local Offline Sales
  const offlineSales = getLocalOfflineSales();
  for (const s of offlineSales) {
    if (!s) continue;
    const buyer = s.buyer || "";
    if (all || !normalizedUser || buyer.toLowerCase() === normalizedUser) {
      activities.push({
        id: `offline-${s.id || s.reference || s.txHash}`,
        txHash: s.txHash || "",
        type: "OfflineRecorded",
        timestamp: s.timestamp ? (s.timestamp < 1e11 ? s.timestamp * 1000 : s.timestamp) : Date.now(),
        quantity: s.amount ? String(s.amount) : undefined,
        usdtAmount: s.valueUsd ? String(s.valueUsd) : undefined,
        status: "CONFIRMED",
        user: buyer,
      });
    }
  }

  // 4. From Secondary Wallet Configuration
  if (secWallet && userAddress) {
    activities.push({
      id: `sec-${userAddress}-${secWallet}`,
      txHash: "",
      type: "SecondaryWalletConfigured",
      timestamp: Date.now() - 1000 * 60 * 60,
      secondaryWallet: secWallet,
      primaryWallet: userAddress,
      status: "CONFIRMED",
      user: userAddress,
    });
  }

  // 5. From Local Security and Admin Activities
  try {
    const rawSec = localStorage.getItem("sz_admin_security_activities");
    if (rawSec) {
      const parsedSec = JSON.parse(rawSec);
      if (Array.isArray(parsedSec)) {
        for (const item of parsedSec) {
          if (!item) continue;
          const pw = (item.primaryWallet || item.wallet || "").toLowerCase();
          const sw = (item.secondaryWallet || "").toLowerCase();
          if (all || !normalizedUser || pw === normalizedUser || sw === normalizedUser) {
            activities.push({
              id: item.id || `sec-${item.type}-${item.timestamp}`,
              txHash: item.txHash || "",
              type: item.type,
              timestamp: item.timestamp || Date.now(),
              primaryWallet: item.primaryWallet || item.wallet,
              secondaryWallet: item.secondaryWallet,
              status: "CONFIRMED",
              reason: item.reason,
              user: item.primaryWallet || item.wallet,
            });
          }
        }
      }
    }
  } catch {}

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

export function History({ all = false }: { all?: boolean }) {
  const { address, packages, secondaryWallet } = useWeb3();
  const [items, setItems] = useState<Activity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");

    // 1. Immediately synthesize on-chain & verified client activities
    const derived = getDerivedActivities(address, packages, secondaryWallet, all);
    if (derived.length > 0) {
      setItems(derived);
    }

    const load = () =>
      api<{ transactions: Activity[] }>(
        all ? "/events" : `/transactions/${address}`
      )
        .then((r) => {
          if (!alive) return;
          const map = new Map<string, Activity>();
          // Put derived items first
          for (const d of derived) {
            const key = d.txHash ? d.txHash.toLowerCase() : d.id;
            map.set(key, d);
          }
          // Merge API items
          for (const item of r.transactions || []) {
            const key = item.txHash ? item.txHash.toLowerCase() : item.id;
            map.set(key, item);
          }
          const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
          setItems(merged);
          setError("");
        })
        .catch(() => {
          if (!alive) return;
          if (derived.length === 0 && all) {
            setError("Confirmed history is unavailable. Retry shortly.");
          }
        });

    if (all || address) void load();
    const timer = setInterval(() => {
      if (all || address) void load();
    }, 15000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address, all, packages, secondaryWallet]);
  return (
    <Panel title="Confirmed event history">
      <p>Events appear after the configured confirmation threshold.</p>
      {error ? (
        <p role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-200 text-xs font-semibold">{error}</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Details / Package</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{new Date(i.timestamp).toLocaleString()}</td>
                  <td>{getEventBadge(i)}</td>
                  <td>{getEventDetails(i)}</td>
                  <td>
                    <Tx hash={i.txHash} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p>No confirmed events indexed yet.</p>}
        </div>
      )}
    </Panel>
  );
}
function getLocalDeposits(userAddress?: string): Deposit[] {
  try {
    const raw = localStorage.getItem("sz_bridge_deposits");
    if (!raw) return [];
    const parsed: Deposit[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (userAddress) {
      return parsed.filter(
        (d) => d.recipient?.toLowerCase() === userAddress.toLowerCase()
      );
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalDeposit(dep: Deposit) {
  try {
    const existing = getLocalDeposits();
    const filtered = existing.filter((d) => d.sourceTx?.toLowerCase() !== dep.sourceTx?.toLowerCase());
    const updated = [dep, ...filtered];
    localStorage.setItem("sz_bridge_deposits", JSON.stringify(updated.slice(0, 50)));
  } catch {}
}

async function fetchOnChainDeposits(userAddress?: string): Promise<{ onChainDeposits: Deposit[]; mintedBySourceTx: Map<string, { mintTx: string }> }> {
  try {
    const amoyProvider = new JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com", CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
    const adapterIface = new Interface(ADAPTER_ABI);
    const wrapperIface = new Interface(WRAPPER_ABI);

    const currentBlock = await amoyProvider.getBlockNumber().catch(() => 46774000);
    const fromBlock = Math.max(0, currentBlock - 8000);

    const adapterTopic0 = hashId("Deposited(uint256,address,address,uint256,uint256)");
    const wrapperTopic0 = hashId("DepositMinted(bytes32,address,uint256,uint256,address,uint256,bytes32)");
    const paddedUser = userAddress && userAddress.length === 42 ? zeroPadValue(userAddress, 32) : null;

    const wrapperLogs = await amoyProvider.getLogs({
      address: ADDRESSES.wrapper,
      topics: [wrapperTopic0, null, paddedUser],
      fromBlock,
      toBlock: "latest",
    }).catch(() => []);

    const mintedBySourceTx = new Map<string, { mintTx: string }>();
    for (const log of wrapperLogs) {
      try {
        const parsed = wrapperIface.parseLog(log);
        if (parsed && parsed.args.sourceTxHash) {
          mintedBySourceTx.set(parsed.args.sourceTxHash.toLowerCase(), {
            mintTx: log.transactionHash,
          });
        }
      } catch {}
    }

    const onChainDeposits: Deposit[] = [];

    const querySource = async (rpcUrl: string, chainId: number, adapterAddress: string) => {
      try {
        const srcProvider = new JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true, batchMaxCount: 1 });
        const head = await srcProvider.getBlockNumber().catch(() => 0);
        if (!head) return;
        const srcFrom = Math.max(0, head - 8000);
        const logs = await srcProvider.getLogs({
          address: adapterAddress,
          topics: [adapterTopic0, null, null, paddedUser],
          fromBlock: srcFrom,
          toBlock: "latest",
        }).catch(() => []);

        for (const log of logs) {
          try {
            const parsed = adapterIface.parseLog(log);
            if (parsed) {
              const mintInfo = mintedBySourceTx.get(log.transactionHash.toLowerCase());
              onChainDeposits.push({
                id: log.transactionHash,
                source: chainId,
                recipient: parsed.args.recipient,
                amount: parsed.args.amount6.toString(),
                sourceTx: log.transactionHash,
                mintTx: mintInfo?.mintTx,
                state: mintInfo ? "completed" : "finalized",
              });
            }
          } catch {}
        }
      } catch (err) {
        console.warn(`Could not query logs for chain ${chainId}:`, err);
      }
    };

    await Promise.allSettled([
      querySource("https://polygon-amoy-bor-rpc.publicnode.com", 80002, ADDRESSES.adapter),
      querySource("https://ethereum-sepolia-rpc.publicnode.com", 11155111, "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F"),
      querySource("https://bsc-testnet-rpc.publicnode.com", 97, "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F"),
    ]);

    return { onChainDeposits: onChainDeposits.reverse(), mintedBySourceTx };
  } catch (e) {
    console.warn("Unable to fetch on-chain deposit logs:", e);
    return { onChainDeposits: [], mintedBySourceTx: new Map() };
  }
}

function mergeDeposits(
  local: Deposit[],
  remote: Deposit[],
  onChain: Deposit[] = [],
  mintedBySourceTx: Map<string, { mintTx: string }> = new Map()
): Deposit[] {
  const map = new Map<string, Deposit>();

  for (const d of local) {
    if (d.sourceTx) {
      const mintInfo = mintedBySourceTx.get(d.sourceTx.toLowerCase());
      const updatedState = mintInfo ? "completed" : d.state;
      const updatedMintTx = mintInfo ? mintInfo.mintTx : d.mintTx;
      const updatedDep = { ...d, state: updatedState, mintTx: updatedMintTx };
      map.set(d.sourceTx.toLowerCase(), updatedDep);
      if (mintInfo && d.state !== "completed") {
        saveLocalDeposit(updatedDep);
      }
    }
  }

  for (const d of onChain) {
    if (d.sourceTx) {
      const existing = map.get(d.sourceTx.toLowerCase());
      map.set(d.sourceTx.toLowerCase(), { ...existing, ...d });
    }
  }

  for (const d of remote) {
    if (d.sourceTx) {
      const existing = map.get(d.sourceTx.toLowerCase());
      const mintInfo = mintedBySourceTx.get(d.sourceTx.toLowerCase());
      const updatedState = mintInfo ? "completed" : (d.state || existing?.state || "pending (awaiting relayer)");
      const updatedMintTx = mintInfo ? mintInfo.mintTx : (d.mintTx || existing?.mintTx);
      map.set(d.sourceTx.toLowerCase(), { ...existing, ...d, state: updatedState, mintTx: updatedMintTx });
    }
  }

  return Array.from(map.values());
}

export interface OfflineSaleRecord {
  id: string;
  txHash: string;
  buyer: string;
  amount: string;
  valueUsd: string;
  priceUsd: string;
  purchasedAt: string;
  startedAt: string;
  reference: string;
  timestamp: number;
}

export function getLocalOfflineSales(): OfflineSaleRecord[] {
  try {
    const raw = localStorage.getItem("sz_offline_sales_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalOfflineSale(rec: OfflineSaleRecord) {
  try {
    const existing = getLocalOfflineSales();
    const filtered = existing.filter(
      (r) =>
        r.txHash?.toLowerCase() !== rec.txHash?.toLowerCase() &&
        r.reference?.toLowerCase() !== rec.reference?.toLowerCase()
    );
    const updated = [rec, ...filtered];
    localStorage.setItem("sz_offline_sales_history", JSON.stringify(updated.slice(0, 100)));
  } catch {}
}

function mergeOfflineSales(...lists: OfflineSaleRecord[][]): OfflineSaleRecord[] {
  const map = new Map<string, OfflineSaleRecord>();
  for (const list of lists) {
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && (item.txHash || item.id || item.reference)) {
          const key = (item.txHash || item.reference || item.id).toLowerCase();
          if (!map.has(key) || (item.timestamp && item.timestamp > (map.get(key)?.timestamp || 0))) {
            map.set(key, item);
          }
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

async function fetchOnChainOfflineSales(): Promise<OfflineSaleRecord[]> {
  try {
    const provider = new JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com", CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
    const szContract = new Contract(
      ADDRESSES.sz,
      [
        "function nextPackageId() view returns (uint256)",
        "function packages(uint256) view returns (tuple(uint256 id, address owner, uint256 amount, uint256 originalPrice, uint256 startTimestamp, bool isOffline, uint256 etReceived, uint256 purchaseValue, uint256 purchaseTimestamp, uint256 boughtBack, uint256 usdtReceived, bytes32 paymentReference))",
      ],
      provider
    );

    const nextId: bigint = await szContract.nextPackageId().catch(() => 1n);
    const total = Number(nextId) - 1;
    if (total <= 0) return [];

    const ids = Array.from({ length: total }, (_, i) => BigInt(i + 1));
    const allPackages = await Promise.all(ids.map((id) => szContract.packages(id).catch(() => null)));

    const localList = getLocalOfflineSales();

    const records: OfflineSaleRecord[] = [];
    for (const pkg of allPackages) {
      if (pkg && pkg.isOffline && pkg.owner && pkg.owner !== "0x0000000000000000000000000000000000000000") {
        const pkgIdStr = pkg.id.toString();
        const refBytes32 = pkg.paymentReference ? pkg.paymentReference.toString() : "";
        const refDisplay = (refBytes32 && refBytes32 !== "0x0000000000000000000000000000000000000000000000000000000000000000")
          ? `${refBytes32.slice(0, 10)}...${refBytes32.slice(-6)}`
          : `Package #${pkgIdStr}`;

        const localMatch = localList.find(
          (l) =>
            l.amount === pkg.amount.toString() &&
            l.buyer.toLowerCase() === pkg.owner.toLowerCase()
        );

        records.push({
          id: pkgIdStr,
          txHash: localMatch?.txHash || "",
          buyer: pkg.owner,
          amount: pkg.amount.toString(),
          valueUsd: pkg.purchaseValue ? pkg.purchaseValue.toString() : pkg.amount.toString(),
          priceUsd: pkg.originalPrice ? pkg.originalPrice.toString() : "1000000",
          purchasedAt: new Date(Number(pkg.purchaseTimestamp) * 1000).toLocaleString(),
          startedAt: new Date(Number(pkg.startTimestamp) * 1000).toLocaleString(),
          reference: localMatch?.reference || refDisplay,
          timestamp: Number(pkg.purchaseTimestamp) * 1000,
        });
      }
    }

    return records.reverse();
  } catch (e) {
    console.warn("Unable to fetch on-chain offline sales:", e);
    return [];
  }
}

export function BridgePanel({ all = false }: { all?: boolean }) {
  const { address, deposit, getSigner, refresh, mintTestnetUsdt } = useWeb3();
  const [config, setConfig] = useState<PublicConfig | null>(null),
    [deposits, setDeposits] = useState<Deposit[]>(() => getLocalDeposits(all ? undefined : address)),
    [error, setError] = useState(""),
    [claimingId, setClaimingId] = useState<string | null>(null),
    [claimMsg, setClaimMsg] = useState<string>("");

  const handleClaimDeposit = async (d: Deposit) => {
    setClaimingId(d.id);
    setClaimMsg("Requesting wallet network switch to Polygon Amoy (Chain ID 80002)...");
    try {
      // 1. Force network switch to Polygon Amoy 80002 on the USER'S wallet
      const userSigner = await getSigner(CHAIN_ID);
      const userAddr = await userSigner.getAddress();
      
      // Fetch deposit proof nonce directly and prompt for on-chain transaction
      setClaimMsg("Fetching deposit proof nonce from source chain...");

      const adapter = (d.source === 97 || d.source === 11155111) 
        ? "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F" 
        : ADDRESSES.adapter;

      let nonce = 1n;
      try {
        const srcRpc = d.source === 97 
          ? "https://bsc-testnet-rpc.publicnode.com" 
          : d.source === 11155111
          ? "https://ethereum-sepolia-rpc.publicnode.com"
          : "https://polygon-amoy-bor-rpc.publicnode.com";
        const srcProvider = new JsonRpcProvider(srcRpc, d.source, { staticNetwork: true, batchMaxCount: 1 });
        const srcReceipt = await srcProvider.getTransactionReceipt(d.sourceTx);
        if (srcReceipt && srcReceipt.logs) {
          const adapterIface = new Interface(ADAPTER_ABI);
          for (const l of srcReceipt.logs) {
            try {
              const parsed = adapterIface.parseLog(l);
              if (parsed && parsed.args.nonce !== undefined) {
                nonce = BigInt(parsed.args.nonce.toString());
                break;
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Unable to parse exact nonce from receipt, using default", err);
      }

      // 2. Direct user wallet minting on open wrapper
      const wrapper = new Contract(ADDRESSES.wrapper, WRAPPER_ABI, userSigner);

      // Check if already processed
      try {
        const depId = await wrapper.depositId(BigInt(d.source), adapter, nonce);
        const isProcessed = await wrapper.isDepositProcessed(depId);
        if (isProcessed) {
          const updatedDep: Deposit = {
            ...d,
            state: "completed",
          };
          saveLocalDeposit(updatedDep);
          setDeposits((prev) => mergeDeposits([updatedDep], prev));
          await refresh();
          setClaimMsg("✓ Deposit is already minted and credited to your wallet on Polygon Amoy.");
          return;
        }
      } catch (checkErr) {
        console.warn("Could not check depositId status:", checkErr);
      }

      setClaimMsg("Submitting mint & transfer through your wallet on Polygon Amoy (Please confirm transaction in your wallet)...");

      let gasLimit: bigint;
      try {
        const estimated = await wrapper.mintDeposit.estimateGas(
          userAddr || d.recipient || address,
          d.amount,
          BigInt(d.source),
          adapter,
          nonce,
          d.sourceTx
        );
        gasLimit = (estimated * 130n) / 100n;
      } catch {
        gasLimit = 350_000n;
      }

      const tx = await wrapper.mintDeposit(
        userAddr || d.recipient || address,
        d.amount,
        BigInt(d.source),
        adapter,
        nonce,
        d.sourceTx,
        { gasLimit }
      );
      let receipt: any = tx;
      if (tx && typeof tx.wait === "function") {
        receipt = await tx.wait();
      }
      const mintTx = receipt?.hash || tx?.hash || (typeof tx === "string" ? tx : "");

      const updatedDep: Deposit = {
        ...d,
        state: "completed",
        mintTx: mintTx,
      };
      saveLocalDeposit(updatedDep);
      setDeposits((prev) => mergeDeposits([updatedDep], prev));
      await refresh();
      setClaimMsg("✓ Verified & Signed by Wallet! 1:1 USDT.c minted and transferred to your wallet on Polygon Amoy.");
    } catch (e: any) {
      console.error("Claim error:", e);
      let errMsg = e?.message || "Wallet switch or signature request cancelled";
      if (typeof e?.data === "string" && e.data.startsWith("0xe2517d3f")) {
        errMsg = "Access error on wrapper. Please ensure you are connected to Polygon Amoy.";
      }
      setClaimMsg(`Notice: ${errMsg}`);
    } finally {
      setClaimingId(null);
    }
  };

  useEffect(() => {
    let alive = true;
    setDeposits(getLocalDeposits(all ? undefined : address));
    setConfig(null);
    setError("");
    async function load() {
      const amoyDefaultConfig: PublicConfig = {
        chainId: CHAIN_ID,
        sz: ADDRESSES.sz,
        et: ADDRESSES.et,
        wrapper: ADDRESSES.wrapper,
        sources: [
          {
            chainId: 11155111,
            name: "Ethereum Sepolia Testnet (11155111)",
            adapter: "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F",
            token: "0x890FadD44588e67e5091147392413F8c67736Ec9",
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: "https://sepolia.etherscan.io",
          },
          {
            chainId: 97,
            name: "BNB Smart Chain (BSC) Testnet (97)",
            adapter: "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F",
            token: "0x890FadD44588e67e5091147392413F8c67736Ec9",
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: "https://testnet.bscscan.com",
          },
          {
            chainId: 80002,
            name: "Polygon Amoy Testnet (80002)",
            adapter: ADDRESSES.adapter,
            token: ADDRESSES.usdt,
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: EXPLORER,
          },
        ],
      };

      try {
        const [c, d, onChainRes] = await Promise.all([
          api<PublicConfig>("/config").catch(() => null),
          all || address
            ? api<{ deposits: Deposit[] }>(
                `/deposits${!all && address ? "?user=" + address : ""}`
              ).catch(() => ({ deposits: [] }))
            : Promise.resolve({ deposits: [] }),
          fetchOnChainDeposits(address ? address : undefined),
        ]);

        let rawConfig = (c && Array.isArray(c.sources) && c.sources.length > 0) ? c : amoyDefaultConfig;
        
        // Sanitize sources to ensure active deployed adapter addresses are always enforced
        const sanitizedSources = rawConfig.sources.map((src) => {
          if (src.chainId === 11155111 || src.chainId === 97) {
            return {
              ...src,
              adapter: "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F",
              token: "0x890FadD44588e67e5091147392413F8c67736Ec9",
            };
          }
          if (src.chainId === 80002) {
            return {
              ...src,
              adapter: ADDRESSES.adapter,
              token: ADDRESSES.usdt,
            };
          }
          return src;
        });

        const activeConfig: PublicConfig = {
          ...rawConfig,
          sources: sanitizedSources,
        };
        const remoteDeposits = d && Array.isArray(d.deposits) ? d.deposits : [];
        const currentLocal = getLocalDeposits(all ? undefined : address);
        const merged = mergeDeposits(currentLocal, remoteDeposits, onChainRes.onChainDeposits, onChainRes.mintedBySourceTx);

        if (alive) {
          setConfig(activeConfig);
          setDeposits(merged);
          setError("");
        }
      } catch (e) {
        if (alive) {
          setConfig(amoyDefaultConfig);
          const currentLocal = getLocalDeposits(all ? undefined : address);
          setDeposits(currentLocal);
          setError("");
        }
      }
    }
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address, all]);
  return (
    <div className="space-y-8">
      <ActionForm
        title="Bridge Source USDT (Automated 3-Step Wallet Flow)"
        id="deposit-source-usdt"
        disabled={!config?.sources.length || !!error}
        transactionExplorer={(f) =>
          config?.sources.find((s) => s.chainId === Number(f.get("chain")))
            ?.explorer
        }
        submit={async (f) => {
          const chainId = Number(f.get("chain"));
          const source = config?.sources.find(
            (s) => s.chainId === chainId
          );
          if (!source) throw Error("Select a configured source network");
          const amtStr = String(f.get("amount"));
          
          setClaimMsg("Step 1 & 2: Approving & Depositing USDT on source network...");
          const receipt = await deposit(source, units(amtStr));
          
          if (receipt?.hash) {
            const newDep: Deposit = {
              id: receipt.hash,
              source: chainId,
              recipient: address || "",
              amount: units(amtStr).toString(),
              sourceTx: receipt.hash,
              state: "pending (ready to mint)",
            };
            saveLocalDeposit(newDep);
            setDeposits((prev) => mergeDeposits([newDep], prev));
            
            // Step 3: Automatically switch network to Polygon Amoy (80002) and execute destination mint/transfer to user wallet
            setClaimMsg("Step 3: Switching wallet to Polygon Amoy (80002) to sign & mint USDT.c...");
            await handleClaimDeposit(newDep);
          }
          return receipt;
        }}
      >
        <div className="p-4 bg-[#8B1A1A]/10 border border-[#8B1A1A]/20 rounded-xl text-xs leading-relaxed space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-extrabold text-[var(--ink)] uppercase tracking-wider text-sm">
              Direct Wallet Bridging Flow (USDT ➔ USDT.c)
            </p>
            <span className="px-3 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-extrabold uppercase">
              1:1 Instant Wallet Mint
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] space-y-1.5 shadow-sm">
              <span className="font-bold text-[#8B1A1A] dark:text-red-400 block font-cond text-sm uppercase tracking-wider">1. Wallet Approve</span>
              <p className="text-[var(--mid)] font-body font-medium leading-relaxed">Approve USDT allowance in your connected wallet on source network.</p>
            </div>
            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] space-y-1.5 shadow-sm">
              <span className="font-bold text-[#8B1A1A] dark:text-red-400 block font-cond text-sm uppercase tracking-wider">2. Wallet Deposit</span>
              <p className="text-[var(--mid)] font-body font-medium leading-relaxed">Deposit USDT into source bridge adapter through your wallet.</p>
            </div>
            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] space-y-1.5 shadow-sm">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block font-cond text-sm uppercase tracking-wider">3. Wallet Sign & Mint</span>
              <p className="text-[var(--mid)] font-body font-medium leading-relaxed">Wallet switches to Polygon Amoy (80002) to sign & mint 1:1 USDT.c directly.</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
              💧 Testnet Collateral & Gas Token Faucets
            </span>
            <span className="text-xs text-[var(--mid)] font-mono font-medium hidden sm:inline">Sepolia (11155111) · BSC (97) · Amoy (80002)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={async () => {
                setClaimMsg("Requesting wallet to mint 10,000 Sepolia USDT...");
                try {
                  await mintTestnetUsdt(11155111);
                  setClaimMsg("✓ Minted 10,000 Sepolia USDT successfully!");
                } catch (e: any) {
                  setClaimMsg(`Notice: ${e?.message || "Minting failed"}`);
                }
              }}
              className="px-3.5 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-200 dark:border-blue-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
            >
              ⚡ Mint 10k Sepolia USDT
            </button>

            <button
              type="button"
              onClick={async () => {
                setClaimMsg("Requesting wallet to mint 10,000 BSC Testnet USDT...");
                try {
                  await mintTestnetUsdt(97);
                  setClaimMsg("✓ Minted 10,000 BSC Testnet USDT successfully!");
                } catch (e: any) {
                  setClaimMsg(`Notice: ${e?.message || "Minting failed"}`);
                }
              }}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
            >
              ⚡ Mint 10k BSC USDT
            </button>

            <button
              type="button"
              onClick={async () => {
                setClaimMsg("Requesting wallet to mint 10,000 Amoy USDT...");
                try {
                  await mintTestnetUsdt(80002);
                  setClaimMsg("✓ Minted 10,000 Amoy USDT successfully!");
                } catch (e: any) {
                  setClaimMsg(`Notice: ${e?.message || "Minting failed"}`);
                }
              }}
              className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-200 dark:border-purple-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
            >
              ⚡ Mint 10k Amoy USDT
            </button>

            <a
              href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              Google Sepolia ETH Faucet ↗
            </a>

            <a
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              Alchemy Sepolia ETH Faucet ↗
            </a>

            <a
              href="https://testnet.bnbchain.org/faucet-smart"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              BSC tBNB Faucet ↗
            </a>

            <a
              href="https://faucet.polygon.technology/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-200 dark:border-purple-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              Polygon Amoy POL Faucet ↗
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-cond font-bold text-[var(--ink)] uppercase tracking-wider">
              Source Network
            </label>
            <select
              name="chain"
              required
              defaultValue=""
              disabled={!config?.sources.length || !!error}
              className="w-full bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-[var(--ink)] text-base font-mono focus:border-[#8B1A1A] focus:outline-none transition-colors"
            >
              <option value="" disabled className="bg-[var(--bg-card)] text-[var(--mid)]">
                {error ? "Networks unavailable" : !config ? "Loading networks…" : !config.sources.length ? "No source networks available" : "Select network"}
              </option>
              {config?.sources.map((s) => (
                <option key={s.chainId} value={s.chainId} className="bg-[var(--bg-card)] text-[var(--ink)] font-mono">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Field name="amount" label="USDT Amount" type="number" />
        </div>

        {config && !config.sources.length && !error && <p className="text-amber-600 dark:text-amber-400 text-xs">Source bridging is not available yet.</p>}
        {!address && <p className="text-amber-600 dark:text-amber-400 text-xs">Connect your wallet to bridge source USDT.</p>}
        {error && <p role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold">{error}</p>}
      </ActionForm>

      {claimMsg && (
        <div className="p-4 bg-amber-100 dark:bg-amber-950/40 border border-amber-400 dark:border-amber-500/40 rounded-xl text-xs text-amber-950 dark:text-amber-200 font-bold animate-pulse flex items-center gap-2.5 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping shrink-0" />
          <span>{claimMsg}</span>
        </div>
      )}

      <Panel title="Native Bridge History & Claim Portal">
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs text-[var(--mid)]">
            <thead className="bg-[var(--bg-card-sub)] text-[var(--muted)] font-extrabold uppercase tracking-wider text-[11px] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3">Source Network</th>
                <th className="px-4 py-3">Deposit Amount</th>
                <th className="px-4 py-3">Native Bridge Status</th>
                <th className="px-4 py-3">Destination Claim & Proofs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
              {deposits
                .filter((d) => !address || !d.recipient || d.recipient.toLowerCase() === address.toLowerCase())
                .map((d) => {
                const source = config?.sources.find(
                  (s) => s.chainId === d.source
                );
                const isDone = d.state === 'finalized' || d.state === 'completed';
                const isClaiming = claimingId === d.id;
                return (
                  <tr key={d.id} className="hover:bg-[var(--bg-card-sub)]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">{source?.name || d.source}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {amount(d.amount)} {d.source === 80002 ? "USDT.c" : "USDT"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                          : 'bg-amber-100 text-amber-950 border border-amber-400 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                      }`}>
                        {!isDone && <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping" />}
                        {isDone ? "CLAIMED & MINTED" : "READY TO MINT (SWITCH TO AMOY)"}
                      </span>
                      {d.error && <p className="text-red-600 dark:text-red-400 text-[10px] mt-1 font-semibold">{d.error}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {!isDone && (
                          <button
                            type="button"
                            disabled={isClaiming}
                            onClick={() => void handleClaimDeposit(d)}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-md text-[11px] shadow-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isClaiming ? "Switching & Minting..." : "Switch & Mint USDT.c ↗"}
                          </button>
                        )}

                        {source?.explorer ? (
                          <a
                            href={`${source.explorer}/tx/${d.sourceTx}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#E3262E] hover:underline font-bold inline-flex items-center gap-0.5"
                          >
                            Source Deposit ↗
                          </a>
                        ) : (
                          <span className="text-[var(--muted)]">{d.sourceTx.slice(0, 8)}…</span>
                        )}

                        {d.mintTx && (
                          <>
                            <span className="text-[var(--muted)]">|</span>
                            <a
                              href={`${EXPLORER}/tx/${d.mintTx}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              Destination Mint Proof ↗
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!address ? (
            <div className="p-8 text-center text-amber-600 dark:text-amber-400 text-xs space-y-1">
              <p className="font-bold">Connect your Web3 wallet to view your personal bridge history.</p>
            </div>
          ) : !deposits.filter((d) => !d.recipient || d.recipient.toLowerCase() === address.toLowerCase()).length ? (
            <div className="p-8 text-center text-[var(--muted)] text-xs space-y-1">
              <p className="font-semibold text-[var(--ink)]">No bridge deposits indexed for connected wallet ({address.slice(0, 6)}...{address.slice(-4)}) yet.</p>
              <p className="text-[11px] text-[var(--muted)]">Deposit source USDT above to start bridging to Polygon Amoy.</p>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
export type AdminTab =
  | "offchain"
  | "offchain-history"
  | "replace-wallet"
  | "liquidity"
  | "controls"
  | "records"
  | "bridge"
  | "migration";

interface ParsedBatchRow {
  buyer: string;
  quantity: string;
  value: string;
  price: string;
  purchased: string;
  started: string;
  reference: string;
  isValid: boolean;
  error?: string;
}

function parseCsvLine(line: string): string[] {
  const res: string[] = [];
  let inQuotes = false;
  let cur = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      res.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  res.push(cur.trim());
  return res;
}

function BulkOfflineSalesSection() {
  const { offlineBatch, refresh } = useWeb3();
  const [rows, setRows] = useState<ParsedBatchRow[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCsv = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date(Date.now() - 3600 * 1000).toISOString().slice(0, 16);
    const csvContent =
      "Buyer Wallet Address,SZ Quantity,Original USD Value,Original Price,Purchase Date (YYYY-MM-DDTHH:mm),Staking Start Date (YYYY-MM-DDTHH:mm),Payment Reference\n" +
      `0xaf70139970e12f96ca558cd222a99d05142c9505,100,100,1.0,${nowIso},${nowIso},REF-OFFLINE-${rand}-001\n` +
      `0xdC6787C4945C07fF01236f4a505f72aC65D98258,250,250,1.0,${nowIso},${nowIso},REF-OFFLINE-${rand}-002\n` +
      `0x74762cfD6Bf491c12140D83A64879203E7e15461,300,300,1.0,${nowIso},${nowIso},REF-OFFLINE-${rand}-003\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `swiz_bulk_offline_sales_template_${rand}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg("");
    setTxHash("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = String(event.target?.result || "");
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setStatusMsg("Error: CSV must contain a header row and at least one data row.");
        return;
      }

      const dataLines = lines.slice(1);
      const parsed: ParsedBatchRow[] = [];
      const seenRefs = new Set<string>();
      const nowSec = Math.floor(Date.now() / 1000);

      dataLines.forEach((line, idx) => {
        const cols = parseCsvLine(line);
        if (cols.length < 2 || !cols.some(Boolean)) return;

        let buyer = (cols[0] || "").trim();
        const quantity = (cols[1] || "").trim();
        const value = (cols[2] || quantity).trim();
        const price = (cols[3] || "1.0").trim();
        const purchased = (cols[4] || new Date(Date.now() - 3600 * 1000).toISOString().slice(0, 16)).trim();
        const started = (cols[5] || purchased).trim();
        const reference = (cols[6] || `BATCH-REF-${idx + 1}-${Date.now().toString(36).toUpperCase()}`).trim();

        let error = "";

        // Check and normalize EVM address
        if (!isAddress(buyer)) {
          error = "Invalid 0x EVM address";
        } else {
          try {
            buyer = getAddress(buyer.toLowerCase());
          } catch {
            error = "Invalid address format";
          }
        }

        if (!error) {
          if (Number(quantity) < 20 || isNaN(Number(quantity))) {
            error = "SZ Quantity must be >= 20";
          } else if (Number(value) <= 0 || isNaN(Number(value))) {
            error = "Value must be > 0";
          } else if (Number(price) <= 0 || isNaN(Number(price))) {
            error = "Price must be > 0";
          } else if (seenRefs.has(reference.toLowerCase())) {
            error = "Duplicate reference ID in this batch file";
          } else {
            const pDate = new Date(purchased);
            const sDate = new Date(started);
            const pTs = isNaN(pDate.getTime()) ? nowSec - 3600 : Math.floor(pDate.getTime() / 1000);
            const sTs = isNaN(sDate.getTime()) ? pTs : Math.floor(sDate.getTime() / 1000);

            if (sTs > nowSec) {
              error = "Staking start date cannot be in the future";
            } else if (sTs < pTs) {
              error = "Start date cannot be earlier than purchase date";
            }
          }
        }

        seenRefs.add(reference.toLowerCase());

        parsed.push({
          buyer,
          quantity,
          value,
          price,
          purchased,
          started,
          reference,
          isValid: !error,
          error,
        });
      });

      // Display initial parsed rows immediately
      setRows([...parsed]);

      // Verify on-chain uniqueness for each reference ID asynchronously
      try {
        const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
        const szContract = new Contract(ADDRESSES.sz, SZ_ABI, provider);

        const checkPromises = parsed.map(async (row) => {
          if (row.isValid) {
            try {
              const refHash = hashId(row.reference);
              const alreadyUsed = await szContract.recordedReferences(refHash);
              if (alreadyUsed) {
                row.isValid = false;
                row.error = `Reference ID "${row.reference}" has already been used on-chain`;
              }
            } catch (err) {
              console.warn("Could not check reference uniqueness:", err);
            }
          }
        });

        await Promise.all(checkPromises);
        setRows([...parsed]);
      } catch (err) {
        console.warn("On-chain batch pre-check error:", err);
      }
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => r.isValid);
  const totalQty = validRows.reduce((acc, r) => acc + (parseFloat(r.quantity) || 0), 0);
  const totalVal = validRows.reduce((acc, r) => acc + (parseFloat(r.value) || 0), 0);

  const handleSubmitBatch = async () => {
    if (validRows.length === 0) return;
    if (validRows.length > 100) {
      setStatusMsg("Error: Maximum batch size is 100 sales per transaction.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMsg("Verifying payment references on-chain before transaction...");

      // Final check against on-chain recordedReferences to prevent reverting
      const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
      const szContract = new Contract(ADDRESSES.sz, SZ_ABI, provider);
      for (const r of validRows) {
        const refHash = hashId(r.reference);
        const isRecorded = await szContract.recordedReferences(refHash);
        if (isRecorded) {
          throw new Error(
            `Payment Reference "${r.reference}" (Buyer: ${r.buyer.slice(0, 8)}...) has already been used on-chain. Please edit the CSV with a unique Reference ID.`
          );
        }
      }

      setStatusMsg(`Preparing 1 on-chain transaction for ${validRows.length} offline sales...`);

      const sales: Sale[] = validRows.map((r) => {
        const pDate = new Date(r.purchased);
        const sDate = new Date(r.started);
        const nowSec = Math.floor(Date.now() / 1000);
        const pTs = isNaN(pDate.getTime()) ? nowSec - 3600 : Math.floor(pDate.getTime() / 1000);
        const sTs = isNaN(sDate.getTime()) ? pTs : Math.floor(sDate.getTime() / 1000);

        return {
          buyer: getAddress(r.buyer.toLowerCase()),
          amount: units(r.quantity),
          value: units(r.value),
          price: units(r.price),
          purchasedAt: BigInt(pTs),
          startedAt: BigInt(sTs),
          referenceId: hashId(r.reference),
        };
      });

      setStatusMsg("Please confirm the transaction in MetaMask (1 single approval for all sales)...");
      const receipt = await offlineBatch(sales);
      const hash = (receipt as any)?.hash || (receipt as any)?.transactionHash || String(receipt);
      setTxHash(hash);

      validRows.forEach((r) => {
        saveLocalOfflineSale({
          id: `${hash}-${r.reference}`,
          txHash: hash,
          buyer: r.buyer,
          amount: units(r.quantity).toString(),
          valueUsd: units(r.value).toString(),
          priceUsd: units(r.price).toString(),
          purchasedAt: r.purchased,
          startedAt: r.started,
          reference: r.reference,
          timestamp: Date.now(),
        });
      });

      await refresh();
      setStatusMsg(`✓ Successfully recorded ${validRows.length} offline sales on-chain in 1 transaction!`);
      setRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Batch upload failed:", err);
      const decoded = decodeWeb3Error(err);
      setStatusMsg(`Error: ${decoded}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel title="Bulk Offline Sales Uploader (1 On-Chain Batch Transaction)">
      <div className="space-y-5">
        <p className="text-xs sm:text-sm text-[var(--mid)] font-body leading-relaxed">
          Upload up to 100 offline sales at once using a CSV file. The smart contract executes all allocations atomically in <strong>1 single MetaMask transaction</strong>, saving time and gas fees.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="bulk-csv-input"
            />
            <label
              htmlFor="bulk-csv-input"
              className="px-4 py-2.5 bg-[#8B1A1A] hover:bg-[#a12020] text-white rounded-xl text-xs font-cond font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Select CSV File</span>
            </label>

            <button
              type="button"
              onClick={downloadSampleCsv}
              className="px-4 py-2.5 bg-[var(--bg-card)] hover:bg-[var(--bg-card-sub)] text-[var(--ink)] border border-[var(--border)] rounded-xl text-xs font-cond font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {rows.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setRows([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-3 py-2 text-red-500 hover:text-red-400 text-xs font-cond font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear File</span>
            </button>
          )}
        </div>

        {/* Batch Summary Stats */}
        {rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl">
              <span className="text-[10px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] block">Total Parsed</span>
              <span className="text-base font-mono font-bold text-[var(--ink)]">{rows.length} Rows</span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <span className="text-[10px] font-cond font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Valid Rows</span>
              <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">{validRows.length} Ready</span>
            </div>
            <div className="p-3 bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl">
              <span className="text-[10px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] block">Total SZ Quantity</span>
              <span className="text-base font-mono font-bold text-amber-500">{totalQty.toLocaleString()} SZ</span>
            </div>
            <div className="p-3 bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl">
              <span className="text-[10px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] block">Total USD Volume</span>
              <span className="text-base font-mono font-bold text-[var(--ink)]">${totalVal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              statusMsg.startsWith("Error")
                ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {statusMsg.startsWith("Error") ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <div className="flex-1">
              <span>{statusMsg}</span>
              {txHash && (
                <div className="mt-1 font-mono text-[11px]">
                  <a
                    href={`${EXPLORER}/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <span>View On-Chain Batch Tx: {txHash.slice(0, 14)}...{txHash.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Table */}
        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                Batch Preview & Validation
              </h3>
              <span className="text-[11px] font-mono text-[var(--muted)]">
                {validRows.length} of {rows.length} valid
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs text-[var(--mid)]">
                <thead className="bg-[var(--bg-card-sub)] text-[var(--muted)] uppercase text-[10px] font-bold tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Buyer Address</th>
                    <th className="px-3 py-2.5">Quantity</th>
                    <th className="px-3 py-2.5">Value (USD)</th>
                    <th className="px-3 py-2.5">Start Date</th>
                    <th className="px-3 py-2.5">Reference ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-card-sub)]/50 transition-colors">
                      <td className="px-3 py-2 font-mono text-[var(--muted)]">{i + 1}</td>
                      <td className="px-3 py-2">
                        {r.isValid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Ready
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30" title={r.error}>
                            {r.error}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[var(--ink)]">
                        {r.buyer ? `${r.buyer.slice(0, 6)}...${r.buyer.slice(-4)}` : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-amber-500">{r.quantity} SZ</td>
                      <td className="px-3 py-2 font-mono text-[var(--ink)]">${r.value}</td>
                      <td className="px-3 py-2 text-[var(--mid)]">{r.started || "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{r.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Submit Batch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitBatch}
                disabled={validRows.length === 0 || isSubmitting}
                className="w-full py-3.5 bg-[#8B1A1A] hover:bg-[#a12020] disabled:opacity-50 text-white rounded-xl text-sm font-cond font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#8B1A1A]/30"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing Batch Transaction...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Confirm & Submit Batch ({validRows.length} Sales in 1 Transaction)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function SingleOfflineSaleForm({ parseSale }: { parseSale: (f: FormData) => Sale }) {
  const { offline, refresh, getSigner } = useWeb3();
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [currentRef, setCurrentRef] = useState<string>(() => `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);

  const generateNewRef = () => {
    setCurrentRef(`REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const defaultPurchased = useMemo(() => {
    const d = new Date(Date.now() - 3600 * 1000);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  }, []);

  const defaultStarted = useMemo(() => {
    const d = new Date(Date.now() - 600 * 1000);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  }, []);

  return (
    <ActionForm
      title="Record offline sale"
      submit={async (f) => {
        setStatusMsg("Validating offline sale details & payment reference uniqueness...");
        try {
          const refRaw = (currentRef || String(f.get("reference") || "")).trim();
          if (!refRaw) {
            throw Error("Offline payment reference is required.");
          }

          const buyerAddr = String(f.get("buyer") || "").trim();
          if (!isAddress(buyerAddr)) {
            throw Error(`Invalid buyer wallet address "${buyerAddr}". Must be a valid 0x EVM address.`);
          }

          // Check on-chain reference uniqueness using Alchemy RPC
          const refIdHash = hashId(refRaw);
          let alreadyRecorded = false;
          try {
            const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
            const szContract = new Contract(ADDRESSES.sz, SZ_ABI, provider);
            alreadyRecorded = await szContract.recordedReferences(refIdHash);
          } catch {}

          if (alreadyRecorded) {
            throw Error(`Payment reference "${refRaw}" has ALREADY been recorded on-chain. Please click 'Generate Unique Reference' above to generate a new one.`);
          }

          const saleObj = parseSale(f);
          saleObj.referenceId = refIdHash;

          // Pre-flight static call simulation
          try {
            const s = await getSigner();
            const szContract = new Contract(ADDRESSES.sz, SZ_ABI, s);
            await szContract.recordOfflineSale.staticCall(saleObj);
          } catch (simErr: any) {
            console.warn("Pre-flight staticCall validation error:", simErr);
            const decoded = decodeWeb3Error(simErr);
            throw new Error(decoded);
          }

          setStatusMsg("Submitting offline sale to Polygon Amoy blockchain via admin wallet...");
          const receipt = await offline(saleObj);
          const txHash = (receipt as any)?.hash || (receipt as any)?.transactionHash || String(receipt);

          const rec: OfflineSaleRecord = {
            id: txHash,
            txHash,
            buyer: saleObj.buyer,
            amount: saleObj.amount.toString(),
            valueUsd: saleObj.value.toString(),
            priceUsd: saleObj.price.toString(),
            purchasedAt: String(f.get("purchased")),
            startedAt: String(f.get("started")),
            reference: refRaw,
            timestamp: Date.now(),
          };
          saveLocalOfflineSale(rec);
          await refresh();
          setStatusMsg("✓ Offline sale recorded on-chain successfully! You can view it in the Offline Sales History tab.");
          generateNewRef();
          setTimeout(() => setStatusMsg(""), 6000);
          return receipt;
        } catch (err: any) {
          const decoded = decodeWeb3Error(err);
          setStatusMsg(`Error: ${decoded}`);
          throw new Error(decoded);
        }
      }}
    >
      <Field name="buyer" label="Buyer wallet" />
      <div className="columns">
        <Field name="quantity" label="SZ quantity" />
        <Field name="value" label="Original USD value" />
        <Field name="price" label="Original SZ unit price" />
      </div>
      <div className="columns">
        <DateTimePickerField
          name="purchased"
          label="Original purchase date & time"
          defaultValue={defaultPurchased}
        />
        <DateTimePickerField
          name="started"
          label="Staking start date & time (must be in past)"
          defaultValue={defaultStarted}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--mid)]">Unique offline payment reference</label>
          <button
            type="button"
            onClick={generateNewRef}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 underline font-medium cursor-pointer"
          >
            Generate Unique Reference
          </button>
        </div>
        <input
          name="reference"
          value={currentRef}
          onChange={(e) => setCurrentRef(e.target.value)}
          required
          className="w-full px-3 py-2 bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#8B1A1A]"
        />
      </div>
      {statusMsg && (
        <p className={`text-xs font-semibold mt-2 ${statusMsg.startsWith("Error") ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
          {statusMsg}
        </p>
      )}
    </ActionForm>
  );
}

function OfflineSalesFormSection({ parseSale }: { parseSale: (f: FormData) => Sale }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-xl text-xs font-cond font-bold uppercase tracking-wider transition-all cursor-pointer ${
            mode === "single"
              ? "bg-[#8B1A1A] text-white shadow-md shadow-[#8B1A1A]/35"
              : "text-[var(--mid)] hover:text-[var(--ink)]"
          }`}
        >
          📝 Single Entry Form
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`px-4 py-2 rounded-xl text-xs font-cond font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            mode === "bulk"
              ? "bg-[#8B1A1A] text-white shadow-md shadow-[#8B1A1A]/35"
              : "text-[var(--mid)] hover:text-[var(--ink)]"
          }`}
        >
          <span>⚡ Bulk CSV Batch Upload</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
              mode === "bulk" ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-500"
            }`}
          >
            1-Tx
          </span>
        </button>
      </div>

      {mode === "single" ? (
        <SingleOfflineSaleForm parseSale={parseSale} />
      ) : (
        <BulkOfflineSalesSection />
      )}
    </div>
  );
}

function OfflineSalesHistorySection() {
  const [records, setRecords] = useState<OfflineSaleRecord[]>(getLocalOfflineSales());
  const [filter, setFilter] = useState("");
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const onChainRecords = await fetchOnChainOfflineSales();
      const local = getLocalOfflineSales();
      const merged = mergeOfflineSales(local, onChainRecords);
      if (alive) setRecords(merged);
    }
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedTx(txt);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filteredRecords = records.filter(
    (r) =>
      !filter ||
      r.buyer?.toLowerCase().includes(filter.toLowerCase()) ||
      r.reference?.toLowerCase().includes(filter.toLowerCase()) ||
      r.txHash?.toLowerCase().includes(filter.toLowerCase())
  );

  const totalVolume = records.reduce((acc, r) => acc + BigInt(r.valueUsd || 0), 0n);

  return (
    <Panel title="Recorded Offline Sales History">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-[11px] text-[var(--muted)] block">Total Offline Sales</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{records.length} Recorded</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-[11px] text-[var(--muted)] block">Total USD Volume</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">${amount(totalVolume)}</span>
            </div>
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by buyer address or reference..."
              className="w-full px-3 py-1.5 bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-xl text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[#8B1A1A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--mid)]">
            <thead className="bg-[var(--bg-card-sub)] text-[var(--muted)] uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Reference / ID</th>
                <th className="px-4 py-3">Buyer Wallet</th>
                <th className="px-4 py-3">SZ Quantity</th>
                <th className="px-4 py-3">USD Value</th>
                <th className="px-4 py-3">Purchase Date</th>
                <th className="px-4 py-3 rounded-r-xl text-right">On-Chain Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRecords.map((r, idx) => (
                <tr key={r.txHash || r.reference || idx} className="hover:bg-[var(--bg-card-sub)]/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-amber-500">
                    {r.reference || `Rec #${idx + 1}`}
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--ink)]">
                    <div className="flex items-center gap-1.5">
                      <span>{r.buyer ? `${r.buyer.slice(0, 6)}...${r.buyer.slice(-4)}` : "—"}</span>
                      {r.buyer && (
                        <button
                          type="button"
                          onClick={() => handleCopy(r.buyer)}
                          className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors text-[11px]"
                          title="Copy Wallet Address"
                        >
                          {copiedTx === r.buyer ? "✓" : "📋"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--ink)]">
                    {amount(r.amount)} SZ
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-500">
                    ${amount(r.valueUsd)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)] text-[11px]">
                    {r.purchasedAt || (r.timestamp ? new Date(r.timestamp).toLocaleString() : "—")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.txHash ? (
                      <a
                        href={`${EXPLORER}/tx/${r.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-white/5 hover:bg-emerald-100 dark:hover:bg-white/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        View Receipt ↗
                      </a>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRecords.length && (
            <div className="p-8 text-center text-[var(--muted)] text-xs">
              No recorded offline sales found. Use the "Record Offline Sale" tab to record a new offline sale.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function TreasuryAndCustodyGrid({ stats }: { stats: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const treasuryAddr = stats?.treasury || "—";
  const supplyStr = amount(stats?.supply);
  const inventoryStr = amount(stats?.inventory);
  const custodyStr = amount(stats?.custody);
  const liabilitiesStr = amount(stats?.liabilities);
  const fundsStr = amount(stats?.funds);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Treasury */}
      <div className="lumix-card rounded-2xl p-4 space-y-2.5 relative overflow-hidden group hover:border-[#8B1A1A]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B1A1A] animate-pulse"></span>
            Company Treasury
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-500">
            Multi-Sig
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1.5 p-2 bg-[var(--bg-card-sub)] rounded-xl border border-[var(--border)]">
            <span className="text-xs font-mono font-bold text-[var(--ink)] truncate max-w-[150px]" title={treasuryAddr}>
              {treasuryAddr !== "—" ? `${treasuryAddr.slice(0, 6)}...${treasuryAddr.slice(-4)}` : "—"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {treasuryAddr !== "—" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleCopy(treasuryAddr)}
                    className="p-1 hover:bg-[var(--border)] rounded text-[var(--mid)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`${EXPLORER}/address/${treasuryAddr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:bg-[var(--border)] rounded text-[var(--mid)] hover:text-[var(--ink)] transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
          <p className="text-[10px] font-mono text-[var(--muted)]">Protocol reserve destination</p>
        </div>
      </div>

      {/* 2. Fixed Supply & Unsold Inventory */}
      <div className="lumix-card rounded-2xl p-4 space-y-2.5 relative overflow-hidden group hover:border-[#8B1A1A]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Supply & Inventory
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-bold text-blue-500">
            Fixed Supply
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="text-base font-bold font-mono text-[var(--ink)]">
            {Number(supplyStr.replace(/,/g, "") || 0).toLocaleString()} <span className="text-xs text-[var(--muted)]">SZ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
            <span>Unsold:</span>
            <span className="font-bold text-amber-500">
              {Number(inventoryStr.replace(/,/g, "") || 0).toLocaleString()} SZ
            </span>
          </div>
        </div>
      </div>

      {/* 3. Package Liabilities & Custody */}
      <div className="lumix-card rounded-2xl p-4 space-y-2.5 relative overflow-hidden group hover:border-[#8B1A1A]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Package Custody
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-500">
            100% Backed
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="text-base font-bold font-mono text-[var(--ink)]">
            {Number(custodyStr.replace(/,/g, "") || 0).toLocaleString()} <span className="text-xs text-[var(--muted)]">SZ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
            <span>Liabilities:</span>
            <span className="font-bold text-emerald-500">
              {Number(liabilitiesStr.replace(/,/g, "") || 0).toLocaleString()} SZ
            </span>
          </div>
        </div>
      </div>

      {/* 4. Admin Buyback Liquidity */}
      <div className="lumix-card rounded-2xl p-4 space-y-2.5 relative overflow-hidden group hover:border-[#8B1A1A]/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-cond font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-[#8B1A1A]" />
            Buyback Liquidity
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 text-[10px] font-mono font-bold text-[#8B1A1A]">
            Reserve
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="text-base font-black text-[var(--ink)]">
            ${Number(fundsStr.replace(/,/g, "") || 0).toLocaleString()} <span className="text-xs font-bold text-[var(--muted)]">USDT.c</span>
          </div>
          <p className="text-[10px] text-[var(--muted)]">Programmatic reserve</p>
        </div>
      </div>
    </div>
  );
}

export function AdminOperations({ tab }: { tab: AdminTab }) {
  const { isAdmin, stats, admin, readPackages, balances } = useWeb3();
  const [found, setFound] = useState<Package[]>([]),
    [lookupError, setLookupError] = useState("");
  if (!isAdmin)
    return (
      <Panel title="Administration">
        <p>Connect an account with the on-chain administrator role.</p>
      </Panel>
    );
  const parseSale = (f: FormData): Sale => {
    const buyer = String(f.get("buyer") || "").trim();
    if (!isAddress(buyer)) {
      throw Error(`Invalid buyer wallet address "${buyer}". Must be a valid 0x EVM address.`);
    }

    const refRaw = String(f.get("reference") || "").trim();
    if (!refRaw) {
      throw Error("Offline payment reference is required.");
    }

    const quantityStr = String(f.get("quantity") || "").trim();
    const valueStr = String(f.get("value") || "").trim();
    const priceStr = String(f.get("price") || "").trim();

    if (!quantityStr || Number(quantityStr) <= 0) {
      throw Error("SZ quantity must be greater than zero.");
    }
    if (!valueStr || Number(valueStr) <= 0) {
      throw Error("Original USD value must be greater than zero.");
    }
    if (!priceStr || Number(priceStr) <= 0) {
      throw Error("Original SZ unit price must be greater than zero.");
    }

    const qty = units(quantityStr);
    if (qty < 20n) {
      throw Error("SZ quantity must be at least 20 micro-units (0.000020 SZ).");
    }

    const val = units(valueStr);
    const prc = units(priceStr);

    const purchasedRaw = String(f.get("purchased") || "");
    const startedRaw = String(f.get("started") || "");

    const purchasedDate = purchasedRaw ? new Date(purchasedRaw) : new Date(Date.now() - 3600000);
    const startedDate = startedRaw ? new Date(startedRaw) : new Date(Date.now() - 600000);

    if (isNaN(purchasedDate.getTime())) {
      throw Error("Please select a valid original purchase date & time");
    }
    if (isNaN(startedDate.getTime())) {
      throw Error("Please select a valid staking start date & time");
    }

    let purchasedAt = Math.floor(purchasedDate.getTime() / 1000);
    let startedAt = Math.floor(startedDate.getTime() / 1000);
    const nowUnix = Math.floor(Date.now() / 1000);

    // CRITICAL: On-chain contract requires `sale.startedAt <= block.timestamp`.
    // We cap startedAt to 90 seconds in the past to guard against Amoy block time variance and client clock skew.
    if (startedAt > nowUnix - 90) {
      startedAt = nowUnix - 90;
    }
    if (purchasedAt > startedAt) {
      purchasedAt = startedAt;
    }
    if (purchasedAt <= 0) {
      purchasedAt = Math.max(1, startedAt - 3600);
    }

    return {
      buyer,
      amount: qty,
      value: val,
      price: prc,
      purchasedAt,
      startedAt,
      referenceId: hashId(refRaw),
    };
  };
  return (
    <>
      <TreasuryAndCustodyGrid stats={stats} />
      {tab === "controls" && (
        <>
          <div className="columns">
            <ActionForm
              title={stats?.paused ? "Resume protocol" : "Pause protocol"}
              submit={() => admin(stats?.paused ? "unpause" : "pause")}
            >
              <p>Protocol state: {stats?.paused ? "Paused" : "Active"}</p>
            </ActionForm>
            <ActionForm
              title={stats?.wrapperPaused ? "Resume wrapper" : "Pause wrapper"}
              submit={() =>
                admin(stats?.wrapperPaused ? "unpause" : "pause", [], true)
              }
            >
              <p>Wrapper state: {stats?.wrapperPaused ? "Paused" : "Active"}</p>
            </ActionForm>
          </div>
        </>
      )}
      {tab === "offchain" && (
        <OfflineSalesFormSection parseSale={parseSale} />
      )}
      {tab === "offchain-history" && (
        <OfflineSalesHistorySection />
      )}
      {tab === "replace-wallet" && (
        <AdminWalletReplacementSection />
      )}
      {tab === "liquidity" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Fund Buyback Reserve */}
          <ActionForm
            title="Fund buybacks"
            submit={(f) => {
              const val = units(String(f.get("amount")));
              if (val <= 0n) throw new Error("Amount must be greater than zero.");
              return admin("addTreasuryFunds", [val]);
            }}
          >
            <Field name="amount" label="USDT.c amount to fund" />
            <div className="text-xs space-y-1 text-[var(--mid)] font-body">
              <p>
                Transfers USDT.c from your admin wallet into the protocol buyback reserve (<code className="font-mono text-[var(--ink)]">adminFunds</code>).
              </p>
              <div className="flex justify-between items-center pt-1 border-t border-[var(--border)] text-[11px] font-mono">
                <span>Wallet USDT:</span>
                <span className="font-bold text-[var(--ink)]">{amount(balances?.usdt)} USDT</span>
              </div>
            </div>
          </ActionForm>

          {/* 2. Execute Funded Buyback */}
          <ActionForm
            title="Execute funded buyback"
            submit={(f) => {
              const val = units(String(f.get("amount")));
              const available = stats?.funds ?? 0n;
              if (val <= 0n) throw new Error("Buyback budget must be greater than zero.");
              if (val > available) {
                throw new Error(
                  `Entered budget ($${formatUnits(val, 6)} USDT.c) exceeds the available buyback reserve ($${formatUnits(available, 6)} USDT.c). Please fund buybacks first.`
                );
              }
              return admin("executeAdminBuyback", [val]);
            }}
          >
            <Field name="amount" label="USDT.c budget" />
            <div className="text-xs space-y-1 text-[var(--mid)] font-body">
              <p>
                Executes FIFO buybacks using available funds from the protocol buyback reserve. Purchased SZ is routed to the company treasury.
              </p>
              <div className="flex justify-between items-center pt-1 border-t border-[var(--border)] text-[11px] font-mono">
                <span>Available Reserve:</span>
                <span className="font-bold text-[#8B1A1A]">${amount(stats?.funds)} USDT.c</span>
              </div>
            </div>
          </ActionForm>

          {/* 3. Return Unused Funds to Treasury */}
          <ActionForm
            title="Return unused funds to treasury"
            submit={(f) => {
              const val = units(String(f.get("amount")));
              const available = stats?.funds ?? 0n;
              if (val <= 0n) throw new Error("Withdrawal amount must be greater than zero.");
              if (val > available) {
                throw new Error(
                  `Cannot withdraw $${formatUnits(val, 6)} USDT.c: The contract currently only has $${formatUnits(available, 6)} USDT.c in unused buyback funds. You can only withdraw up to the available reserve.`
                );
              }
              return admin("withdrawTreasuryFunds", [val]);
            }}
          >
            <Field name="amount" label="USDT.c amount to return" />
            <div className="text-xs space-y-1 text-[var(--mid)] font-body">
              <p>
                Returns unused buyback funds from the contract reserve back to Company Treasury ({stats?.treasury ? `${stats.treasury.slice(0, 6)}...${stats.treasury.slice(-4)}` : "Treasury"}).
              </p>
              <div className="flex justify-between items-center pt-1 border-t border-[var(--border)] text-[11px] font-mono">
                <span>Available to Return:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">${amount(stats?.funds)} USDT.c</span>
              </div>
              {Number(stats?.funds ?? 0n) <= 1 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                  ⚠️ No unused buyback funds currently in reserve.
                </p>
              )}
            </div>
          </ActionForm>
        </div>
      )}
      {tab === "controls" && (
        <>
          <ActionForm
            title="Update purchase limits"
            submit={(f) =>
              admin("setLimits", [
                units(String(f.get("min"))),
                units(String(f.get("max"))),
                BigInt(String(f.get("active"))),
              ])
            }
          >
            <Field
              name="min"
              label="Minimum USDT.c"
              value={amount(stats?.minimum)}
            />
            <Field
              name="max"
              label="Maximum USDT.c"
              value={amount(stats?.maximum)}
            />
            <Field
              name="active"
              label="Maximum active packages per wallet (0 = unlimited)"
              value="0"
            />
          </ActionForm>
          <ActionForm
            title="Update role"
            submit={(f) =>
              admin(
                String(f.get("operation")),
                [
                  String(f.get("role")) === "DEFAULT_ADMIN_ROLE"
                    ? "0x" + "0".repeat(64)
                    : hashId(String(f.get("role"))),
                  String(f.get("wallet")),
                ],
                f.get("target") === "wrapper"
              )
            }
          >
            <label>
              Contract
              <select name="target">
                <option value="sz">SZ protocol</option>
                <option value="wrapper">USDT.c wrapper</option>
              </select>
            </label>
            <label>
              Role
              <select name="role">
                <option>ADMIN_ROLE</option>
                <option>DEFAULT_ADMIN_ROLE</option>
                <option>BRIDGE_RELAYER_ROLE</option>
              </select>
            </label>
            <label>
              Operation
              <select name="operation">
                <option value="grantRole">Grant</option>
                <option value="revokeRole">Revoke</option>
              </select>
            </label>
            <Field name="wallet" label="Wallet address" />
            <p>
              Grant and verify replacement access before revoking a current
              administrator.
            </p>
          </ActionForm>
        </>
      )}
      {tab === "migration" && (
        <>
          <ActionForm
            title="Import historical package"
            submit={(f) => {
              const p = JSON.parse(String(f.get("json")));
              return admin("importHistoricalSale", [
                p.sale,
                p.filled,
                p.priorET,
                p.priorUSDT,
              ]);
            }}
          >
            <label>
              Validated migration JSON (base units)
              <textarea name="json" required rows={6} />
            </label>
            <p>
              Use the documented schema. Already bought-back quantities and
              payouts are imported without minting historical ET again.
            </p>
          </ActionForm>
          <ActionForm
            title="Close historical migration permanently"
            submit={() => admin("closeMigration")}
          >
            <p>Close only after reconciliation of the complete import.</p>
          </ActionForm>
        </>
      )}
      {tab === "records" && (
        <>
          <Panel title="Wallet package lookup">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLookupError("");
                setFound([]);
                try {
                  setFound(
                    await readPackages(
                      String(new FormData(e.currentTarget).get("wallet"))
                    )
                  );
                } catch (e) {
                  setLookupError(String(e));
                }
              }}
            >
              <Field name="wallet" label="Wallet" />
              <button>Load packages</button>
            </form>
            {lookupError && (
              <p role="alert" className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-200 text-xs font-semibold mt-3 break-words">
                {lookupError}
              </p>
            )}
            <PackageTable packages={found} />
          </Panel>
          <History all />
        </>
      )}
      {tab === "bridge" && <BridgePanel all />}
    </>
  );
}
