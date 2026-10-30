import { CHAIN_ID, EXPLORER, ADDRESSES } from "../constants/contracts";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { StakingPackagesSection } from "../components/StakingPackagesSection";
import { EcosystemRewardsSection } from "../components/EcosystemRewardsSection";
import { TransactionHistorySection } from "../components/TransactionHistorySection";
import { UserPortfolioCharts } from "../components/UserPortfolioCharts";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import {
  User,
  Lock,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Shield,
  Activity,
  Award,
  DollarSign,
  Layers,
  LayoutDashboard,
  History,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const {
    walletState,
    protocolStats,
    userPackages,
    ready,
    stats,
    secondaryWallet,
    secondaryWalletStatus,
    isSecondaryWallet,
    primaryWalletForSecondary,
    openSecondaryWalletModal,
    isWalletPaused,
    walletPauseReason,
    isWalletMigrated,
    migratedToWallet,
    connectWallet,
  } = useWeb3();
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "overview" | "packages" | "rewards" | "history"
  >("overview");

  const formatTokens = (val: bigint) => {
    const raw = val;
    return (Number(raw) / 1e6).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const formatUSD = (val: bigint) => {
    const raw = val;
    return (Number(raw) / 1e6).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    });
  };

  const rawPriceBig = protocolStats.currentPriceUSD;
  const currentPriceUSD = Number(rawPriceBig) / 1e6;

  // On-Chain Staking Totals against Wallet
  const totalStakedUSD =
    userPackages.reduce((sum, p) => sum + Number(p.stakedAmountUSD), 0) / 1e6;
  const totalStakedSZ =
    userPackages.reduce((sum, p) => sum + Number(p.currentStakedSZ), 0) / 1e6;

  // Wallet Guard
  if (!walletState.isConnected) {
    return (
      <>
        <div className="w-full py-16 flex flex-col items-center justify-center animate-fade-in">
          <div className="lumix-card rounded-3xl p-8 sm:p-12 text-center max-w-xl space-y-6 relative overflow-hidden">
            <div className="page-num mb-2">[01 // WALLET GUARD]</div>
            <div className="w-16 h-16 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A] mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="label">PORTFOLIO ACCESS</div>
              <h2 className="d-md text-[var(--ink)]">
                Wallet Connection Required
              </h2>
              <p className="text-[var(--mid)] text-sm sm:text-base leading-relaxed font-body font-medium">
                Connect your Web3 wallet to access your dashboard, package
                manager, rewards ledger, and transaction logs.
              </p>
            </div>

            <button
              onClick={connectWallet}
              className="btn btn-red w-full py-4 text-sm sm:text-base font-bold"
            >
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet to Access Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!ready)
    return (
      <div className="lumix-card rounded-3xl p-8 text-[var(--mid)] font-mono text-sm">
        Package data is unavailable. Reconnect or refresh when the protocol is
        available.
      </div>
    );

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {isWalletMigrated ? (
        <div className="lumix-card rounded-3xl p-6 border-2 border-red-500/50 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/40 rounded-2xl shrink-0">
              <AlertTriangle className="w-7 h-7 text-red-700 dark:text-red-300" />
            </div>
            <div>
              <div className="font-cond font-bold text-base uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-2">
                <span>Account Permanently Replaced & Frozen</span>
                <span className="px-2.5 py-0.5 rounded text-xs bg-red-200 dark:bg-red-500/25 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-500/40 font-mono font-bold">
                  MIGRATED
                </span>
              </div>
              <p className="text-sm text-red-900 dark:text-red-200 font-body mt-1 leading-relaxed font-medium">
                All staking packages, token holdings, and protocol operations have been securely transferred to verified recovery wallet{" "}
                <span className="font-mono text-red-950 dark:text-white font-bold break-all underline decoration-red-400">
                  {migratedToWallet || secondaryWallet}
                </span>
                . This address is permanently frozen and no longer holds active packages.
              </p>
            </div>
          </div>
          {(migratedToWallet || secondaryWallet) && (
            <div className="px-4 py-2.5 rounded-xl text-sm font-cond font-bold bg-red-100 dark:bg-red-500/20 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-500/40 shrink-0 self-start sm:self-center font-mono">
              Migrated to: {(migratedToWallet || secondaryWallet)?.slice(0, 6)}...{(migratedToWallet || secondaryWallet)?.slice(-4)}
            </div>
          )}
        </div>
      ) : isWalletPaused ? (
        <div className="lumix-card rounded-3xl p-6 border-2 border-red-500/40 bg-red-50 dark:bg-red-950/30 text-red-950 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/30 rounded-2xl shrink-0">
              <AlertTriangle className="w-7 h-7 text-red-700 dark:text-red-300" />
            </div>
            <div>
              <div className="font-cond font-bold text-base uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-2">
                <span>Wallet Operations Frozen / Paused</span>
                <span className="px-2.5 py-0.5 rounded text-xs bg-red-200 dark:bg-red-500/20 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-500/40 font-mono font-bold">
                  Protocol Security Freeze
                </span>
              </div>
              <p className="text-sm text-red-900 dark:text-red-200 font-body mt-1 leading-relaxed font-medium">
                {walletPauseReason ||
                  "This wallet has been paused by the protocol administrator. Operations including package acquisitions, staking rewards, and buyback distributions are halted."}
              </p>
            </div>
          </div>
          {secondaryWallet && secondaryWalletStatus === "ACTIVE" && (
            <div className="px-4 py-2.5 rounded-xl text-sm font-cond font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 shrink-0 self-start sm:self-center font-mono">
              Active Backup: {secondaryWallet.slice(0, 6)}...{secondaryWallet.slice(-4)}
            </div>
          )}
        </div>
      ) : null}

      {/* 1. TOP USER PORTFOLIO HEADER */}
      <div className="lumix-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="page-num mb-3">[PORTFOLIO // OVERVIEW]</div>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A] font-bold text-2xl shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  CONNECTED
                </div>
                {walletState.isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8B1A1A]/20 hover:bg-[#8B1A1A]/30 text-[#8B1A1A] dark:text-red-400 border border-[#8B1A1A]/40 rounded-full text-xs font-cond font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#8B1A1A] dark:text-red-400" />
                    <span>Admin Portal ↗</span>
                  </Link>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] font-mono mt-1.5 tracking-tight break-all">
                {walletState.address
                  ? `${walletState.address.substring(
                    0,
                    10
                  )}...${walletState.address.substring(
                    walletState.address.length - 8
                  )}`
                  : "Wallet"}
              </h1>
              <p className="text-sm font-mono text-[var(--muted)] font-medium mt-0.5">
                {walletState.networkName} (Chain ID {CHAIN_ID})
              </p>
            </div>
          </div>

          {/* Balances Bar */}
          <div className="grid grid-cols-3 gap-4 liquid-glass-box rounded-2xl p-5 w-full lg:w-auto min-w-0">
            <div className="text-center border-r border-[var(--border)] pr-4">
              <div className="text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                USDT.c Balance
              </div>
              <div className="text-base sm:text-xl font-extrabold text-[var(--ink)] font-mono mt-1">
                {formatUSD(walletState.usdtBalance)}
              </div>
            </div>
            <div className="text-center border-r border-[var(--border)] px-4">
              <div className="text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                Swiz Staked
              </div>
              <div className="text-base sm:text-xl font-extrabold text-[#8B1A1A] dark:text-red-400 font-mono mt-1">
                {totalStakedSZ.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-center pl-4">
              <div className="text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                ET Balance
              </div>
              <div className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatTokens(walletState.etBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY BACKUP WALLET NOTIFICATION / MANAGEMENT CARD (PRIMARY WALLETS ONLY) */}
      {/* SECONDARY BACKUP WALLET NOTIFICATION / MANAGEMENT CARD (PRIMARY WALLETS ONLY) */}
      {!isSecondaryWallet && (
        isWalletMigrated ? (
          <div className="rounded-3xl p-5 sm:p-6 transition-all border border-red-500/30 bg-[var(--bg-card)] shadow-sm animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border bg-red-500/10 border-red-500/30 text-red-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-cond font-bold text-base uppercase tracking-wider text-[var(--ink)]">
                      Packages Migrated to Secondary Backup Wallet
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
                      STATUS: REPLACED
                    </span>
                  </div>
                  <p className="text-xs text-[var(--mid)] max-w-2xl leading-relaxed font-body">
                    All protocol assets and staking packages have been transferred to verified recovery address{" "}
                    <span className="font-mono text-emerald-500 font-bold break-all">
                      {migratedToWallet || secondaryWallet}
                    </span>
                    . This primary wallet is decommissioned. Connect with your secondary wallet to view and manage packages.
                  </p>
                </div>
              </div>
              {(migratedToWallet || secondaryWallet) && (
                <div className="px-4 py-2.5 rounded-xl text-xs font-cond font-bold bg-[var(--bg-card-sub)] text-[var(--ink)] border border-[var(--border)] shrink-0 font-mono">
                  Recovery: {(migratedToWallet || secondaryWallet)?.slice(0, 6)}...{(migratedToWallet || secondaryWallet)?.slice(-4)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`rounded-3xl p-5 sm:p-6 transition-all border ${
              secondaryWallet
                ? "bg-[var(--bg-card)] border-emerald-500/30"
                : "bg-[var(--bg-card)] border-[#8B1A1A]/40 shadow-sm"
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    secondaryWallet
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : "bg-[#8B1A1A]/10 border-[#8B1A1A]/30 text-[#8B1A1A]"
                  }`}
                >
                  {secondaryWallet ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-cond font-bold text-base uppercase tracking-wider text-[var(--ink)]">
                      {secondaryWallet
                        ? "Secondary Backup Wallet Active"
                        : "Action Recommended: Set Secondary Backup Wallet"}
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        secondaryWallet
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                          : "bg-[#8B1A1A]/15 border-[#8B1A1A]/30 text-[#8B1A1A]"
                      }`}
                    >
                      {secondaryWallet
                        ? (secondaryWalletStatus ? `PROTECTED (${secondaryWalletStatus})` : "PROTECTED")
                        : "UNPROTECTED"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--mid)] max-w-2xl leading-relaxed font-body">
                    {secondaryWallet ? (
                      <>
                        Your backup recovery address is{" "}
                        <span className="font-mono text-emerald-500 font-bold break-all">
                          {secondaryWallet}
                        </span>
                        . In case of primary wallet loss, protocol administration can migrate your packages and buybacks.
                      </>
                    ) : (
                      "Decentralized wallets can be lost due to compromised private keys or misplaced recovery phrases. Add a verified secondary backup wallet so protocol administrators can safely recover your packages and buyback returns."
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={openSecondaryWalletModal}
                className={`btn text-xs px-5 py-2.5 shrink-0 ${
                  secondaryWallet
                    ? "btn-ink"
                    : "btn-red"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{secondaryWallet ? "View Backup Wallet" : "Add Secondary Wallet"}</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* CONNECTED WALLET IS AN AUTHORIZED SECONDARY RECOVERY WALLET */}
      {isSecondaryWallet && (
        <div className={`rounded-3xl p-5 sm:p-6 transition-all border shadow-sm ${
          userPackages.length > 0
            ? "border-emerald-400 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20"
            : "border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/15"
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                userPackages.length > 0
                  ? "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-purple-100 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-300"
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-cond font-bold text-base uppercase tracking-wider text-[var(--ink)]">
                    {userPackages.length > 0
                      ? "Active Recovery Account — Staking Packages Migrated"
                      : "Authorized Recovery Backup Account"}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    userPackages.length > 0
                      ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                      : "bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300"
                  }`}>
                    {userPackages.length > 0 ? "MIGRATION ACTIVE" : "RECOVERY ACCOUNT"}
                  </span>
                </div>
                <p className="text-xs text-[var(--mid)] max-w-2xl leading-relaxed font-body">
                  {userPackages.length > 0 ? (
                    <>
                      This wallet is the active secondary recovery account for primary account{" "}
                      {primaryWalletForSecondary && (
                        <span className="font-mono text-purple-700 dark:text-purple-400 font-bold break-all underline">
                          {primaryWalletForSecondary}
                        </span>
                      )}
                      . All {userPackages.length} staking package(s) and asset rights have been migrated to this verified address.
                    </>
                  ) : (
                    <>
                      This connected wallet is registered as an emergency backup recovery account
                      {primaryWalletForSecondary ? (
                        <> for primary account <span className="font-mono text-purple-700 dark:text-purple-400 font-bold break-all underline">{primaryWalletForSecondary}</span></>
                      ) : ""}.
                      In the event of primary wallet compromise, protocol administration can securely execute package migration to this verified address.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL-HEIGHT SIDEBAR NAVIGATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Full-Height Left Sidebar Navigation Panel */}
        <div className="lg:col-span-3 lumix-card rounded-3xl p-5 flex flex-col justify-between lg:min-h-[calc(100vh-220px)] lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            {/* User Profile Mini Badge */}
            <div className="liquid-glass-box rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A]">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[var(--ink)] truncate font-mono">
                  {walletState.address
                    ? `${walletState.address.substring(
                      0,
                      6
                    )}...${walletState.address.substring(
                      walletState.address.length - 4
                    )}`
                    : "Wallet"}
                </div>
                <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                  Active
                </div>
              </div>
            </div>

            <div className="text-xs font-cond font-bold text-[var(--ink)] px-2 uppercase tracking-widest border-b border-[var(--border)] pb-2.5">
              Dashboard Sections
            </div>

            {/* Sidebar Navigation Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveSidebarTab("overview")}
                className={`w-full px-4 py-3.5 rounded-xl font-cond font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeSidebarTab === "overview"
                    ? "bg-[#8B1A1A] text-white shadow-sm"
                    : "text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-sub)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Overview & Charts</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSidebarTab("packages")}
                className={`w-full px-4 py-3.5 rounded-xl font-cond font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeSidebarTab === "packages"
                    ? "bg-[#8B1A1A] text-white shadow-sm"
                    : "text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-sub)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5" />
                  <span>My Packages</span>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded ${
                  activeSidebarTab === "packages"
                    ? "bg-black/25 text-white"
                    : "bg-black/10 dark:bg-black/40 text-[var(--ink)]"
                }`}>
                  {userPackages.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("rewards")}
                className={`w-full px-4 py-3.5 rounded-xl font-cond font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeSidebarTab === "rewards"
                    ? "bg-[#8B1A1A] text-white shadow-sm"
                    : "text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-sub)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5" />
                  <span>Ecosystem Tokens (ET)</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("history")}
                className={`w-full px-4 py-3.5 rounded-xl font-cond font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activeSidebarTab === "history"
                    ? "bg-[#8B1A1A] text-white shadow-sm"
                    : "text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-sub)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5" />
                  <span>Transaction Audit</span>
                </div>
                <ShieldCheck className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>

          {/* Sidebar Footer Status Chip */}
          <div className="pt-4 border-t border-[var(--border)] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[var(--mid)] font-medium text-xs">
              <span>Smart Contract:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />{" "}
                {stats?.paused ? "Paused" : "Active"}
              </span>
            </div>
            <a
              href={`${EXPLORER}/address/${ADDRESSES.sz}`}
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-box rounded-xl p-3 flex items-center justify-between text-[var(--ink)] hover:text-[#8B1A1A] transition-all text-xs font-medium font-mono"
            >
              <span>View Swiz Contract</span>
              <ExternalLink className="w-4 h-4 text-[var(--muted)]" />
            </a>
          </div>
        </div>

        {/* Right Main Tab Area */}
        <div className="lg:col-span-9 min-w-0 space-y-8">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeSidebarTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lumix-card rounded-2xl p-5 hover:border-[#8B1A1A]/40 transition-all">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                    <span>Purchase Value</span>
                    <DollarSign className="w-4 h-4 text-[#8B1A1A] dark:text-red-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-mono mt-2">
                    $
                    {totalStakedUSD.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-[var(--muted)] font-mono font-medium mt-1">
                    Cumulative Staking USD
                  </div>
                </div>

                <div className="lumix-card rounded-2xl p-5 hover:border-[#8B1A1A]/40 transition-all">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                    <span>Staked Swiz</span>
                    <Layers className="w-4 h-4 text-[#8B1A1A] dark:text-red-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#8B1A1A] dark:text-red-400 font-mono mt-2">
                    {totalStakedSZ.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-[var(--muted)] font-mono font-medium mt-1">
                    Ref. Price: ${currentPriceUSD.toFixed(4)} USD
                  </div>
                </div>

                <div className="lumix-card rounded-2xl p-5 hover:border-[#8B1A1A]/40 transition-all">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                    <span>ET Balance</span>
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2">
                    {formatTokens(walletState.etBalance)} ET
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-medium mt-1">
                    From Years 2–20 Buybacks
                  </div>
                </div>

                <div className="lumix-card rounded-2xl p-5 hover:border-[#8B1A1A]/40 transition-all">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)]">
                    <span>Active Packages</span>
                    <Layers className="w-4 h-4 text-[#8B1A1A] dark:text-red-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-mono mt-2">
                    {userPackages.filter((p) => !p.isFullyBoughtBack).length}
                  </div>
                  <div className="text-xs text-[var(--muted)] font-mono font-medium mt-1">
                    20-Year Unlock Horizon
                  </div>
                </div>
              </div>

              {/* Personal Portfolio Analytics Charts */}
              <UserPortfolioCharts />
            </div>
          )}

          {/* TAB 2: STAKING PACKAGES */}
          {activeSidebarTab === "packages" && (
            <div className="animate-fade-in">
              <StakingPackagesSection />
            </div>
          )}

          {/* TAB 3: ECOSYSTEM REWARDS */}
          {activeSidebarTab === "rewards" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h2 className="d-md text-[var(--ink)]">
                    Ecosystem Token Ledger (ET)
                  </h2>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono font-semibold text-emerald-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>On-Chain Records</span>
                </div>
              </div>

              <EcosystemRewardsSection />
            </div>
          )}

          {/* TAB 4: TRANSACTION HISTORY */}
          {activeSidebarTab === "history" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#8B1A1A]" />
                  <h2 className="d-md text-[var(--ink)]">
                    Personal Transaction History & Audit
                  </h2>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs font-mono font-semibold text-blue-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Activity</span>
                </div>
              </div>

              <TransactionHistorySection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
