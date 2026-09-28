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
  CheckCircle2,
  XCircle,
  Lock,
  PauseCircle,
  PlayCircle,
  History,
} from "lucide-react";

function EventBadge({ type }: { type: string }) {
  switch (type) {
    case "WalletPaused":
    case "PrimaryWalletPaused":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          Primary Frozen
        </span>
      );
    case "SecondaryWalletPaused":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
          Secondary Frozen
        </span>
      );
    case "WalletUnpaused":
    case "PrimaryWalletUnpaused":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Primary Restored
        </span>
      );
    case "SecondaryWalletUnpaused":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Secondary Restored
        </span>
      );
    case "WalletReplaced":
    case "SecondaryWalletReplaced":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          Wallet Replaced
        </span>
      );
    case "SecondaryWalletConfigured":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Secondary Configured
        </span>
      );
    case "SecondaryWalletUpdated":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Secondary Updated
        </span>
      );
    case "PackageCreated":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Package Created
        </span>
      );
    case "OfflineRecorded":
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Offline Sale
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">
          {type}
        </span>
      );
  }
}

function EventDetailText({ event }: { event: any }) {
  if (event.type?.includes("Paused")) {
    return (
      <span className="text-gray-300 text-xs">
        {event.reason || (event.isPaused ? "Emergency freeze active" : "Restored to active state")}
      </span>
    );
  }
  if (event.type?.includes("Unpaused")) {
    return <span className="text-emerald-400 text-xs">Restored to active status</span>;
  }
  if (event.type?.includes("Replaced")) {
    const pkgs = event.packagesMigrated ?? event.packages_migrated;
    return (
      <span className="text-xs text-blue-300">
        Migrated {pkgs !== undefined ? `${pkgs} package(s)` : "all assets"}
      </span>
    );
  }
  if (event.type === "SecondaryWalletConfigured" || event.type === "SecondaryWalletUpdated") {
    const sec = event.secondaryWallet || event.newSecondaryWallet;
    return sec ? (
      <span className="text-xs font-mono text-purple-300">
        Backup: {sec.slice(0, 8)}...{sec.slice(-4)}
      </span>
    ) : (
      <span className="text-xs text-purple-300">Secondary backup wallet assigned</span>
    );
  }
  if (event.packageId) {
    return <span className="text-xs font-mono font-bold text-white">Staking Package #{event.packageId}</span>;
  }
  return <span className="text-gray-400 text-xs">—</span>;
}

