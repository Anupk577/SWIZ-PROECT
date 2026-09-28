import { useState } from "react";
import {
  Shield,
  UserPlus,
  DollarSign,
  Settings,
  History,
  ArrowLeftRight,
  Archive,
  Wallet,
  UserCheck,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { AdminOperations, type AdminTab } from "./ProtocolOperations";

const tabs = [
  { key: "offchain", label: "Record Offline Sale", icon: UserPlus },
  { key: "offchain-history", label: "Offline Sales History", icon: History },
  { key: "replace-wallet", label: "Replace Wallet", icon: UserCheck },
  { key: "liquidity", label: "Buyback Liquidity", icon: DollarSign },
  { key: "controls", label: "Protocol Controls", icon: Settings },
  { key: "records", label: "Wallets & Activity", icon: History },
  { key: "bridge", label: "Deposit Reconciliation", icon: ArrowLeftRight },
  { key: "migration", label: "Historical Migration", icon: Archive },
] as const;

export function AdminPanelSection() {
  const { isAdmin, connected, connect, stats } = useWeb3();
  const [tab, setTab] = useState<AdminTab>("offchain");
  if (!isAdmin)
    return (
      <div className="liquid-glass-red rounded-3xl p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto">
        <Shield className="w-12 h-12 text-[#E3262E] mx-auto" />
        <h2 className="text-2xl font-extrabold">Access Restricted</h2>
        <p className="text-sm text-gray-300">
          Connect an account holding the on-chain administrator role to access
          the Swiz Protocol Admin Panel.
        </p>
        {!connected && (
          <button
            className="btn-red-outline-lg rounded-xl px-6 py-3 inline-flex gap-2 items-center text-sm font-bold"
            onClick={() => void connect()}
          >
            <Wallet className="w-4 h-4" />
            Connect Admin Wallet
          </button>
        )}
      </div>
    );
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Command Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-red-950/40 via-[#0d111a] to-[#0d111a] border border-red-500/20 p-6 sm:p-7 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-[#E3262E] text-[11px] font-extrabold tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Protocol Governance Console • Admin Role</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E3262E] animate-ping"></span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Swiz Protocol Operations & Treasury</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
              Real-time multi-sig packages, buyback funding liquidity, emergency wallet replacement & freeze, and cross-chain reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-gray-300">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>Polygon Amoy (80002)</span>
            </div>

            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                stats?.paused
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                }`}
              ></span>
              <span>{stats?.paused ? "Protocol Paused" : "Protocol Online & Active"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Horizontal Navigation Bar */}
      <nav
        aria-label="Administration sections"
        className="bg-[#0b0e14] border border-white/10 rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-xl"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          const isRecovery = key === "replace-wallet";
          return (
            <button
              key={key}
              aria-pressed={isActive}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-[#E3262E] to-[#B31D24] text-white shadow-lg shadow-[#E3262E]/35 scale-[1.02]"
                  : isRecovery
                  ? "text-red-400 hover:text-white hover:bg-red-500/10 border border-red-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : isRecovery ? "text-red-400" : "text-gray-400"}`} />
              <span>{label}</span>
              {isRecovery && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${isActive ? "bg-black/30 text-white" : "bg-red-500/20 text-red-300"}`}>
                  Emergency
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {tab === "replace-wallet" ? (
        <div key={tab} className="mt-4">
          <AdminOperations tab={tab} />
        </div>
      ) : (
        <div className="protocol-operations" key={tab}>
          <AdminOperations tab={tab} />
        </div>
      )}
    </div>
  );
}
