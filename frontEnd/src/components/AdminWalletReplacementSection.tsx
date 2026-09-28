import React, { useState, useEffect } from "react";
import { isAddress } from "ethers";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import { api, apiPost, type UserDetailsResponse } from "../services/api";
import { EXPLORER } from "../constants/contracts";
import {
  Search,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Package as PackageIcon,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export function AdminWalletReplacementSection() {
  const { admin, readPackages } = useWeb3();

  const [searchWallet, setSearchWallet] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null);

  // Replacement Form State
  const [replacementTarget, setReplacementTarget] = useState<string>("");
  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [replaceSuccess, setReplaceSuccess] = useState<string>("");
  const [replaceTxHash, setReplaceTxHash] = useState<string>("");
  const [copiedText, setCopiedText] = useState<string>("");

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      // Look up replacements from backend
      const data = await api<{
        primaryWallet?: string;
        replacements?: any[];
      }>("/admin/user-details/0x0000000000000000000000000000000000000000").catch(() => null);
      if (data?.replacements) {
        setAuditLogs(data.replacements);
      }
    } catch {}
    setLoadingLogs(false);
  };

  useEffect(() => {
    void fetchAuditLogs();
  }, []);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleLookup = async (walletToSearch?: string) => {
    const target = (walletToSearch ?? searchWallet).trim();
    setError("");
    setReplaceSuccess("");
    setReplaceTxHash("");

    if (!target) {
      setError("Please enter a user primary wallet address.");
      return;
    }

    if (!isAddress(target)) {
      setError("Invalid EVM wallet address. Please check and try again.");
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch user details from API
      const details = await api<UserDetailsResponse>(`/admin/user-details/${target}`);

      // 2. Fetch fresh on-chain packages
      let onChainPkgs = details.packages;
      try {
        onChainPkgs = await readPackages(target);
      } catch {}

      const mergedDetails: UserDetailsResponse = {
        ...details,
        packages: onChainPkgs,
        packageCount: onChainPkgs.length,
      };

      setUserDetails(mergedDetails);

      // Pre-fill replacement target with submitted secondary wallet if available
      if (mergedDetails.secondaryWallet) {
        setReplacementTarget(mergedDetails.secondaryWallet);
      } else {
        setReplacementTarget("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load user details from protocol service.");
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails) return;

    const oldWallet = userDetails.primaryWallet.trim();
    const newWallet = replacementTarget.trim();

    setError("");
    setReplaceSuccess("");
    setReplaceTxHash("");

    if (!isAddress(newWallet)) {
      setError("Target secondary wallet must be a valid EVM address.");
      return;
    }

    if (oldWallet.toLowerCase() === newWallet.toLowerCase()) {
      setError("New wallet cannot be identical to the old primary wallet.");
      return;
    }

    if (!confirmCheckbox) {
      setError("Please confirm the authorization checkbox before executing replacement.");
      return;
    }

    setIsReplacing(true);
    try {
      // 1. ON-CHAIN TRANSACTION: sz.replaceWallet(oldWallet, newWallet)
      const receipt = await admin("replaceWallet", [oldWallet, newWallet]);
      const txHash = receipt.hash;
      setReplaceTxHash(txHash);

      // 2. OFF-CHAIN BACKEND SYNC: apiPost('/admin/replace-wallet')
      await apiPost("/admin/replace-wallet", {
        oldWallet,
        newWallet,
        txHash,
        packagesMigrated: userDetails.packageCount,
      });

      setReplaceSuccess(
        `Successfully replaced primary wallet with secondary wallet both ON-CHAIN and OFF-CHAIN! ${userDetails.packageCount} packages migrated.`
      );
      setConfirmCheckbox(false);

      // Refresh logs
      await fetchAuditLogs();

      // Refresh user details to show new state
      await handleLookup(newWallet);
    } catch (err: any) {
      setError(err?.message || "Wallet replacement transaction failed.");
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/30 via-[#131926] to-[#0B0E14] border border-red-500/25 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-[#E3262E] text-xs font-bold border border-red-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Recovery Console</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Primary Wallet Replacement by Secondary Wallet
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Lookup any user by their primary wallet address to view full staking details, submitted backup wallets, and execute comprehensive on-chain and off-chain wallet replacement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchAuditLogs()}
              disabled={loadingLogs}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 border border-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
              <span>Refresh Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Dedicated Search / Lookup Form */}
      <section className="bg-[#111520]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-[#E3262E]" />
          <span>Lookup User by Primary Wallet Address</span>
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleLookup();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchWallet}
              onChange={(e) => setSearchWallet(e.target.value)}
              placeholder="Enter user primary wallet address (0x...)"
              className="w-full bg-[#0B0E14] border border-white/15 rounded-2xl px-4 py-3.5 text-white font-mono text-xs sm:text-sm focus:border-[#E3262E] focus:outline-none transition-colors pr-20"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) setSearchWallet(clip.trim());
                } catch {}
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-gray-300 transition-colors"
            >
              Paste
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !searchWallet}
            className="px-6 py-3.5 bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching Protocol...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Lookup User</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-200 text-xs flex items-center gap-2.5"
          >
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}
      </section>

      {/* 2. User Details Presentation */}
      {userDetails && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Wallet Card */}
            <div className="lumix-card rounded-3xl p-6 space-y-4 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E3262E]"></span>
                  Primary User Wallet
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-gray-300">
                  {userDetails.packageCount > 0 ? "Active Staker" : "No Packages"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                  {userDetails.primaryWallet}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(userDetails.primaryWallet)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Copy Address"
                  >
                    {copiedText === userDetails.primaryWallet ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`${EXPLORER}/address/${userDetails.primaryWallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Total Packages
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {userDetails.packageCount}
                  </span>
                </div>
                <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Active Packages
                  </span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {userDetails.activePackages}
                  </span>
                </div>
                <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    SZ Balance
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {(Number(userDetails.szBalance || 0) / 1e6).toLocaleString()} SZ
                  </span>
                </div>
              </div>
            </div>

            {/* Submitted Secondary Wallet Card */}
            <div className="lumix-card rounded-3xl p-6 space-y-4 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Registered Secondary Wallet
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    userDetails.secondaryWallet
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {userDetails.secondaryWallet
                    ? userDetails.secondaryWalletStatus || "ACTIVE"
                    : "NOT SUBMITTED"}
                </span>
              </div>

              {userDetails.secondaryWallet ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                    <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                      {userDetails.secondaryWallet}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(userDetails.secondaryWallet!)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Copy Address"
                      >
                        {copiedText === userDetails.secondaryWallet ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={`${EXPLORER}/address/${userDetails.secondaryWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>On-Chain Status:</span>
                      <span className="font-semibold text-white">
                        {userDetails.onChainSecondaryWallet ? (
                          <span className="text-emerald-400">Verified On Smart Contract</span>
                        ) : (
                          <span className="text-amber-400">Database Record (Ready for On-Chain Migration)</span>
                        )}
                      </span>
                    </div>
                    {userDetails.updatedAt && (
                      <div className="flex justify-between text-gray-400">
                        <span>Submitted At:</span>
                        <span className="text-gray-200">
                          {new Date(userDetails.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>No Secondary Wallet Submitted by User Yet</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    This user has not submitted a secondary backup wallet through their dashboard. As an administrator, you may manually specify a verified secondary replacement address below after completing manual off-band verification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Packages Table */}
          {userDetails.packages && userDetails.packages.length > 0 && (
            <div className="lumix-card rounded-3xl p-6 border border-white/10 space-y-4">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <PackageIcon className="w-4 h-4 text-[#E3262E]" />
                <span>User Staking Packages ({userDetails.packages.length})</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Pkg ID</th>
                      <th className="py-2.5 px-3">Amount (SZ)</th>
                      <th className="py-2.5 px-3">Paid (USDT)</th>
                      <th className="py-2.5 px-3">Bought Back</th>
                      <th className="py-2.5 px-3">Start Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {userDetails.packages.map((pkg: any) => {
                      const id = String(pkg.id);
                      const amount = Number(pkg.amount || 0) / 1e6;
                      const val = Number(pkg.purchaseValue || 0) / 1e6;
                      const bought = Number(pkg.boughtBack || 0) / 1e6;
                      const date = pkg.startTimestamp
                        ? new Date(Number(pkg.startTimestamp) * 1000).toLocaleDateString()
                        : "—";
                      const isComplete = pkg.boughtBack === pkg.amount && pkg.amount > 0;
                      return (
                        <tr key={id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">#{id}</td>
                          <td className="py-3 px-3 text-gray-200">{amount.toLocaleString()} SZ</td>
                          <td className="py-3 px-3 text-emerald-400">${val.toLocaleString()}</td>
                          <td className="py-3 px-3 text-gray-300">{bought.toLocaleString()} SZ</td>
                          <td className="py-3 px-3 text-gray-400 font-sans">{date}</td>
                          <td className="py-3 px-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isComplete
                                  ? "bg-gray-500/20 text-gray-300"
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {isComplete ? "Completed" : "Active"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. DEDICATED REPLACEMENT ACTION FORM */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c1214] via-[#111520] to-[#0B0E14] border-2 border-red-500/40 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[#E3262E]">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Execute Wallet Replacement
                </h3>
                <p className="text-xs text-gray-300">
                  Transfers on-chain package custody and updates off-chain deposits and records.
                </p>
              </div>
            </div>

            {/* Impact Notification */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Atomic Dual Replacement (On-Chain + Off-Chain)
              </span>
              <p className="text-gray-300 leading-relaxed">
                1. <strong>On-Chain Migration:</strong> Executes <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">SZToken.replaceWallet(old, new)</code>. All {userDetails.packageCount} packages, active queues, and token balances are permanently reassigned to the secondary wallet. Subsequent buybacks (USDT and ET) will pay out to the new wallet.
              </p>
              <p className="text-gray-300 leading-relaxed">
                2. <strong>Off-Chain Synchronization:</strong> Automatically migrates verified bridge deposits, event history, and secondary wallet mapping in the backend database.
              </p>
            </div>

            <form onSubmit={handleExecuteReplacement} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Current Primary Wallet (To Be Replaced)
                  </label>
                  <input
                    type="text"
                    value={userDetails.primaryWallet}
                    readOnly
                    className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-4 py-3 text-gray-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                    <span>New Target Secondary Wallet</span>
                    {userDetails.secondaryWallet && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        ✓ User Submitted
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={replacementTarget}
                    onChange={(e) => setReplacementTarget(e.target.value.trim())}
                    placeholder="0x..."
                    required
                    className="w-full bg-[#0B0E14] border border-white/20 focus:border-[#E3262E] rounded-xl px-4 py-3 text-white font-mono text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <input
                  id="admin-confirm-replacement"
                  type="checkbox"
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-700 text-[#E3262E] focus:ring-[#E3262E] cursor-pointer"
                />
                <label
                  htmlFor="admin-confirm-replacement"
                  className="text-xs text-gray-300 cursor-pointer select-none space-y-0.5"
                >
                  <span className="font-bold text-white block">
                    I confirm verification of this user identity and authorize complete on-chain and off-chain replacement.
                  </span>
                  <span className="text-[11px] text-gray-400 block">
                    This action updates contract state on Polygon Amoy and reassigns all buyback payouts to the secondary wallet.
                  </span>
                </label>
              </div>

              {/* Execution Status Feedback */}
              {replaceSuccess && (
                <div
                  role="status"
                  className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs space-y-2"
                >
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Replacement Successfully Executed!</span>
                  </div>
                  <p className="text-gray-200">{replaceSuccess}</p>
                  {replaceTxHash && (
                    <div className="pt-1 flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-gray-400">On-Chain Tx:</span>
                      <a
                        href={`${EXPLORER}/tx/${replaceTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline inline-flex items-center gap-1"
                      >
                        <span>{replaceTxHash.slice(0, 16)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isReplacing ||
                  !confirmCheckbox ||
                  !replacementTarget ||
                  replacementTarget.toLowerCase() === userDetails.primaryWallet.toLowerCase()
                }
                className="w-full py-4 bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-[#E3262E]/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isReplacing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing On-Chain & Off-Chain Replacement...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span>Execute Full Wallet Replacement</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Replacement Audit Logs & History */}
      <section className="bg-[#111520]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#E3262E]" />
            <span>Wallet Replacement Audit Trail</span>
          </h3>
          <span className="text-xs text-gray-400">
            {auditLogs.length} total replacements recorded
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            No wallet replacements have been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-sans">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Original Primary Wallet</th>
                  <th className="py-2.5 px-3">New Secondary Wallet</th>
                  <th className="py-2.5 px-3">Pkgs Migrated</th>
                  <th className="py-2.5 px-3">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-gray-400 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-red-300">
                      {log.old_wallet.slice(0, 8)}...{log.old_wallet.slice(-6)}
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold">
                      {log.new_wallet.slice(0, 8)}...{log.new_wallet.slice(-6)}
                    </td>
                    <td className="py-3 px-3 text-white">
                      {log.packages_migrated ?? "—"}
                    </td>
                    <td className="py-3 px-3">
                      {log.tx_hash ? (
                        <a
                          href={`${EXPLORER}/tx/${log.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1"
                        >
                          <span>{log.tx_hash.slice(0, 8)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
