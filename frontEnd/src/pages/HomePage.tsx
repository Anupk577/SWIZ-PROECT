import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Repeat,
  ArrowRight,
  Lock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Hero3DCanvas } from "../components/Hero3DCanvas";
import { ProtocolAnalyticsCharts } from "../components/ProtocolAnalyticsCharts";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import { EXPLORER } from "../constants/contracts";

export const HomePage: React.FC = () => {
  const { protocolStats, walletState, ready, connectWallet } = useWeb3();
  const [calcUsdt, setCalcUsdt] = useState<number>(5000);
  const [calcYears, setCalcYears] = useState<number>(5);

  const rawPriceBig = protocolStats.currentPriceUSD;
  const currentPrice = Number(rawPriceBig) / 1e6;
  const estimatedSwiz = currentPrice > 0 ? calcUsdt / currentPrice : 0;
  const estimatedFuturePrice = currentPrice * Math.pow(1.0233, calcYears);
  const estimatedFutureValue = estimatedSwiz * estimatedFuturePrice;

  return (
    <div className="w-full space-y-16 py-4 animate-fade-in relative">
      {/* 1. HERO BANNER SECTION (MATCHING SWIZCOIN.IO HERO) */}
      <div className="relative lumix-card rounded-3xl overflow-hidden hero-texture border border-[var(--border)]">
        <div className="hero-glow-orb" />

        <div className="relative z-10 p-6 sm:p-12 lg:p-14">
          <div className="page-num mb-6">
            <span>[01 // PROTOCOL OVERVIEW]</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Hero Copy & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="label">
                ALGORITHMIC PRICING & 20Y STAKING PROTOCOL
              </div>

              <h1 className="d-hero text-[var(--ink)] tracking-tight">
                A CLEAR PATH WITH{" "}
                <span className="text-[#8B1A1A] block">PROGRESSIVE UNLOCKS</span>
              </h1>

              <div className="rule" />

              <p className="text-[var(--mid)] text-base sm:text-lg max-w-xl leading-relaxed font-body font-medium">
                Swizcoin pioneers a 20-year progressive unlock architecture with an
                automated +2.33% compounding reference price per step and
                automatic FIFO buyback eligibility.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  to="/buy"
                  className="btn btn-red w-full sm:w-auto px-8 py-4 text-base font-bold shadow-md"
                >
                  <span>Buy Swiz Tokens</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                {walletState.isConnected ? (
                  <Link
                    to="/dashboard"
                    className="btn btn-ink w-full sm:w-auto px-8 py-4 text-base font-bold"
                  >
                    <Lock className="w-5 h-5 text-[#8B1A1A]" />
                    <span>View Dashboard</span>
                  </Link>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="btn btn-ink w-full sm:w-auto px-8 py-4 text-base font-bold"
                  >
                    <span>Connect Web3 Wallet</span>
                  </button>
                )}
              </div>

              {/* Inline Key Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[var(--border)] text-sm sm:text-base font-cond font-bold tracking-wide text-[var(--mid)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#8B1A1A]" />
                  <span>+2.33% / Threshold Step</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#8B1A1A]" />
                  <span>20-Year Linear Vesting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#8B1A1A]" />
                  <span>365-Day Annual Tranches</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Interactive Canvas */}
            <div className="lg:col-span-5 h-[340px] sm:h-[400px] w-full relative flex items-center justify-center">
              <Hero3DCanvas />
            </div>
          </div>

          {/* Metrics Row — matching swizcoin.io .hero-metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 mt-8 border-t border-[var(--border)]">
            <div className="space-y-1.5 pr-4 border-r border-[var(--border)]">
              <div className="font-display text-4xl sm:text-5xl text-[#8B1A1A] leading-none">
                +2.33%
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--mid)]">
                Compound Formula / Step
              </div>
            </div>

            <div className="space-y-1.5 pr-4 md:border-r border-[var(--border)]">
              <div className="font-display text-4xl sm:text-5xl text-[var(--ink)] leading-none">
                20 YRS
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--mid)]">
                Linear Vesting (5% / Yr)
              </div>
            </div>

            <div className="space-y-1.5 pr-4 border-r border-[var(--border)]">
              <div className="font-display text-4xl sm:text-5xl text-[#8B1A1A] leading-none">
                FIFO
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--mid)]">
                Order Matching Engine
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-display text-4xl sm:text-5xl text-[var(--ink)] leading-none">
                100%
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--mid)]">
                Smart Contract Custody
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Bar — matching swizcoin.io .hero-bar */}
        <div className="w-full bg-[#8B1A1A] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-sm font-mono tracking-wider uppercase font-semibold">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>SWIZ PROTOCOL ECOSYSTEM • DEPLOYED ON POLYGON AMOY</span>
          </div>
          <div className="flex items-center gap-5 font-cond font-bold">
            <a
              href={EXPLORER}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1.5 text-white underline-offset-4"
            >
              <span>Verify Smart Contract</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. CORE PROTOCOL PILLARS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="page-num mb-2">[02 // THREE CORE PILLARS]</div>
            <div className="label">THE ARCHITECTURE</div>
            <h2 className="d-lg text-[var(--ink)] mt-1 font-bold">
              BUILT FOR ENDURING APPRECIATION
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="lumix-card rounded-3xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A]">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-[var(--ink)] font-bold">
              Algorithmic Dynamic Pricing
            </h3>
            <div className="rule" />
            <p className="text-[var(--mid)] text-sm sm:text-base leading-relaxed font-body font-medium">
              Reference price increases +2.33% compounded every 1,000 packages or
              $100,000 USD total protocol staking volume.
            </p>
          </div>

          <div className="lumix-card rounded-3xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A]">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-[var(--ink)] font-bold">
              20-Year Staking Schedule
            </h3>
            <div className="rule" />
            <p className="text-[var(--mid)] text-sm sm:text-base leading-relaxed font-body font-medium">
              Staked tokens unlock linearly at 5% per year across 20 annual
              tranches, with every tranche held in contract custody until bought
              back.
            </p>
          </div>

          <div className="lumix-card rounded-3xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A]">
              <Repeat className="w-7 h-7" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-[var(--ink)] font-bold">
              Automatic FIFO Buybacks
            </h3>
            <div className="rule" />
            <p className="text-[var(--mid)] text-sm sm:text-base leading-relaxed font-body font-medium">
              New purchases match eligible tranches in FIFO order. Year 1 pays
              USDT.c; Years 2–20 issue ET to the original staker.
            </p>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE YIELD CALCULATOR */}
      <div className="lumix-card rounded-3xl p-8 sm:p-10 space-y-6">
        <div>
          <div className="page-num mb-2">[03 // REFERENCE CALCULATOR]</div>
          <div className="label">NUMERICAL SIMULATION</div>
          <h2 className="d-lg text-[var(--ink)] mt-1">
            DYNAMIC REFERENCE PRICING SIMULATOR
          </h2>
          <p className="text-[var(--mid)] text-sm sm:text-base mt-2 max-w-2xl font-body leading-relaxed font-medium">
            Explore the reference-price formula by threshold steps. Steps are
            driven by package and purchase volume counters, not elapsed years or
            guaranteed returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)] flex justify-between mb-2">
                <span>USDT.c Purchase Amount</span>
                <span className="text-[#8B1A1A] dark:text-red-400 font-mono font-bold text-base">
                  ${calcUsdt.toLocaleString()} USDT.c
                </span>
              </label>
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={calcUsdt}
                onChange={(e) => setCalcUsdt(Number(e.target.value))}
                className="w-full accent-[#8B1A1A] cursor-pointer h-3"
              />
            </div>

            <div>
              <label className="text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)] flex justify-between mb-2">
                <span>Additional Threshold Steps</span>
                <span className="text-[#8B1A1A] dark:text-red-400 font-mono font-bold text-base">
                  +{calcYears} Steps
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={calcYears}
                onChange={(e) => setCalcYears(Number(e.target.value))}
                className="w-full accent-[#8B1A1A] cursor-pointer h-3"
              />
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-6 space-y-5">
            <div>
              <div className="font-mono text-sm tracking-wider uppercase font-bold text-[var(--muted)]">
                Initial Swiz Tokens Received:
              </div>
              <div className="text-3xl font-mono font-extrabold text-[var(--ink)] mt-1">
                {ready ? estimatedSwiz.toFixed(2) : "—"} SZ
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <div className="font-mono text-sm tracking-wider uppercase font-bold text-[var(--muted)]">
                Illustrative Reference Price (+{calcYears} steps):
              </div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ${ready ? estimatedFuturePrice.toFixed(4) : "—"}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <div className="font-mono text-sm tracking-wider uppercase font-bold text-[var(--muted)]">
                Illustrative Swiz × Reference Price:
              </div>
              <div className="text-3xl font-mono font-extrabold text-[#8B1A1A] dark:text-red-400 mt-1">
                ${ready ? estimatedFutureValue.toFixed(2) : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PROTOCOL ANALYTICS CHARTS SECTION */}
      <ProtocolAnalyticsCharts />

      {/* 5. LIVE FIFO MATCHING ENGINE */}
      <div className="lumix-card rounded-3xl p-8 sm:p-10 space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <div className="page-num mb-2">[04 // MATCHING ENGINE]</div>
            <div className="label">SMART CONTRACT EXECUTION</div>
            <h2 className="d-lg text-[var(--ink)] mt-1">
              LIVE FIFO ORDER MATCHING ENGINE
            </h2>
          </div>
          <Link
            to="/buy"
            className="btn btn-red px-6 py-3.5 text-sm sm:text-base font-bold shrink-0 self-start md:self-auto"
          >
            <span>Proceed to Buy Tokens</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="liquid-glass-box rounded-2xl p-6 space-y-3">
            <div className="font-mono text-sm font-bold text-[#8B1A1A] dark:text-red-400 uppercase tracking-wider">
              01 // INVENTORY MATCHING
            </div>
            <h4 className="font-cond font-bold text-lg sm:text-xl uppercase text-[var(--ink)]">
              Eligible Inventory Priority
            </h4>
            <p className="text-sm sm:text-base text-[var(--mid)] leading-relaxed font-body font-medium">
              Purchases use USDT.c and match unlocked Swiz by the earliest
              eligible timestamp, subject to the original staker’s buyback price
              cap.
            </p>
          </div>

          <div className="liquid-glass-box rounded-2xl p-6 space-y-3">
            <div className="font-mono text-sm font-bold text-[#8B1A1A] dark:text-red-400 uppercase tracking-wider">
              02 // TREASURY BACKING
            </div>
            <h4 className="font-cond font-bold text-lg sm:text-xl uppercase text-[var(--ink)]">
              Treasury Inventory Fallback
            </h4>
            <p className="text-sm sm:text-base text-[var(--mid)] leading-relaxed font-body font-medium">
              Unmatched Swiz comes from pre-minted treasury inventory and remains
              locked in contract custody. The corresponding payment goes to the
              company treasury.
            </p>
          </div>

          <div className="liquid-glass-box rounded-2xl p-6 space-y-3">
            <div className="font-mono text-sm font-bold text-[#8B1A1A] dark:text-red-400 uppercase tracking-wider">
              03 // LINEAR VESTING
            </div>
            <h4 className="font-cond font-bold text-lg sm:text-xl uppercase text-[var(--ink)]">
              20-Year Supply Security
            </h4>
            <p className="text-sm sm:text-base text-[var(--mid)] leading-relaxed font-body font-medium">
              Each package unlocks 5% at successive 365-day intervals. There is
              no APY, early withdrawal or artificial inflation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
