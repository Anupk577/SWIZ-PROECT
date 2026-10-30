import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Layers } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useTheme } from "../context/ThemeContext";

export function ProtocolAnalyticsCharts() {
  const { stats } = useWeb3();
  const { isDark } = useTheme();
  const [tab, setTab] = useState("reference");

  const curve = Array.from({ length: 11 }, (_, step) => ({
    label: `Step ${step}`,
    price: Math.pow(1.0233, step),
  }));

  const progress = stats
    ? [
        { label: "Package Threshold (per 1,000)", progress: Number(stats.packages % 1000n) / 10 },
      ]
    : [];

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
    <section className="lumix-card rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="label mb-2">ON-CHAIN FORMULA</div>
          <h3 className="text-2xl font-display uppercase tracking-wide flex gap-2 items-center text-[var(--ink)]">
            <TrendingUp className="w-5 h-5 text-[#8B1A1A]" />
            Protocol Dynamic Analytics
          </h3>
          <p className="text-xs text-[var(--mid)] mt-1 font-body">
            {tab === "reference"
              ? "Illustrative formula by threshold step (+2.33% compounded). Counter-driven parameters."
              : "Current on-chain progress toward the next threshold step."}
          </p>
        </div>

        <div className="flex gap-1.5 p-1 liquid-glass-box rounded-xl">
          {[
            ["reference", "Reference Formula"],
            ["progress", "Live Counters"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-xs font-cond font-bold uppercase tracking-wider transition-all cursor-pointer ${
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

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="liquid-glass-box rounded-2xl p-4 text-xs font-mono">
          <Layers className="inline w-4 h-4 text-[#8B1A1A] mr-2" />
          <span className="font-bold text-[var(--ink)]">
            {stats ? stats.packages.toString() : "—"}
          </span>{" "}
          <span className="text-[var(--mid)]">Packages Created</span>
        </div>
        <div className="liquid-glass-box rounded-2xl p-4 text-xs font-mono">
          <TrendingUp className="inline w-4 h-4 text-emerald-500 mr-2" />
          <span className="font-bold text-[var(--ink)]">
            ${stats ? (Number(stats.price) / 1e6).toFixed(4) : "1.0000"}
          </span>{" "}
          <span className="text-[var(--mid)]">Reference Price (USD)</span>
        </div>
      </div>

      <div className="h-[300px] w-full min-w-0">
        {tab === "progress" && !stats ? (
          <div className="h-full flex items-center justify-center text-[var(--mid)] text-xs font-mono">
            Live counters are initializing…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {tab === "reference" ? (
              <AreaChart
                data={curve}
                margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="protocolPriceGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#8B1A1A" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#8B1A1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(n) => `$${n.toFixed(2)}`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  dataKey="price"
                  name="Reference Price"
                  type="monotone"
                  stroke="#8B1A1A"
                  strokeWidth={2.5}
                  fill="url(#protocolPriceGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={progress}>
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
                  domain={[0, 100]}
                  stroke={textColor}
                  tick={{ fontSize: 11, fontFamily: "var(--mono)" }}
                  tickFormatter={(n) => `${n}%`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="progress"
                  name="Threshold progress (%)"
                  fill="#8B1A1A"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
