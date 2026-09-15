import React from "react";
import { BridgePanel } from "../components/ProtocolOperations";
import { Coins, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const DepositPage: React.FC = () => {
  return (
    <div className="w-full space-y-8 py-4 animate-fade-in relative">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden lumix-card rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E3262E]/15 border border-[#E3262E]/30 rounded-full text-xs font-black text-[#E3262E] uppercase tracking-wider">
              <Coins className="w-4 h-4 text-[#E3262E]" />
              <span>Dedicated Cross-Chain Bridge Module</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none font-sans">
              Cross-Chain USDT <span className="text-[#E3262E]">Bridge</span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed font-normal">
              Bridge source USDT from Ethereum, BNB Smart Chain, or Polygon to mint 1:1 destination USDT.c for Swiz staking package purchases.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/buy"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <span>Go to Buy Swiz Tokens</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4-Step Process Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 mt-6 border-t border-white/10 text-xs">
          <div className="liquid-glass-box rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#E3262E] text-white flex items-center justify-center font-black text-xs">1</div>
            <div>
              <div className="font-bold text-white">Bridge USDT</div>
              <div className="text-[11px] text-gray-400">Source Network</div>
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#E3262E] text-white flex items-center justify-center font-black text-xs">2</div>
            <div>
              <div className="font-bold text-white">Relayer Verification</div>
              <div className="text-[11px] text-gray-400">Block Confirmations</div>
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#E3262E] text-white flex items-center justify-center font-black text-xs">3</div>
            <div>
              <div className="font-bold text-white">USDT.c Minted</div>
              <div className="text-[11px] text-gray-400">1:1 Destination Collateral</div>
            </div>
          </div>

          <div className="liquid-glass-box rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">4</div>
            <div>
              <div className="font-bold text-white">Purchase Swiz</div>
              <div className="text-[11px] text-emerald-400">20Y Unlock Package</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BRIDGE PANEL MODULE */}
      <div className="lumix-card rounded-3xl p-6">
        <BridgePanel all={false} />
      </div>
    </div>
  );
};
