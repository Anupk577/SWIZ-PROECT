import React from "react";
import { BridgePanel } from "../components/ProtocolOperations";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const DepositPage: React.FC = () => {
  return (
    <div className="w-full space-y-8 py-4 animate-fade-in relative">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden lumix-card rounded-3xl p-6 sm:p-10 border border-[var(--border)]">
        <div className="page-num mb-3">[BRIDGE // COLLATERAL INGESTION]</div>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center lg:text-left">
            <div className="label">
              CROSS-CHAIN LIQUIDITY MODULE
            </div>

            <h1 className="d-lg text-[var(--ink)] tracking-tight">
              CROSS-CHAIN USDT <span className="text-[#8B1A1A]">BRIDGE</span>
            </h1>

            <div className="rule" />

            <p className="text-[var(--mid)] text-sm sm:text-base max-w-2xl leading-relaxed font-body">
              Bridge source USDT from Ethereum, BNB Smart Chain, or Polygon to mint 1:1 destination USDT.c for Swiz staking package purchases.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/buy"
              className="btn btn-red w-full sm:w-auto px-7 py-4 text-sm sm:text-base font-bold shadow-md"
            >
              <span>Go to Buy Swiz Tokens</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* 4-Step Process Bar (Styled like swizcoin.io .journey-steps) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-8 mt-6 border-t border-[var(--border)] text-xs">
          <div className="liquid-glass-box rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B1A1A] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">1</div>
            <div>
              <div className="font-cond font-bold uppercase text-sm text-[var(--ink)]">Bridge USDT</div>
              <div className="text-xs font-mono text-[var(--mid)] font-medium">Source Network</div>
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B1A1A] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">2</div>
            <div>
              <div className="font-cond font-bold uppercase text-sm text-[var(--ink)]">Verification</div>
              <div className="text-xs font-mono text-[var(--mid)] font-medium">Confirmations</div>
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B1A1A] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">3</div>
            <div>
              <div className="font-cond font-bold uppercase text-sm text-[var(--ink)]">USDT.c Minted</div>
              <div className="text-xs font-mono text-[var(--mid)] font-medium">1:1 Collateral</div>
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">4</div>
            <div>
              <div className="font-cond font-bold uppercase text-sm text-[var(--ink)]">Purchase Swiz</div>
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">20Y Package</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BRIDGE PANEL MODULE */}
      <div className="lumix-card rounded-3xl p-6 sm:p-8">
        <BridgePanel all={false} />
      </div>
    </div>
  );
};
