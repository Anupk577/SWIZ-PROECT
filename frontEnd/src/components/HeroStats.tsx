import React from "react";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import {
  TrendingUp,
  Layers,
  DollarSign,
  Repeat,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
export const HeroStats: React.FC = () => {
  const { protocolStats, walletState, ready } = useWeb3();
  const actualPackagesCount = protocolStats.totalStakingPackages;
  const currentStakedUsd = Number(protocolStats.totalStakedAmountUSD) / 1e6;
  const totalSteps =
    Math.floor(actualPackagesCount / 1000) +
    Math.floor(currentStakedUsd / 100000);
  const displayPriceNum = Number(protocolStats.currentPriceUSD) / 1e6;
  const pkgProgress = (actualPackagesCount % 1000) / 10,
    usdProgress = (currentStakedUsd % 100000) / 1000;
  const formatUSD = (n: number) =>
    ready
      ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
      }).format(n)
      : "—";
  const formatTokens = (n: bigint) =>
    ready && walletState.isConnected
      ? (Number(n) / 1e6).toLocaleString(undefined, {
        maximumFractionDigits: 6,
      })
      : "—";
  return (
    <div className="w-full space-y-6">
      {/* Top Protocol Announcement Bar (Liquid Glass Red) */}
      <div className="relative overflow-hidden lumix-card rounded-3xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E3262E]/15 border border-[#E3262E]/30 rounded-full text-xs font-semibold text-[#E3262E]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Algorithmic Dynamic Pricing Protocol</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Swiz Smart Ecosystem
            </h1>
            <p className="text-gray-300 text-sm max-w-xl">
              Automated 20-year progressive staking, dynamic compounding formula
              (+2.33% per step), and automatic FIFO buyback eligibility.
            </p>
          </div>

          {/* Live Price Widget (Liquid Glass Box) */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 liquid-glass-box p-4 rounded-2xl border border-white/10 min-w-[260px]">
              <div className="p-3 bg-[#E3262E] text-white rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">
                  Protocol Reference Price
                </div>
                <div className="text-2xl font-black text-white tracking-wide font-mono">
                  {formatUSD(displayPriceNum)}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>
                    +2.33% / Step ({ready ? totalSteps : "—"} Steps Total)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Card Protocol Metrics Grid (Liquid Glass) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lumix-card hover:border-white/20 rounded-3xl p-5 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-medium">Total Staking Packages</span>
            <div className="p-2 bg-[#E3262E]/10 rounded-lg text-[#E3262E]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1 font-mono">
            {ready ? actualPackagesCount.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-gray-400">Packages created on-chain</div>
        </div>

        <div className="lumix-card hover:border-white/20 rounded-3xl p-5 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-medium">
              Cumulative Purchase Value
            </span>
            <div className="p-2 bg-[#E3262E]/10 rounded-lg text-[#E3262E]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1 font-mono">
            {formatUSD(currentStakedUsd)}
          </div>
          <div className="text-xs text-gray-400">
            Cumulative volume in protocol
          </div>
        </div>

        <div className="lumix-card hover:border-white/20 rounded-3xl p-5 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-medium">Buyback Queue Depth</span>
            <div className="p-2 bg-[#E3262E]/10 rounded-lg text-[#E3262E]">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1 font-mono">
            {ready ? protocolStats.buybackQueueLength : "—"}{" "}
            {protocolStats.buybackQueueLength === 1 ? "pkg" : "pkgs"}
          </div>
          <div className="text-xs text-emerald-400 font-medium">
            Includes future scheduled tranches
          </div>
        </div>

        <div className="lumix-card hover:border-white/20 rounded-3xl p-5 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-medium">Your Swiz / ET Balance</span>
            <div className="p-2 bg-[#E3262E] rounded-lg text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white mb-1 flex items-baseline gap-2 font-mono">
            <span>{formatTokens(walletState.szBalance)} Swiz</span>
          </div>
          <div className="text-xs text-[#E3262E] font-medium">
            + {formatTokens(walletState.etBalance)} ET Ecosystem Tokens
          </div>
        </div>
      </div>

      {/* Progress Bar (Liquid Glass) */}
      <div className="lumix-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-sm font-semibold text-white">
              Next Price Step (+2.33%) Progress
            </span>
            <p className="text-xs text-gray-400">
              Both package and purchase-value thresholds contribute price steps
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-[#E3262E]">
            Total Compounded Steps: {ready ? totalSteps : "—"}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <span>
                Packages Progress ({ready ? actualPackagesCount % 1000 : "—"} /
                1000)
              </span>
              <span>{ready ? `${pkgProgress.toFixed(1)}%` : "—"}</span>
            </div>
            <div className="w-full h-2.5 liquid-glass-box rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-[#E3262E] rounded-full transition-all duration-500"
                style={{ width: `${pkgProgress}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <span>
                Purchase Value ($
                {ready
                  ? (currentStakedUsd % 100000).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })
                  : "—"}{" "}
                / $100,000)
              </span>
              <span>{ready ? `${usdProgress.toFixed(1)}%` : "—"}</span>
            </div>
            <div className="w-full h-2.5 liquid-glass-box rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-[#E3262E] rounded-full transition-all duration-500"
                style={{ width: `${usdProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
