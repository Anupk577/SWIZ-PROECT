import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { formatUnits, id as hashId, JsonRpcProvider, Interface, zeroPadValue, Contract, type TransactionReceipt } from "ethers";
import {
  useWeb3,
  units,
  type Package,
  type Sale,
} from "../context/Web3Context";
import {
  api,
  type Activity,
  type Deposit,
  type PublicConfig,
} from "../services/api";
import { ADDRESSES, CHAIN_ID, EXPLORER, ADAPTER_ABI, WRAPPER_ABI } from "../constants/contracts";
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
  if (!explorer) return <span>{hash.slice(0, 10)}…</span>;
  return (
    <a href={`${explorer}/tx/${hash}`} target="_blank" rel="noreferrer">
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
    <section className="bg-[#111520]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="w-1.5 h-4 bg-[#E3262E] rounded-full inline-block"></span>
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
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={value}
        required
        className="w-full bg-[#0B0E14] border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:border-[#E3262E] focus:outline-none transition-colors"
      />
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
    <form id={id} className="bg-[#111520]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-5" onSubmit={onSubmit}>
      <h2 className="text-xl font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="w-1.5 h-5 bg-[#E3262E] rounded-full inline-block"></span>
        <span>{title}</span>
      </h2>
      <div className="space-y-4 text-gray-300 text-xs sm:text-sm">
        {children}
      </div>
      <button
        disabled={loading || !connected || disabled}
        className="w-full py-3.5 px-6 rounded-xl bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
      >
        {loading ? "Awaiting transaction…" : title}
      </button>
      {error && (
        <p role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs font-semibold">
          {error}
        </p>
      )}
      {tx && (
        <p role="status" className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
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
export function History({ all = false }: { all?: boolean }) {
  const { address } = useWeb3();
  const [items, setItems] = useState<Activity[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setItems([]);
    setError("");
    const load = () =>
      api<{ transactions: Activity[] }>(
        all ? "/events" : `/transactions/${address}`
      )
        .then((r) => {
          if (alive) {
            setItems(r.transactions);
            setError("");
          }
        })
        .catch(() => {
          if (alive)
            setError("Confirmed history is unavailable. Retry shortly.");
        });
    if (all || address) void load();
    const timer = setInterval(() => {
      if (all || address) void load();
    }, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address, all]);
  return (
    <Panel title="Confirmed event history">
      <p>Events appear after the configured confirmation threshold.</p>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Package</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{new Date(i.timestamp).toLocaleString()}</td>
                  <td>{i.type}</td>
                  <td>{i.packageId || "—"}</td>
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
    const provider = new JsonRpcProvider("https://polygon-amoy-bor-rpc.publicnode.com", CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
    const adapterIface = new Interface(ADAPTER_ABI);
    const wrapperIface = new Interface(WRAPPER_ABI);

    const currentBlock = await provider.getBlockNumber().catch(() => 46774000);
    const fromBlock = Math.max(0, currentBlock - 8000);

    const adapterTopic0 = hashId("Deposited(uint256,address,address,uint256,uint256)");
    const wrapperTopic0 = hashId("DepositMinted(bytes32,address,uint256,uint256,address,uint256,bytes32)");
    const paddedUser = userAddress && userAddress.length === 42 ? zeroPadValue(userAddress, 32) : null;

    const [adapterLogs, wrapperLogs] = await Promise.all([
      provider.getLogs({
        address: ADDRESSES.adapter,
        topics: [adapterTopic0, null, null, paddedUser],
        fromBlock,
        toBlock: "latest",
      }).catch(() => []),
      provider.getLogs({
        address: ADDRESSES.wrapper,
        topics: [wrapperTopic0, null, paddedUser],
        fromBlock,
        toBlock: "latest",
      }).catch(() => []),
    ]);

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
    for (const log of adapterLogs) {
      try {
        const parsed = adapterIface.parseLog(log);
        if (parsed) {
          const mintInfo = mintedBySourceTx.get(log.transactionHash.toLowerCase());
          onChainDeposits.push({
            id: log.transactionHash,
            source: 80002,
            recipient: parsed.args.recipient,
            amount: parsed.args.amount6.toString(),
            sourceTx: log.transactionHash,
            mintTx: mintInfo?.mintTx,
            state: mintInfo ? "completed" : "finalized",
          });
        }
      } catch {}
    }

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

export function BridgePanel({ all = false }: { all?: boolean }) {
  const { address, deposit, getSigner, refresh } = useWeb3();
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

      const adapter = d.source === 97 
        ? "0x279bF3c4bF4E1eE5A5Afed5d123d0421424e284F" 
        : ADDRESSES.adapter;

      let nonce = 1n;
      try {
        const srcRpc = d.source === 97 
          ? "https://bsc-testnet-rpc.publicnode.com" 
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

      setClaimMsg("Submitting mint & transfer through your wallet on Polygon Amoy (Please confirm gas & transaction in your wallet)...");
      
      const wrapper = new Contract(ADDRESSES.wrapper, WRAPPER_ABI, userSigner);

      const tx = await wrapper.mintDeposit(
        userAddr || d.recipient || address,
        d.amount,
        BigInt(d.source),
        adapter,
        nonce,
        d.sourceTx
      );
      const receipt = await tx.wait();
      const mintTx = receipt.hash;

      const updatedDep: Deposit = {
        ...d,
        state: "completed",
        mintTx: mintTx,
      };
      saveLocalDeposit(updatedDep);
      setDeposits((prev) => mergeDeposits([updatedDep], prev));
      await refresh();
      setClaimMsg("✓ Verified & Signed by Wallet! USDT.c minted and transferred to your wallet.");
    } catch (e: any) {
      console.error("Claim error:", e);
      setClaimMsg(`Notice: ${e?.message || "Wallet switch or signature request cancelled"}`);
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
            chainId: 80002,
            name: "Polygon Amoy Testnet (80002)",
            adapter: ADDRESSES.adapter,
            token: ADDRESSES.usdt,
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: EXPLORER,
          },
          {
            chainId: 56,
            name: "BNB Smart Chain (BSC) Mainnet (56)",
            adapter: ADDRESSES.adapter,
            token: "0x55d398326f99059fF775485246999027B3197955",
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: "https://bscscan.com",
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
            chainId: 1,
            name: "Ethereum Mainnet (1)",
            adapter: ADDRESSES.adapter,
            token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: "https://etherscan.io",
          },
          {
            chainId: 11155111,
            name: "Ethereum Sepolia Testnet (11155111)",
            adapter: ADDRESSES.adapter,
            token: "0x7169D388206751599E10E59489A1208D594119d8",
            treasury: "0x1Eb5FDFa920aE1E8341288e4F69c698698FC5926",
            explorer: "https://sepolia.etherscan.io",
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

        const activeConfig = (c && Array.isArray(c.sources) && c.sources.length > 0) ? c : amoyDefaultConfig;
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
            setClaimMsg("Step 3: Switching wallet to Polygon Amoy (80002) to mint & transfer USDT.c...");
            await handleClaimDeposit(newDep);
          }
          return receipt;
        }}
      >
        <div className="p-4 bg-[#E3262E]/10 border border-[#E3262E]/20 rounded-xl text-xs text-gray-300 leading-relaxed space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">
              Direct Wallet Bridging Flow (USDT ➔ USDT.c)
            </p>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
              1:1 Instant Mint & Transfer
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="font-bold text-amber-400">1. Wallet Approve</span>
              <p className="text-gray-400">Approve USDT allowance in your connected wallet on source network.</p>
            </div>
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="font-bold text-blue-400">2. Wallet Deposit</span>
              <p className="text-gray-400">Deposit USDT into source bridge adapter through your wallet.</p>
            </div>
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="font-bold text-emerald-400">3. Auto Switch & Mint/Transfer</span>
              <p className="text-gray-400">Wallet automatically switches to Polygon Amoy (80002) to mint & transfer 1:1 USDT.c.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              Need Testnet USDT or Native Gas Tokens?
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://testnet.bnbchain.org/faucet-smart"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
            >
              BSC tBNB Faucet ↗
            </a>
            <a
              href="https://faucet.polygon.technology/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
            >
              Polygon Amoy POL Faucet ↗
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              Source Network
            </label>
            <select
              name="chain"
              required
              defaultValue=""
              disabled={!config?.sources.length || !!error}
              className="w-full bg-[#0B0E14] border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:border-[#E3262E] focus:outline-none transition-colors"
            >
              <option value="" disabled className="bg-[#0B0E14] text-gray-400">
                {error ? "Networks unavailable" : !config ? "Loading networks…" : !config.sources.length ? "No source networks available" : "Select network"}
              </option>
              {config?.sources.map((s) => (
                <option key={s.chainId} value={s.chainId} className="bg-[#0B0E14] text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Field name="amount" label="USDT Amount" type="number" />
        </div>

        {config && !config.sources.length && !error && <p className="text-amber-400 text-xs">Source bridging is not available yet.</p>}
        {!address && <p className="text-amber-400 text-xs">Connect your wallet to bridge source USDT.</p>}
        {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
      </ActionForm>

      {claimMsg && (
        <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-200 font-semibold animate-pulse">
          {claimMsg}
        </div>
      )}

      <Panel title="Native Bridge History & Claim Portal">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#181D29] text-gray-200 font-extrabold uppercase tracking-wider text-[11px] border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Source Network</th>
                <th className="px-4 py-3">Deposit Amount</th>
                <th className="px-4 py-3">Native Bridge Status</th>
                <th className="px-4 py-3">Destination Claim & Proofs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0D1017]">
              {deposits
                .filter((d) => !address || !d.recipient || d.recipient.toLowerCase() === address.toLowerCase())
                .map((d) => {
                const source = config?.sources.find(
                  (s) => s.chainId === d.source
                );
                const isDone = d.state === 'finalized' || d.state === 'completed';
                const isClaiming = claimingId === d.id;
                return (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{source?.name || d.source}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {amount(d.amount)} {d.source === 80002 ? "USDT.c" : "USDT"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {!isDone && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                        {isDone ? "CLAIMED & MINTED" : "READY TO CLAIM (SWITCH TO AMOY)"}
                      </span>
                      {d.error && <p className="text-red-400 text-[10px] mt-1">{d.error}</p>}
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
                            {isClaiming ? "Switching & Claiming..." : "Switch & Claim USDT.c ↗"}
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
                          <span className="text-gray-400">{d.sourceTx.slice(0, 8)}…</span>
                        )}

                        {d.mintTx && (
                          <>
                            <span className="text-gray-500">|</span>
                            <a
                              href={`${EXPLORER}/tx/${d.mintTx}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5"
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
            <div className="p-8 text-center text-amber-400 text-xs space-y-1">
              <p className="font-bold">Connect your Web3 wallet to view your personal bridge history.</p>
            </div>
          ) : !deposits.filter((d) => !d.recipient || d.recipient.toLowerCase() === address.toLowerCase()).length ? (
            <div className="p-8 text-center text-gray-400 text-xs space-y-1">
              <p className="font-semibold text-gray-300">No bridge deposits indexed for connected wallet ({address.slice(0, 6)}...{address.slice(-4)}) yet.</p>
              <p className="text-[11px] text-gray-500">Deposit source USDT above to start bridging to Polygon Amoy.</p>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
export type AdminTab =
  | "offchain"
  | "liquidity"
  | "controls"
  | "records"
  | "bridge"
  | "migration";
export function AdminOperations({ tab }: { tab: AdminTab }) {
  const { isAdmin, stats, admin, offline, readPackages } = useWeb3();
  const [found, setFound] = useState<Package[]>([]),
    [lookupError, setLookupError] = useState("");
  if (!isAdmin)
    return (
      <Panel title="Administration">
        <p>Connect an account with the on-chain administrator role.</p>
      </Panel>
    );
  const parseSale = (f: FormData): Sale => ({
    buyer: String(f.get("buyer")),
    amount: units(String(f.get("quantity"))),
    value: units(String(f.get("value"))),
    price: units(String(f.get("price"))),
    purchasedAt: Math.floor(
      new Date(String(f.get("purchased"))).getTime() / 1000
    ),
    startedAt: Math.floor(new Date(String(f.get("started"))).getTime() / 1000),
    referenceId: hashId(String(f.get("reference"))),
  });
  return (
    <>
      <Panel title="Treasury and custody">
        <dl>
          <dt>Company treasury</dt>
          <dd>{stats?.treasury}</dd>
          <dt>Fixed supply / unsold inventory</dt>
          <dd>
            {amount(stats?.supply)} / {amount(stats?.inventory)} SZ
          </dd>
          <dt>Custody / package liabilities</dt>
          <dd>
            {amount(stats?.custody)} / {amount(stats?.liabilities)} SZ
          </dd>
          <dt>Admin buyback funding</dt>
          <dd>{amount(stats?.funds)} USDT.c</dd>
        </dl>
      </Panel>
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
        <ActionForm
          title="Record offline sale"
          submit={(f) => offline(parseSale(f))}
        >
          <Field name="buyer" label="Buyer wallet" />
          <div className="columns">
            <Field name="quantity" label="SZ quantity" />
            <Field name="value" label="Original USD value" />
            <Field name="price" label="Original SZ unit price" />
          </div>
          <div className="columns">
            <Field
              name="purchased"
              label="Original purchase date"
              type="datetime-local"
            />
            <Field
              name="started"
              label="Staking start date"
              type="datetime-local"
            />
          </div>
          <Field name="reference" label="Unique offline payment reference" />
        </ActionForm>
      )}
      {tab === "liquidity" && (
        <div className="columns">
          {[
            ["Fund buybacks", "addTreasuryFunds"],
            ["Execute funded buyback", "executeAdminBuyback"],
            ["Return unused funds to treasury", "withdrawTreasuryFunds"],
          ].map(([title, method]) => (
            <ActionForm
              key={method}
              title={title}
              submit={(f) => admin(method, [units(String(f.get("amount")))])}
            >
              <Field name="amount" label="USDT.c amount" />
              <p>
                Administrator buybacks use the same FIFO, price cap and payout
                rules and create no new package.
              </p>
            </ActionForm>
          ))}
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
            {lookupError && <p role="alert">{lookupError}</p>}
            <PackageTable packages={found} />
          </Panel>
          <History all />
        </>
      )}
      {tab === "bridge" && <BridgePanel all />}
    </>
  );
}
