import React from "react";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import {
  TrendingUp,
  Layers,
  Repeat,
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
  const pkgProgress = (actualPackagesCount % 1000) / 10;

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
      {/* Top Protocol Announcement Bar */}
      <div className="relative overflow-hidden lumix-card rounded-3xl p-6 sm:p-8">
        <div className="page-num mb-3">[METRICS // BENCHMARKS]</div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="label">
              DYNAMIC BENCHMARK PROTOCOL
            </div>
            <h1 className="d-md text-[var(--ink)] font-bold">
              Swizcoin Protocol Benchmarks
            </h1>
            <div className="rule" />
            <p className="text-[var(--mid)] text-sm sm:text-base max-w-xl font-body leading-relaxed font-medium">
              Automated 20-year progressive unlock schedule, dynamic compounding formula
              (+2.33% per step), and automatic FIFO buyback eligibility.
            </p>
          </div>

          {/* Live Price Widget */}
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-4 liquid-glass-box p-5 rounded-2xl border border-[var(--border)] min-w-[280px] w-full md:w-auto justify-between shadow-sm">
              <div className="p-3.5 bg-[#8B1A1A] text-white rounded-xl shadow-md">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs sm:text-sm font-cond font-bold uppercase tracking-wider text-[var(--mid)] block">
                  Reference Price
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#8B1A1A] block">
                  {formatUSD(displayPriceNum)}
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                  Step {totalSteps} (+{(totalSteps * 2.33).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="lumix-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-sm font-cond font-bold uppercase tracking-wider text-[var(--mid)]">
            <span>Protocol Staked</span>
            <Layers className="w-5 h-5 text-[#8B1A1A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-mono">
            {ready
              ? `$${(Number(protocolStats.totalStakedAmountUSD) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : "—"}{" "}
            <span className="text-sm font-normal text-[var(--muted)]">USD</span>
          </div>
          <div className="text-xs sm:text-sm font-mono font-medium text-[var(--mid)]">
            Packages: {actualPackagesCount} / 1,000 threshold
          </div>
          <div className="w-full bg-[var(--bg-card-sub)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
            <div
              className="bg-[#8B1A1A] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pkgProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: FIFO Queue Status */}
        <div className="lumix-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-sm font-cond font-bold uppercase tracking-wider text-[var(--mid)]">
            <span>FIFO Queue Status</span>
            <Repeat className="w-5 h-5 text-[#8B1A1A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-mono">
            {protocolStats.buybackQueueLength > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
            ) : (
              <span className="text-[var(--ink)]">Treasury</span>
            )}
          </div>
          <div className="text-xs sm:text-sm font-mono font-medium text-[var(--mid)]">
            {protocolStats.buybackQueueLength > 0
              ? `${protocolStats.buybackQueueLength} tranches waiting`
              : "Direct treasury backing route"}
          </div>
        </div>

        {/* Metric 3: Your Balance */}
        <div className="lumix-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-sm font-cond font-bold uppercase tracking-wider text-[var(--mid)]">
            <span>Your Balance</span>
            <ShieldCheck className="w-5 h-5 text-[#8B1A1A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-mono">
            {walletState.isConnected ? (
              <span>{formatTokens(walletState.usdtBalance)}</span>
            ) : (
              <span className="text-base text-[var(--muted)] font-normal">Disconnected</span>
            )}
          </div>
          <div className="text-xs sm:text-sm font-mono font-medium text-[var(--mid)]">
            USDT.c on {walletState.networkName || "Amoy"}
          </div>
        </div>
      </div>
    </div>
  );
};
