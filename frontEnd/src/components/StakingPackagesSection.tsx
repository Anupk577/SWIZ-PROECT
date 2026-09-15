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
  const { userPackages, ready } = useUiData();
  const [selected, setSelected] = useState<number | null>(null),
    [filter, setFilter] = useState("all");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#E3262E]" />
            My Staking Packages
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            5% annual tranches. Unlocked inventory automatically becomes
            eligible for FIFO buybacks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 liquid-glass-box rounded-2xl">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["queue", "Eligible"],
            ["boughtBack", "Bought Back"],
          ].map(([key, title], i) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filter === key
                  ? "bg-[#E3262E] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {title} ({ready ? counts[i] : "—"})
            </button>
          ))}
        </div>
      </div>
      {!ready ? (
        <div className="liquid-glass rounded-3xl p-8 text-gray-400">
          Package data is unavailable.
        </div>
      ) : rows.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 text-center space-y-5">
          <Layers className="w-12 h-12 text-[#E3262E] mx-auto" />
          <h3 className="text-xl font-extrabold">No packages in this view</h3>
          <Link
            to="/buy"
            className="btn-red-outline-lg inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-bold"
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Swiz
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((p) => (
            <div
              key={p.packageId}
              className="liquid-glass liquid-card-interactive rounded-3xl p-6 flex flex-col space-y-5 relative min-w-0"
            >
              <div className="flex flex-wrap gap-2 items-center justify-between border-b border-white/10 pb-3">
                <span className="px-3 py-1 bg-[#E3262E]/20 border border-[#E3262E]/40 text-[#E3262E] text-xs font-extrabold font-mono rounded-xl">
                  Pkg #{p.packageId}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${
                    p.isFullyBoughtBack
                      ? "text-purple-300 bg-purple-500/20 border-purple-500/30"
                      : p.isUnstakedForBuyback
                      ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30"
                      : "text-blue-400 bg-blue-500/20 border-blue-500/30"
                  }`}
                >
                  {p.isFullyBoughtBack ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Repeat className="w-3 h-3" />
                  )}
                  {p.isFullyBoughtBack
                    ? "Bought Back"
                    : p.isUnstakedForBuyback
                    ? "Eligible for FIFO"
                    : "Active 20Y"}
                </span>
              </div>
              <div className="liquid-glass-box rounded-2xl p-4 space-y-3 font-mono text-xs">
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
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white text-right break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">
                Start:{" "}
                {new Date(p.stakingTimestamp * 1000).toLocaleDateString()} ·{" "}
                {p.isOffline ? "Offline sale" : "Online purchase"}
              </p>
              <button
                onClick={() =>
                  setSelected(selected === p.packageId ? null : p.packageId)
                }
                aria-expanded={selected === p.packageId}
                className="btn-red-outline-lg py-3 text-xs font-bold rounded-xl"
              >
                {selected === p.packageId ? "Hide" : "View"} 20-Year Schedule
              </button>
              {selected === p.packageId && (
                <div
                  className="space-y-2 max-h-80 overflow-y-auto"
                  aria-label={`Package ${p.packageId} schedule`}
                >
                  {p.schedule.map((s, i) => (
                    <div
                      key={i}
                      className="liquid-glass-box rounded-lg p-3 text-[11px] space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="flex gap-1 items-center">
                          {s.status === 0 ? (
                            <Lock className="w-3 h-3 text-gray-500" />
                          ) : (
                            <Unlock className="w-3 h-3 text-emerald-400" />
                          )}
                          Year {i + 1}
                        </span>
                        <span>
                          {new Date(
                            Number(s.unlockTimestamp) * 1000
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-400">
                        {formatUnits(s.quantity, 6)} Swiz · Filled{" "}
                        {formatUnits(s.boughtBack, 6)} Swiz
                      </p>
                      <p className="text-emerald-400">
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
