import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useTheme } from "../context/ThemeContext";

export function UserPortfolioCharts() {
  const { packages, isWalletMigrated } = useWeb3();
  const { isDark } = useTheme();
  const [tab, setTab] = useState("inventory");

  const data = packages.map((p) => ({
    label: `Pkg #${p.id}`,
    remaining: Number(p.amount - p.boughtBack) / 1e6,
    boughtBack: Number(p.boughtBack) / 1e6,
    et: Number(p.etReceived) / 1e6,
  }));

  const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textColor = isDark ? "#A0A09C" : "#7E7E7E";
  const tooltipStyle = {
    background: isDark ? "#191919" : "#FFFFFF",
    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: "10px",
    color: isDark ? "#F5F4F0" : "#141414",
    boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.08)",
    fontFamily: "var(--cond)",
  };

  return (
    <div className="lumix-card rounded-3xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="label mb-2">PORTFOLIO INTELLIGENCE</div>
          <h3 className="font-display text-2xl uppercase tracking-wide flex items-center gap-2 text-[var(--ink)]">
            <TrendingUp className="w-5 h-5 text-[#8B1A1A]" />
            Your Package Analytics
          </h3>
          <p className="text-xs text-[var(--mid)] mt-1 font-body">
            Current on-chain quantities and cumulative ET receipts by package.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 liquid-glass-box rounded-xl">
          {[
            ["inventory", "Swiz Inventory"],
            ["rewards", "ET Received"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-xs font-cond font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                tab === key
                  ? "bg-[#8B1A1A] text-white shadow-sm"
                  : "text-[var(--mid)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[300px] min-w-0">
        {!data.length ? (
          <p className="text-[var(--mid)] text-xs font-mono py-20 text-center">
            {isWalletMigrated
              ? "No active package inventory. All staking packages were migrated to recovery wallet."
              : "Your package analytics will appear after a confirmed purchase."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke={textColor}
                tick={{ fontSize: 11, fontFamily: "var(--cond)" }}
              />
              <YAxis
                stroke={textColor}
                tick={{ fontSize: 11, fontFamily: "var(--mono)" }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--cond)" }} />
              {tab === "inventory" ? (
                <>
                  <Bar
                    dataKey="remaining"
                    name="Swiz in custody"
                    fill="#8B1A1A"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="boughtBack"
                    name="Swiz bought back"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                </>
              ) : (
                <Bar
                  dataKey="et"
                  name="ET received"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
