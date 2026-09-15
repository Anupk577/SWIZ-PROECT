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
export function UserPortfolioCharts() {
  const { packages } = useWeb3();
  const [tab, setTab] = useState("inventory");
  const data = packages.map((p) => ({
    label: `Pkg #${p.id}`,
    remaining: Number(p.amount - p.boughtBack) / 1e6,
    boughtBack: Number(p.boughtBack) / 1e6,
    et: Number(p.etReceived) / 1e6,
  }));
  return (
    <div className="liquid-glass rounded-3xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#E3262E]" />
            Your Package Analytics
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Current on-chain quantities and cumulative ET receipts by package.
          </p>
        </div>
        <div className="flex gap-2 p-1.5 liquid-glass-box rounded-xl">
          {[
            ["inventory", "Swiz Inventory"],
            ["rewards", "ET Received"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-xs font-bold rounded-lg ${
                tab === key ? "bg-[#E3262E] text-white" : "text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-[300px] min-w-0">
        {!data.length ? (
          <p className="text-gray-400 text-sm py-20 text-center">
            Your package analytics will appear after a confirmed purchase.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F2937"
                vertical={false}
              />
              <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#131926",
                  border: "1px solid #374151",
                  borderRadius: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {tab === "inventory" ? (
                <>
                  <Bar
                    dataKey="remaining"
                    name="Swiz in custody"
                    fill="#E3262E"
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
