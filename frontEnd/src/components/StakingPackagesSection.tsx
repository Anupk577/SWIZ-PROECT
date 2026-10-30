import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Lock,
  Unlock,
  Repeat,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useUiData } from "../hooks/useUiData";
import { formatUnits } from "ethers";

export function StakingPackagesSection() {
  const { userPackages, ready, isWalletMigrated, migratedToWallet, secondaryWallet } = useUiData();
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");

  const rows = userPackages.filter((p) =>
    filter === "active"
      ? !p.isFullyBoughtBack
      : filter === "queue"
      ? p.isUnstakedForBuyback
      : filter === "boughtBack"
      ? p.isFullyBoughtBack
      : true
  );

  const counts = [
    userPackages.length,
    userPackages.filter((p) => !p.isFullyBoughtBack).length,
    userPackages.filter((p) => p.isUnstakedForBuyback).length,
    userPackages.filter((p) => p.isFullyBoughtBack).length,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="label mb-1">STAKED ASSETS</div>
          <h2 className="d-md text-[var(--ink)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8B1A1A]" />
            My Staking Packages
          </h2>
          <p className="text-sm text-[var(--mid)] mt-1 font-body font-medium">
            5% annual tranches. Unlocked inventory automatically becomes
            eligible for FIFO buybacks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 liquid-glass-box rounded-xl">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["queue", "Eligible"],
            ["boughtBack", "Bought Back"],
          ].map(([key, title], i) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-cond font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                filter === key
                  ? "bg-[#8B1A1A] text-white shadow-sm"
                  : "text-[var(--mid)] hover:text-[var(--ink)]"
              }`}
            >
              {title} ({ready ? counts[i] : "—"})
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <div className="lumix-card rounded-3xl p-8 text-[var(--mid)] font-mono text-sm">
          Package data is unavailable.
        </div>
      ) : rows.length === 0 ? (
        <div className="lumix-card rounded-3xl p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A] mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="d-md text-[var(--ink)]">
            {isWalletMigrated ? "Packages Migrated to Recovery Account" : "No packages in this view"}
          </h3>
          <p className="text-sm text-[var(--mid)] font-body max-w-md mx-auto leading-relaxed font-medium">
            {isWalletMigrated ? (
              <>
                All staking packages and FIFO buyback rights for this address were securely transferred to recovery wallet{" "}
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold break-all">
                  {migratedToWallet || secondaryWallet}
                </span>
                . Please connect with your recovery wallet to view and manage packages.
              </>
            ) : (
              "Purchase a Swiz 20-year progressive unlock package to begin earning FIFO returns."
            )}
          </p>
          {!isWalletMigrated && (
            <Link
              to="/buy"
              className="btn btn-red px-8 py-4 text-sm sm:text-base font-bold inline-flex"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Purchase Swiz</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((p) => (
            <div
              key={p.packageId}
              className="lumix-card rounded-3xl p-6 flex flex-col space-y-4 relative min-w-0"
            >
              <div className="flex flex-wrap gap-2 items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="px-3 py-1.5 bg-[#8B1A1A]/15 border border-[#8B1A1A]/30 text-[#8B1A1A] dark:text-red-400 text-sm font-bold font-mono rounded-lg">
                  Pkg #{p.packageId}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-cond font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                    p.isFullyBoughtBack
                      ? "text-purple-600 dark:text-purple-300 bg-purple-500/10 border-purple-500/30"
                      : p.isUnstakedForBuyback
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      : "text-blue-600 dark:text-blue-300 bg-blue-500/10 border-blue-500/30"
                  }`}
                >
                  {p.isFullyBoughtBack ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Repeat className="w-3.5 h-3.5" />
                  )}
                  {p.isFullyBoughtBack
                    ? "Bought Back"
                    : p.isUnstakedForBuyback
                    ? "Eligible for FIFO"
                    : "Active 20Y"}
                </span>
              </div>

              <div className="liquid-glass-box rounded-2xl p-5 space-y-3 font-mono text-xs sm:text-sm">
                {[
                  [
                    "Original Purchase",
                    `$${formatUnits(p.stakedAmountUSD, 6)}`,
                  ],
                  ["Swiz in Custody", formatUnits(p.currentStakedSZ, 6)],
                  ["Entry Price", `$${formatUnits(p.purchasePriceUSD, 6)}`],
                  ["Bought Back (Swiz)", formatUnits(p.boughtBack, 6)],
                  ["USDT.c Received", formatUnits(p.usdtReceived, 6)],
                  ["ET Received", formatUnits(p.etReceived, 6)],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 justify-between">
                    <span className="text-[var(--mid)] font-medium">{label}</span>
                    <span className="text-[var(--ink)] font-bold text-right break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-mono text-[var(--mid)] font-medium">
                Start:{" "}
                {new Date(p.stakingTimestamp * 1000).toLocaleDateString()} ·{" "}
                {p.isOffline ? "Offline sale" : "Online purchase"}
              </p>

              <button
                onClick={() =>
                  setSelected(selected === p.packageId ? null : p.packageId)
                }
                aria-expanded={selected === p.packageId}
                className="btn btn-ink py-3 text-xs sm:text-sm font-cond font-bold uppercase tracking-wider"
              >
                {selected === p.packageId ? "Hide" : "View"} 20-Year Schedule
              </button>

              {selected === p.packageId && (
                <div
                  className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar"
                  aria-label={`Package ${p.packageId} schedule`}
                >
                  {p.schedule.map((s, i) => (
                    <div
                      key={i}
                      className="liquid-glass-box rounded-xl p-3.5 text-xs space-y-1.5 font-mono"
                    >
                      <div className="flex justify-between items-center">
                        <span className="flex gap-1.5 items-center font-bold text-[var(--ink)]">
                          {s.status === 0 ? (
                            <Lock className="w-3.5 h-3.5 text-[var(--muted)]" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          Year {i + 1}
                        </span>
                        <span className="text-[var(--mid)] font-medium">
                          {new Date(
                            Number(s.unlockTimestamp) * 1000
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[var(--mid)] font-medium">
                        {formatUnits(s.quantity, 6)} Swiz · Filled{" "}
                        {formatUnits(s.boughtBack, 6)} Swiz
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {
                          ["Locked", "Eligible for buyback", "Bought back"][
                            s.status
                          ]
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
