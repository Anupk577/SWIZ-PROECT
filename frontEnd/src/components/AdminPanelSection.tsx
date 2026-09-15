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
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { AdminOperations, type AdminTab } from "./ProtocolOperations";

const tabs = [
  { key: "offchain", label: "Offline Sales", icon: UserPlus },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#E3262E]" />
            Swiz Protocol Admin Panel
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Offline packages, buyback funding, protocol controls, and confirmed
            activity.
          </p>
        </div>
        <span
          className={`text-xs font-bold px-4 py-2 rounded-xl border ${
            stats?.paused
              ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {stats?.paused ? "Protocol Paused" : "Protocol Active"}
        </span>
      </div>
      <nav
        aria-label="Administration sections"
        className="flex flex-wrap gap-2 border-b border-gray-800 pb-4"
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              tab === key
                ? "bg-[#E3262E] text-white shadow-[0_0_15px_rgba(227,38,46,0.4)]"
                : "bg-[#131926] border border-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="protocol-operations" key={tab}>
        <AdminOperations tab={tab} />
      </div>
    </div>
  );
}
