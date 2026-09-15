import { CHAIN_ID, EXPLORER, ADDRESSES } from "../constants/contracts";
import React, { useState } from "react";
import { StakingPackagesSection } from "../components/StakingPackagesSection";
import { EcosystemRewardsSection } from "../components/EcosystemRewardsSection";
import { TransactionHistorySection } from "../components/TransactionHistorySection";
import { UserPortfolioCharts } from "../components/UserPortfolioCharts";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import { WalletModal } from "../components/WalletModal";
import {
  User,
  Lock,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Activity,
  Award,
  DollarSign,
  Layers,
  LayoutDashboard,
  History,
  ExternalLink,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { walletState, protocolStats, userPackages, ready, stats } = useWeb3();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
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
            <div className="w-20 h-20 rounded-3xl bg-[#E3262E]/15 border border-[#E3262E]/30 flex items-center justify-center text-[#E3262E] mx-auto">
              <Lock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Wallet Connection Required
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                Connect your Web3 wallet to access your dashboard, package
                manager, rewards ledger, and transaction logs.
              </p>
            </div>

            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="w-full py-4 bg-[#E3262E] hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet to Access Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
        />
      </>
    );
  }

  if (!ready)
    return (
      <div className="lumix-card rounded-3xl p-8 text-gray-300">
        Package data is unavailable. Reconnect or refresh when the protocol is
        available.
      </div>
    );

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* 1. TOP LIQUID GLASS USER PORTFOLIO HEADER */}
      <div className="lumix-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-[#E3262E]/15 border border-[#E3262E]/30 flex items-center justify-center text-[#E3262E] font-bold text-2xl">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Connected User Portfolio
              </div>
              <h1 className="text-lg sm:text-3xl font-extrabold text-white font-mono mt-1 tracking-tight break-all">
                {walletState.address
                  ? `${walletState.address.substring(
                    0,
                    10
                  )}...${walletState.address.substring(
                    walletState.address.length - 8
                  )}`
                  : "Wallet"}
              </h1>
              <p className="text-xs text-gray-400">
                {walletState.networkName} (Chain ID {CHAIN_ID})
              </p>
            </div>
          </div>

          {/* Liquid Glass Balances Bar */}
          <div className="grid grid-cols-3 gap-3 liquid-glass-box rounded-2xl p-4 w-full lg:w-auto min-w-0">
            <div className="text-center border-r border-white/10 pr-2">
              <div className="text-[10px] text-gray-400 font-medium">
                USDT.c Balance
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {formatUSD(walletState.usdtBalance)}
              </div>
            </div>
            <div className="text-center border-r border-white/10 px-2">
              <div className="text-[10px] text-gray-400 font-medium">
                Swiz Staked
              </div>
              <div className="text-sm font-bold text-[#E3262E] font-mono">
                {totalStakedSZ.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-center pl-2">
              <div className="text-[10px] text-gray-400 font-medium">
                ET Balance
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {formatTokens(walletState.etBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FULL-HEIGHT SIDEBAR NAVIGATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Full-Height Left Sidebar Navigation Panel */}
        <div className="lg:col-span-3 liquid-glass rounded-3xl p-5 flex flex-col justify-between lg:min-h-[calc(100vh-220px)] shadow-[0_0_40px_rgba(0,0,0,0.4)] lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            {/* User Profile Mini Badge */}
            <div className="liquid-glass-box rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E3262E]/20 border border-[#E3262E]/40 flex items-center justify-center text-[#E3262E]">
                <User className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-white truncate font-mono">
                  {walletState.address
                    ? `${walletState.address.substring(
                      0,
                      6
                    )}...${walletState.address.substring(
                      walletState.address.length - 4
                    )}`
                    : "Wallet"}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{" "}
                  Online
                </div>
              </div>
            </div>

            <div className="text-[10px] font-extrabold text-gray-400 px-2 uppercase tracking-wider border-b border-white/10 pb-2">
              Dashboard Sections
            </div>

            {/* Sidebar Navigation Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveSidebarTab("overview")}
                className={`w-full px-4 py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-between ${activeSidebarTab === "overview"
                    ? "bg-gradient-to-r from-[#E3262E] to-[#B91C1C] text-white shadow-[0_0_25px_rgba(227,38,46,0.5)] border border-[#E3262E]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview & Analytics</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSidebarTab("packages")}
                className={`w-full px-4 py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-between ${activeSidebarTab === "packages"
                    ? "bg-gradient-to-r from-[#E3262E] to-[#B91C1C] text-white shadow-[0_0_25px_rgba(227,38,46,0.5)] border border-[#E3262E]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4" />
                  <span>My Staking Packages</span>
                </div>
                <span className="px-2.5 py-0.5 bg-black/50 border border-white/10 rounded-full text-[10px]">
                  {userPackages.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("rewards")}
                className={`w-full px-4 py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-between ${activeSidebarTab === "rewards"
                    ? "bg-gradient-to-r from-[#E3262E] to-[#B91C1C] text-white shadow-[0_0_25px_rgba(227,38,46,0.5)] border border-[#E3262E]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4" />
                  <span>Ecosystem Rewards (ET)</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("history")}
                className={`w-full px-4 py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-between ${activeSidebarTab === "history"
                    ? "bg-gradient-to-r from-[#E3262E] to-[#B91C1C] text-white shadow-[0_0_25px_rgba(227,38,46,0.5)] border border-[#E3262E]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4" />
                  <span>Transaction History</span>
                </div>
                <ShieldCheck className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>

          {/* Sidebar Footer Status Chip */}
          <div className="pt-4 border-t border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <span>Smart Contract:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />{" "}
                {stats?.paused ? "Paused" : "Active"}
              </span>
            </div>
            <a
              href={`${EXPLORER}/address/${ADDRESSES.sz}`}
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-box rounded-xl p-2.5 flex items-center justify-between text-gray-300 hover:text-white transition-all text-[11px]"
            >
              <span>View Swiz Contract</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Right Main Liquid Glass Tab Area */}
        <div className="lg:col-span-9 min-w-0 space-y-8">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeSidebarTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="liquid-glass rounded-2xl p-5 hover:border-[#E3262E]/50 transition-all shadow-md">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>Original Purchase Value</span>
                    <DollarSign className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-2">
                    $
                    {totalStakedUSD.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-1">
                    Cumulative Package Purchase Value
                  </div>
                </div>

                <div className="liquid-glass rounded-2xl p-5 hover:border-[#E3262E]/50 transition-all shadow-md">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>Staked Swiz Balance</span>
                    <Layers className="w-4 h-4 text-[#E3262E]" />
                  </div>
                  <div className="text-2xl font-black text-[#E3262E] font-mono mt-2">
                    {totalStakedSZ.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-1">
                    Ref. Price: ${currentPriceUSD.toFixed(4)} USD
                  </div>
                </div>

                <div className="liquid-glass rounded-2xl p-5 hover:border-[#E3262E]/50 transition-all shadow-md">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>ET Wallet Balance</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                    {formatTokens(walletState.etBalance)} ET
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-1">
                    ET received from later-year buybacks
                  </div>
                </div>

                <div className="liquid-glass rounded-2xl p-5 hover:border-[#E3262E]/50 transition-all shadow-md">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>Active Packages</span>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-2">
                    {userPackages.filter((p) => !p.isFullyBoughtBack).length}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-1">
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
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-extrabold text-white">
                    Ecosystem Token Ledger (ET)
                  </h2>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
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
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#E3262E]" />
                  <h2 className="text-xl font-extrabold text-white">
                    Personal Transaction History & Audit Trail
                  </h2>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs font-semibold text-blue-400 flex items-center gap-1.5">
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
