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
      <div className="lumix-card rounded-3xl p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto">
        <div className="page-num mb-2">[01 // RESTRICTED]</div>
        <div className="w-14 h-14 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A] mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <div className="label">ROLE SECURITY VERIFICATION</div>
        <h2 className="d-md text-[var(--ink)]">Access Restricted</h2>
        <p className="text-xs sm:text-sm text-[var(--mid)] font-body leading-relaxed">
          Connect an account holding the on-chain administrator role to access
          the Swiz Protocol Governance Console.
        </p>
        {!connected && (
          <button
            className="btn btn-red text-xs py-3 px-6 mx-auto"
            onClick={() => void connect()}
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Admin Wallet</span>
          </button>
        )}
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Command Header */}
      <div className="relative rounded-3xl lumix-card border border-[var(--border)] p-6 sm:p-8 overflow-hidden">
        <div className="page-num mb-3">[GOVERNANCE // ADMINISTRATIVE CONSOLE]</div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="label">
              PROTOCOL GOVERNANCE & TREASURY
            </div>

            <h1 className="d-md text-[var(--ink)] tracking-tight">
              SWIZ PROTOCOL OPERATIONS & TREASURY
            </h1>

            <div className="rule" />

            <p className="text-xs sm:text-sm text-[var(--mid)] max-w-3xl leading-relaxed font-body">
              Real-time multi-sig packages, buyback funding liquidity, emergency wallet replacement & freeze, and cross-chain reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card-sub)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>Polygon Amoy (80002)</span>
            </div>

            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                stats?.paused
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.paused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
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
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-sm"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          const isRecovery = key === "replace-wallet";
          return (
            <button
              key={key}
              aria-pressed={isActive}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-cond font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#8B1A1A] text-white shadow-md shadow-[#8B1A1A]/35"
                  : isRecovery
                  ? "text-[#8B1A1A] hover:bg-[#8B1A1A]/10 border border-[#8B1A1A]/20"
                  : "text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--bg-card-sub)]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : isRecovery ? "text-[#8B1A1A]" : "text-[var(--mid)]"}`} />
              <span>{label}</span>
              {isRecovery && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${isActive ? "bg-black/30 text-white" : "bg-[#8B1A1A]/15 text-[#8B1A1A]"}`}>
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