export function AdminWalletReplacementSection() {
  const { readPackages, admin } = useWeb3();

  const [searchWallet, setSearchWallet] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null);

  // Pause / Freeze State
  const [isPausing, setIsPausing] = useState<boolean>(false);
  const [isPausingSecondary, setIsPausingSecondary] = useState<boolean>(false);
  const [pauseReason, setPauseReason] = useState<string>("");
  const [pauseSuccess, setPauseSuccess] = useState<string>("");

  // Replacement Form State
  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [replaceSuccess, setReplaceSuccess] = useState<string>("");
  const [replaceTxHash, setReplaceTxHash] = useState<string>("");
  const [copiedText, setCopiedText] = useState<string>("");

  // Audit Logs & Security Activity
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityActivities, setSecurityActivities] = useState<any[]>([]);
  const [activityFilter, setActivityFilter] = useState<"ALL" | "REPLACEMENTS" | "PAUSED" | "SECONDARY">("ALL");
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const [secData, repData] = await Promise.all([
        api<{ total?: number; activities?: any[] }>("/admin/security-activity").catch(() => null),
        api<{ total?: number; replacements?: any[] }>("/admin/replacements").catch(() => null),
      ]);
      if (secData?.activities) {
        setSecurityActivities(secData.activities);
      }
      if (repData?.replacements) {
        setAuditLogs(repData.replacements);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
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
    setPauseSuccess("");

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
    } catch (err: any) {
      setError(err?.message || "Failed to load user details from protocol service.");
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // 1. EMERGENCY PAUSE / UNPAUSE PRIMARY WALLET (On-Chain + Off-Chain)
  const handleTogglePauseWallet = async (shouldPause: boolean) => {
    if (!userDetails) return;
    const wallet = userDetails.primaryWallet.trim();

    setError("");
    setPauseSuccess("");
    setIsPausing(true);

    try {
      let pauseTxHash = "";
      // 1. Execute on-chain pause / unpause: SZToken.setWalletPaused(wallet, shouldPause)
      if (admin) {
        try {
          const tx: any = await admin("setWalletPaused", [wallet, shouldPause]);
          if (tx) {
            pauseTxHash = tx.hash || "";
            if (tx.wait) await tx.wait();
          }
        } catch (onChainErr: any) {
          console.error("On-chain pause error:", onChainErr);
          throw new Error(onChainErr?.reason || onChainErr?.message || "On-chain pause transaction failed.");
        }
      }

      // 2. Off-chain protocol pause: POST /admin/pause-wallet
      await apiPost("/admin/pause-wallet", {
        wallet,
        isPaused: shouldPause,
        reason: pauseReason || (shouldPause ? "Admin Emergency Freeze" : "Admin Restored"),
        txHash: pauseTxHash,
      });

      setPauseSuccess(
        shouldPause
          ? `Primary wallet ${wallet.slice(0, 8)}... successfully FROZEN / PAUSED on-chain and in protocol records. All token operations, unstaking, and buybacks are halted.`
          : `Primary wallet ${wallet.slice(0, 8)}... successfully UNPAUSED on-chain and restored to active state.`
      );
      setPauseReason("");

      // Update local state
      setUserDetails({
        ...userDetails,
        isPaused: shouldPause,
        pauseInfo: {
          wallet,
          is_paused: shouldPause,
          reason: pauseReason || (shouldPause ? "Admin Emergency Freeze" : "Admin Restored"),
          updated_at: Date.now(),
        },
      });

      // Refresh security logs and user lookup
      await fetchAuditLogs();
      await handleLookup(wallet);
    } catch (err: any) {
      setError(err?.message || "Failed to update wallet pause state.");
    } finally {
      setIsPausing(false);
    }
  };

  // 1b. EMERGENCY PAUSE / UNPAUSE SECONDARY WALLET (On-Chain + Off-Chain)
  const handleTogglePauseSecondaryWallet = async (shouldPause: boolean) => {
    if (!userDetails || !userDetails.secondaryWallet) return;
    const secWallet = userDetails.secondaryWallet.trim();

    setError("");
    setPauseSuccess("");
    setIsPausingSecondary(true);

    try {
      let pauseTxHash = "";
      // 1. Execute on-chain pause / unpause: SZToken.setWalletPaused(secWallet, shouldPause)
      if (admin) {
        try {
          const tx: any = await admin("setWalletPaused", [secWallet, shouldPause]);
          if (tx) {
            pauseTxHash = tx.hash || "";
            if (tx.wait) await tx.wait();
          }
        } catch (onChainErr: any) {
          console.error("On-chain pause error for secondary wallet:", onChainErr);
          throw new Error(onChainErr?.reason || onChainErr?.message || "On-chain pause transaction failed for secondary wallet.");
        }
      }

      // 2. Off-chain protocol pause: POST /admin/pause-wallet
      await apiPost("/admin/pause-wallet", {
        wallet: secWallet,
        isPaused: shouldPause,
        reason: shouldPause ? "Secondary Wallet Emergency Freeze" : "Secondary Wallet Restored",
        txHash: pauseTxHash,
      });

      setPauseSuccess(
        shouldPause
          ? `Secondary backup wallet ${secWallet.slice(0, 8)}... successfully FROZEN / PAUSED on-chain and recorded.`
          : `Secondary backup wallet ${secWallet.slice(0, 8)}... successfully UNPAUSED on-chain and restored to active state.`
      );

      // Update local state
      setUserDetails({
        ...userDetails,
        isSecondaryPaused: shouldPause,
        secondaryPauseInfo: {
          wallet: secWallet,
          is_paused: shouldPause,
          reason: shouldPause ? "Secondary Wallet Emergency Freeze" : "Secondary Wallet Restored",
          updated_at: Date.now(),
        },
      });

      // Refresh security logs and user lookup
      await fetchAuditLogs();
      await handleLookup(userDetails.primaryWallet);
    } catch (err: any) {
      setError(err?.message || "Failed to update secondary wallet pause state.");
    } finally {
      setIsPausingSecondary(false);
    }
  };

  // 2. EXECUTE WALLET REPLACEMENT (On-Chain + Off-Chain)
  const handleExecuteReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails || !userDetails.secondaryWallet) return;

    const oldWallet = userDetails.primaryWallet.trim();
    const newWallet = userDetails.secondaryWallet.trim();

    setError("");
    setReplaceSuccess("");
    setReplaceTxHash("");

    if (!confirmCheckbox) {
      setError("Please confirm the authorization checkbox before executing replacement.");
      return;
    }

    setIsReplacing(true);
    try {
      let txHash = "";

      // 1. Execute on-chain replacement: SZToken.replaceWallet(old, new)
      if (admin) {
        try {
          const tx: any = await admin("replaceWallet", [oldWallet, newWallet]);
          if (tx) {
            txHash = tx.hash || "";
            setReplaceTxHash(txHash);
            if (tx.wait) await tx.wait();
          }
        } catch (onChainErr: any) {
          console.error("On-chain replacement error:", onChainErr);
          throw new Error(onChainErr?.reason || onChainErr?.message || "On-chain replacement transaction failed.");
        }
      }

      const finalTxHash = txHash || `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 2. Synchronize replacement in protocol records: POST /admin/replace-wallet
      await apiPost("/admin/replace-wallet", {
        oldWallet,
        newWallet,
        txHash: finalTxHash,
        packagesMigrated: userDetails.packageCount,
      });

      setReplaceSuccess(
        `Successfully executed on-chain and database wallet replacement! All ${userDetails.packageCount} staking package(s) and balances have been migrated to ${newWallet}.`
      );
      setConfirmCheckbox(false);

      // Refresh logs
      await fetchAuditLogs();

      // Refresh user details for the new wallet
      await handleLookup(newWallet);
    } catch (err: any) {
      setError(err?.message || "Wallet replacement failed.");
    } finally {
      setIsReplacing(false);
    }
  };

  const hasRecordedSecondary = Boolean(
    userDetails?.secondaryWallet &&
    userDetails.secondaryWallet !== "0x0000000000000000000000000000000000000000"
  );
  const isWalletPaused = Boolean(userDetails?.isPaused);

  // Unified list of all security audit entries
  const combinedAuditItems = React.useMemo(() => {
    const list: any[] = [...securityActivities];
    for (const rep of auditLogs) {
      const exists = list.some(
        (a) =>
          a.type?.includes("Replaced") &&
          (a.oldWallet?.toLowerCase() === rep.old_wallet?.toLowerCase() ||
           a.old_wallet?.toLowerCase() === rep.old_wallet?.toLowerCase())
      );
      if (!exists) {
        list.push({
          id: `rep_${rep.id}`,
          type: "WalletReplaced",
          timestamp: rep.timestamp,
          primaryWallet: rep.old_wallet,
          secondaryWallet: rep.new_wallet,
          oldWallet: rep.old_wallet,
          newWallet: rep.new_wallet,
          packagesMigrated: rep.packages_migrated,
          txHash: rep.tx_hash,
        });
      }
    }
    return list.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  }, [securityActivities, auditLogs]);

  const filteredAuditItems = React.useMemo(() => {
    switch (activityFilter) {
      case "REPLACEMENTS":
        return combinedAuditItems.filter((item) => item.type?.includes("Replaced"));
      case "PAUSED":
        return combinedAuditItems.filter((item) => item.type?.includes("Pause"));
      case "SECONDARY":
        return combinedAuditItems.filter((item) => item.type?.includes("Secondary"));
      default:
        return combinedAuditItems;
    }
  }, [combinedAuditItems, activityFilter]);

  const counts = React.useMemo(() => ({
    all: combinedAuditItems.length,
    replacements: combinedAuditItems.filter((i) => i.type?.includes("Replaced")).length,
    paused: combinedAuditItems.filter((i) => i.type?.includes("Pause")).length,
    secondary: combinedAuditItems.filter((i) => i.type?.includes("Secondary")).length,
  }), [combinedAuditItems]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#131926] to-[#0B0E14] border border-red-500/25 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-[#E3262E] text-xs font-bold border border-red-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Emergency Recovery & Freeze Console</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Primary Wallet Replacement & Emergency Freeze
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Lookup any user by their primary wallet address. If the user recorded a secondary wallet, you can execute a full primary wallet replacement. If no secondary wallet is recorded, you can <strong>only pause / freeze</strong> the primary wallet.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void fetchAuditLogs()}
              disabled={loadingLogs}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
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
            className="px-6 py-3.5 bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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

        {pauseSuccess && (
          <div
            role="status"
            className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{pauseSuccess}</span>
          </div>
        )}



        {replaceSuccess && (
          <div
            role="status"
            className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="space-y-1">
              <span className="font-bold">{replaceSuccess}</span>
              {replaceTxHash && (
                <div className="font-mono text-[11px] text-gray-300">
                  Transaction: <a href={`${EXPLORER}/tx/${replaceTxHash}`} target="_blank" rel="noreferrer" className="underline text-emerald-300">{replaceTxHash}</a>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. User Details Presentation */}
      {userDetails && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isWalletPaused
              ? "bg-red-500/15 border-red-500/40 text-red-200"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isWalletPaused ? "bg-red-500/30 text-red-400" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                {isWalletPaused ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider block">
                  Primary Wallet Status: {isWalletPaused ? "PAUSED / FROZEN" : "ACTIVE"}
                </span>
                <span className="text-xs text-gray-300">
                  {isWalletPaused
                    ? "Emergency freeze is active. All transfers, package claims, and payouts are suspended."
                    : "Wallet is operational and eligible for protocol transactions."}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isWalletPaused ? (
                <button
                  type="button"
                  onClick={() => void handleTogglePauseWallet(false)}
                  disabled={isPausing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{isPausing ? "Restoring..." : "Unpause Primary Wallet"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleTogglePauseWallet(true)}
                  disabled={isPausing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>{isPausing ? "Pausing..." : "Pause Primary Wallet"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Wallet Card */}
            <div className="bg-[#111520] rounded-3xl p-6 space-y-4 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E3262E]"></span>
                  Primary User Wallet
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                  isWalletPaused
                    ? "bg-red-500/20 border-red-500/40 text-red-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}>
                  {isWalletPaused ? "FROZEN" : "ACTIVE"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                  {userDetails.primaryWallet}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(userDetails.primaryWallet)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer flex items-center justify-center !shadow-none"
                    title="Copy Address"
                  >
                    {copiedText === userDetails.primaryWallet ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                  <a
                    href={`${EXPLORER}/address/${userDetails.primaryWallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer flex items-center justify-center !shadow-none"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-300" />
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

              {/* Pause reason display if paused */}
              {isWalletPaused && userDetails.pauseInfo?.reason && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300">
                  <span className="font-bold block text-[11px] uppercase tracking-wide">Freeze Reason:</span>
                  <span>{userDetails.pauseInfo.reason}</span>
                </div>
              )}
            </div>

            {/* Submitted Secondary Wallet Card */}
            <div className="bg-[#111520] rounded-3xl p-6 space-y-4 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Secondary Backup Wallet
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    !hasRecordedSecondary
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : userDetails.isSecondaryPaused
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {!hasRecordedSecondary
                    ? "NOT RECORDED"
                    : userDetails.isSecondaryPaused
                    ? "FROZEN / PAUSED"
                    : userDetails.secondaryWalletStatus || "ACTIVE"}
                </span>
              </div>

              {hasRecordedSecondary ? (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
                    userDetails.isSecondaryPaused
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-emerald-500/5 border-emerald-500/20"
                  }`}>
                    <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                      {userDetails.secondaryWallet}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(userDetails.secondaryWallet!)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer flex items-center justify-center !shadow-none"
                        title="Copy Address"
                      >
                        {copiedText === userDetails.secondaryWallet ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                      <a
                        href={`${EXPLORER}/address/${userDetails.secondaryWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer flex items-center justify-center !shadow-none"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-300" />
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0B0E14] rounded-xl border border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Recorded Status:</span>
                      <span className="font-semibold text-emerald-400">
                        {userDetails.onChainSecondaryWallet ? "Verified On-Chain & Database" : "Recorded In Protocol Database"}
                      </span>
                    </div>
                    {userDetails.updatedAt && (
                      <div className="flex justify-between text-gray-400">
                        <span>Recorded At:</span>
                        <span className="text-gray-200">
                          {new Date(userDetails.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {userDetails.isSecondaryPaused && userDetails.secondaryPauseInfo?.reason && (
                      <div className="flex justify-between text-red-400 pt-1 border-t border-white/5">
                        <span>Freeze Reason:</span>
                        <span className="font-bold">{userDetails.secondaryPauseInfo.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Freeze / Unpause Secondary Backup Wallet Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => void handleTogglePauseSecondaryWallet(!userDetails.isSecondaryPaused)}
                      disabled={isPausingSecondary}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        userDetails.isSecondaryPaused
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-red-600/80 hover:bg-red-600 text-white border border-red-500/40"
                      }`}
                    >
                      {isPausingSecondary ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Updating Secondary State...</span>
                        </>
                      ) : userDetails.isSecondaryPaused ? (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>Unpause Secondary Backup Wallet</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          <span>Freeze / Pause Secondary Backup Wallet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* USER HAS NOT RECORDED SECONDARY WALLET: STRICT PROTOCOL RULE APPLIED */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                      <span>No Secondary Wallet Recorded by User</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      This user has <strong>not recorded a secondary backup wallet</strong>. Under protocol security policy:
                    </p>
                    <ul className="list-disc list-inside text-gray-300 space-y-1 pl-1">
                      <li>Administrators <strong className="text-red-400">cannot replace</strong> this primary wallet.</li>
                      <li>Administrators <strong className="text-red-400">cannot assign</strong> an arbitrary secondary wallet.</li>
                      <li>In case of loss or emergency compromise, administrators <strong className="text-emerald-400">can only pause / freeze</strong> this primary wallet.</li>
                    </ul>
                  </div>

                  {/* Prominent Emergency Pause Option for Unrecorded User */}
                  <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>Permitted Emergency Action: Primary Wallet Freeze</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      If this account was reported compromised, pause the primary wallet to prevent unauthorized package unstaking or reward drainage.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleTogglePauseWallet(!isWalletPaused)}
                      disabled={isPausing}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isWalletPaused
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-red-600 hover:bg-red-500 text-white"
                      }`}
                    >
                      {isWalletPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      <span>{isWalletPaused ? "Unpause Primary Wallet" : "Freeze / Pause Primary Wallet"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Packages Table */}
          {userDetails.packages && userDetails.packages.length > 0 && (
            <div className="bg-[#111520] rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
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

          {/* User Activity & Security History Timeline */}
          {userDetails.events && userDetails.events.length > 0 && (
            <div className="bg-[#111520] rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E3262E]" />
                  <span>User Activity & Security History ({userDetails.events.length})</span>
                </h4>
                <span className="text-[11px] text-gray-400">
                  Includes freezes, unpauses, replacement, and secondary wallet events
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-sans">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Details / Target</th>
                      <th className="py-2.5 px-3">On-Chain Tx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {userDetails.events.map((ev: any, idx: number) => {
                      const date = ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "—";
                      return (
                        <tr key={ev.id || idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-sans text-gray-400 text-[11px]">{date}</td>
                          <td className="py-3 px-3">
                            <EventBadge type={ev.type} />
                          </td>
                          <td className="py-3 px-3 text-gray-300 font-sans text-xs">
                            <EventDetailText event={ev} />
                          </td>
                          <td className="py-3 px-3">
                            {ev.txHash ? (
                              <a
                                href={`${EXPLORER}/tx/${ev.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-300 hover:text-white underline inline-flex items-center gap-1 text-[11px]"
                              >
                                <span>{ev.txHash.slice(0, 8)}...</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-500 font-sans text-[11px]">Database Record</span>
                            )}
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
          {userDetails.secondaryWalletStatus === "REPLACED" ? (
            <div className="p-6 rounded-3xl bg-[#111520] border-2 border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Wallet Replacement Already Completed
                  </h3>
                  <p className="text-xs text-gray-300">
                    This primary account was successfully migrated to{" "}
                    <span className="font-mono text-emerald-300 font-bold">{userDetails.secondaryWallet}</span>. All on-chain packages, permissions, and balances now belong to the replacement wallet.
                  </p>
                </div>
              </div>
            </div>
          ) : hasRecordedSecondary ? (
            /* User recorded secondary wallet -> REPLACEMENT IS ENABLED */
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c1214] via-[#111520] to-[#0B0E14] border-2 border-red-500/40 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[#E3262E]">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Execute Wallet Replacement by Recorded Secondary Wallet
                  </h3>
                  <p className="text-xs text-gray-300">
                    Transfers all {userDetails.packageCount} on-chain packages, balances, and off-chain deposits to the recorded backup wallet.
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
                  1. <strong>On-Chain Migration:</strong> Executes <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">SZToken.replaceWallet(old, new)</code>. All packages, active queues, and held SZ tokens are permanently reassigned to the verified secondary wallet.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  2. <strong>Off-Chain Synchronization:</strong> Automatically migrates verified bridge deposits, event history, and database secondary wallet mapping.
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
                      <span>Target Secondary Wallet (Verified by User)</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        ✓ User Recorded
                      </span>
                    </label>
                    <input
                      type="text"
                      value={userDetails.secondaryWallet!}
                      readOnly
                      className="w-full bg-[#0B0E14]/80 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 font-mono text-xs sm:text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <label
                  htmlFor="confirm-replacement"
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0B0E14] border border-white/15 hover:border-white/25 transition-all cursor-pointer select-none"
                >
                  <input
                    id="confirm-replacement"
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    className="w-5 h-5 rounded-md border-white/20 bg-black text-[#E3262E] focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0 accent-[#E3262E]"
                  />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-white text-xs sm:text-sm block">
                      I confirm and authorize this permanent wallet replacement
                    </span>
                    <span className="text-[11px] text-gray-400 block leading-relaxed">
                      This action permanently moves all {userDetails.packageCount} staking packages and rights to{" "}
                      <span className="font-mono text-emerald-300 font-semibold">{userDetails.secondaryWallet}</span>. This operation is irreversible.
                    </span>
                  </div>
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isReplacing || !confirmCheckbox}
                    className="w-full py-4 px-6 bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-[#E3262E]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isReplacing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Executing On-Chain & Off-Chain Migration...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        <span>Confirm & Execute Wallet Replacement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* User did NOT record secondary wallet -> REPLACEMENT IS LOCKED */
            <div className="p-6 rounded-3xl bg-[#111520] border border-white/10 shadow-xl space-y-4 opacity-75">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-400 flex items-center gap-2">
                    <span>Wallet Replacement Locked</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                      Secondary Wallet Required
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cannot execute wallet replacement because user has not recorded a secondary wallet.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-400 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  Per protocol security requirements, administrators can only replace primary wallets to a pre-recorded secondary wallet submitted by the user. If the primary wallet is compromised, use the <strong>Pause Primary Wallet</strong> action above.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Audit Trail */}
      <section className="bg-[#111520]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#E3262E]" />
              <span>Security, Freeze & Wallet Replacement Audit Trail</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Live ledger of wallet replacements, freeze/unpause events, and secondary backup configurations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0E14] p-1 rounded-2xl border border-white/10 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActivityFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activityFilter === "ALL"
                  ? "bg-[#E3262E] text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter("REPLACEMENTS")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activityFilter === "REPLACEMENTS"
                  ? "bg-[#E3262E] text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Replacements ({counts.replacements})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter("PAUSED")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activityFilter === "PAUSED"
                  ? "bg-[#E3262E] text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Freezes & Unpauses ({counts.paused})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter("SECONDARY")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activityFilter === "SECONDARY"
                  ? "bg-[#E3262E] text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Secondary Wallets ({counts.secondary})
            </button>
          </div>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Loading security ledger...</span>
          </div>
        ) : filteredAuditItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No events recorded under this filter yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-sans">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Primary / Target Wallet</th>
                  <th className="py-2.5 px-3">Secondary / Target</th>
                  <th className="py-2.5 px-3">Details / Status</th>
                  <th className="py-2.5 px-3">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAuditItems.map((log: any, idx: number) => {
                  const date = log.timestamp ? new Date(log.timestamp).toLocaleString() : "—";
                  const prim = log.primaryWallet || log.old_wallet || log.oldWallet || log.wallet || "—";
                  const sec = log.secondaryWallet || log.new_wallet || log.newWallet || log.newSecondaryWallet || "—";
                  return (
                    <tr key={log.id || idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-sans text-gray-400 text-[11px] whitespace-nowrap">{date}</td>
                      <td className="py-3 px-3">
                        <EventBadge type={log.type} />
                      </td>
                      <td className="py-3 px-3 text-red-300 break-all">
                        {prim !== "—" ? `${prim.slice(0, 8)}...${prim.slice(-4)}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-emerald-300 break-all">
                        {sec !== "—" ? `${sec.slice(0, 8)}...${sec.slice(-4)}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-gray-300 font-sans text-xs">
                        <EventDetailText event={log} />
                      </td>
                      <td className="py-3 px-3">
                        {log.txHash || log.tx_hash ? (
                          <a
                            href={`${EXPLORER}/tx/${log.txHash || log.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-300 hover:text-white underline inline-flex items-center gap-1 text-[11px]"
                          >
                            <span>{(log.txHash || log.tx_hash).slice(0, 8)}...</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-500 font-sans text-[11px]">Database Record</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
