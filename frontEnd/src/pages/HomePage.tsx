import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TrendingUp,
  Repeat,
  ArrowRight,
  Lock,
  CheckCircle,
  Activity,
} from "lucide-react";
import { Hero3DCanvas } from "../components/Hero3DCanvas";
import { ProtocolAnalyticsCharts } from "../components/ProtocolAnalyticsCharts";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import { WalletModal } from "../components/WalletModal";

export const HomePage: React.FC = () => {
  const { protocolStats, walletState, ready } = useWeb3();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [calcUsdt, setCalcUsdt] = useState<number>(5000);
  const [calcYears, setCalcYears] = useState<number>(5);

  const rawPriceBig = protocolStats.currentPriceUSD;
  const currentPrice = Number(rawPriceBig) / 1e6;
  const estimatedSwiz = currentPrice > 0 ? calcUsdt / currentPrice : 0;
  const estimatedFuturePrice = currentPrice * Math.pow(1.0233, calcYears);
  const estimatedFutureValue = estimatedSwiz * estimatedFuturePrice;

  return (
    <div className="w-full space-y-16 py-4 animate-fade-in relative">
      {/* 1. HERO BANNER SECTION */}
      <div className="relative overflow-hidden lumix-card rounded-3xl p-6 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Hero Copy & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E3262E]/15 border border-[#E3262E]/30 rounded-full text-xs font-black text-[#E3262E] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Algorithmic Dynamic Pricing & 20Y Staking Protocol</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none font-sans">
              A Clear Path With{" "}
              <span className="text-[#E3262E]">Progressive Unlocks</span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Swiz Smart pioneers a 20-year progressive unlock model with an
              automated +2.33% compounding reference price per step and
              automatic FIFO buyback eligibility.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start">
              <Link
                to="/buy"
                className="w-full sm:w-auto px-8 py-4 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-105"
              >
                <span>Buy Swiz Tokens</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              {walletState.isConnected ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 liquid-glass-box hover:bg-white/10 text-white font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 hover:scale-105"
                >
                  <Lock className="w-5 h-5 text-[#E3262E]" />
                  <span>View Dashboard</span>
                </Link>
              ) : (
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 liquid-glass-box hover:bg-white/10 text-white font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 hover:scale-105"
                >
                  <span>Connect Web3 Wallet</span>
                </button>
              )}
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs text-gray-300 font-medium">
              <div className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>+2.33% / Step Price Formula</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>20-Year Unlock Tranches</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-1.5 col-span-2 sm:col-span-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>365-Day Annual Tranches</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Canvas */}
          <div className="lg:col-span-5 h-[340px] sm:h-[400px] w-full relative flex items-center justify-center">
            <Hero3DCanvas />
          </div>
        </div>
      </div>

      {/* 2. CORE PROTOCOL PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="lumix-card rounded-3xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E3262E]/15 border border-[#E3262E]/30 flex items-center justify-center text-[#E3262E]">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Algorithmic Dynamic Pricing
          </h3>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Reference price increases +2.33% compounded every 1,000 packages or
            $100,000 USD total protocol staking volume.
          </p>
        </div>

        <div className="lumix-card rounded-3xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E3262E]/15 border border-[#E3262E]/30 flex items-center justify-center text-[#E3262E]">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-white">
            20-Year Staking Schedule
          </h3>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Staked tokens unlock linearly at 5% per year across 20 annual
            tranches, with every tranche held in contract custody until bought
            back.
          </p>
        </div>

        <div className="lumix-card rounded-3xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E3262E]/15 border border-[#E3262E]/30 flex items-center justify-center text-[#E3262E]">
            <Repeat className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Automatic FIFO Buybacks
          </h3>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            New purchases match eligible tranches in FIFO order. Year 1 pays
            USDT.c; Years 2–20 issue ET to the original staker.
          </p>
        </div>
      </div>

      {/* 3. INTERACTIVE YIELD CALCULATOR */}
      <div className="lumix-card rounded-3xl p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-white">
            Interactive Reference Price Calculator
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm">
            Explore the reference-price formula by threshold steps. Steps are
            driven by package and purchase counters, not elapsed years or
            guaranteed returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-gray-300 flex justify-between mb-2">
                <span>USDT.c Purchase Amount</span>
                <span className="text-[#E3262E] font-bold text-sm">
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
                className="w-full accent-[#E3262E]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 flex justify-between mb-2">
                <span>Additional Threshold Steps</span>
                <span className="text-[#E3262E] font-bold text-sm">
                  {calcYears} Steps
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={calcYears}
                onChange={(e) => setCalcYears(Number(e.target.value))}
                className="w-full accent-[#E3262E]"
              />
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-6 space-y-3">
            <div className="text-xs text-gray-400">
              Initial Swiz Tokens Received:
            </div>
            <div className="text-2xl font-mono font-black text-white">
              {ready ? estimatedSwiz.toFixed(2) : "—"} Swiz
            </div>

            <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
              Illustrative Reference Price (+{calcYears} steps):
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">
              ${ready ? estimatedFuturePrice.toFixed(4) : "—"}
            </div>

            <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
              Illustrative Swiz × Reference Price:
            </div>
            <div className="text-2xl font-mono font-black text-[#E3262E]">
              ${ready ? estimatedFutureValue.toFixed(2) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PROTOCOL ANALYTICS CHARTS SECTION */}
      <ProtocolAnalyticsCharts />

      {/* 5. FIFO MATCHING ENGINE */}
      <div className="lumix-card rounded-3xl p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E3262E]/15 border border-[#E3262E]/30 rounded-full text-xs font-bold text-[#E3262E]">
              <Activity className="w-3.5 h-3.5" />
              <span>Smart Contract FIFO Engine</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              Live FIFO Order Matching Engine
            </h3>
          </div>
          <Link
            to="/buy"
            className="px-6 py-3 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
          >
            <span>Proceed to Buy Tokens Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="liquid-glass-box rounded-2xl p-5 space-y-2">
            <div className="text-xs text-white font-extrabold">
              1. Eligible Inventory Matching
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Purchases use USDT.c and match unlocked Swiz by the earliest
              eligible timestamp, subject to the original staker’s buyback price
              cap.
            </p>
          </div>

          <div className="liquid-glass-box rounded-2xl p-5 space-y-2">
            <div className="text-xs text-white font-extrabold">
              2. Treasury Inventory Fallback
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Unmatched Swiz comes from pre-minted treasury inventory and remains
              locked in contract custody. The corresponding payment goes to the
              company treasury.
            </p>
          </div>

          <div className="liquid-glass-box rounded-2xl p-5 space-y-2">
            <div className="text-xs text-white font-extrabold">
              3. 20-Year Supply Security
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Each package unlocks 5% at successive 365-day intervals. There is
              no APY, early withdrawal or guaranteed buyback demand.
            </p>
          </div>
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};
