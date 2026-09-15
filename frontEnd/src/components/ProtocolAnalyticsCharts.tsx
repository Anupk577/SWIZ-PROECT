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
import { TrendingUp, Layers, DollarSign } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
export function ProtocolAnalyticsCharts() {
  const { stats } = useWeb3();
  const [tab, setTab] = useState("reference");
  const curve = Array.from({ length: 11 }, (_, step) => ({
    label: `Step ${step}`,
    price: Math.pow(1.0233, step),
  }));
  const progress = stats
    ? [
      { label: "Packages", progress: Number(stats.packages % 1000n) / 10 },
      {
        label: "Purchase value",
        progress: Number(stats.value % 100000000000n) / 1000000000,
      },
    ]
    : [];
  return (
    <section className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-black flex gap-2 items-center">
            <TrendingUp className="w-5 h-5 text-[#E3262E]" />
            Protocol Analytics
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            {tab === "reference"
              ? "Illustrative formula by threshold step. This is not historical market performance."
              : "Current on-chain progress toward the next threshold for each counter."}
          </p>
        </div>
        <div className="flex gap-2 p-1.5 liquid-glass-box rounded-xl">
          {[
            ["reference", "Reference Formula"],
            ["progress", "Live Counters"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === key ? "bg-[#E3262E] text-white" : "text-gray-400"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="liquid-glass-box rounded-2xl p-4 text-sm">
          <Layers className="inline w-4 h-4 text-[#E3262E] mr-2" />
          {stats ? stats.packages.toString() : "—"} packages created
        </div>
        <div className="liquid-glass-box rounded-2xl p-4 text-sm">
          <DollarSign className="inline w-4 h-4 text-[#E3262E] mr-2" />
          {stats ? (Number(stats.value) / 1e6).toLocaleString() : "—"}{" "}
          cumulative USD value
        </div>
      </div>
      <div className="h-[300px] w-full min-w-0">
        {tab === "progress" && !stats ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Live counters are unavailable.
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
                    <stop offset="0%" stopColor="#E3262E" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#E3262E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1F2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 11 }}
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(n) => `$${n.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#131926",
                    border: "1px solid #374151",
                    borderRadius: 12,
                  }}
                />
                <Area
                  dataKey="price"
                  name="Illustrative reference price"
                  type="monotone"
                  stroke="#E3262E"
                  strokeWidth={3}
                  fill="url(#protocolPriceGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={progress}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1F2937"
                  vertical={false}
                />
                <XAxis dataKey="label" stroke="#9CA3AF" />
                <YAxis
                  domain={[0, 100]}
                  stroke="#9CA3AF"
                  tickFormatter={(n) => `${n}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#131926",
                    border: "1px solid #374151",
                  }}
                />
                <Bar
                  dataKey="progress"
                  name="Threshold progress (%)"
                  fill="#E3262E"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
