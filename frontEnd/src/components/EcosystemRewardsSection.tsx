import { Coins, Zap, ArrowUpRight } from "lucide-react";
import { formatUnits } from "ethers";
import { useWeb3 } from "../context/Web3Context";
export function EcosystemRewardsSection() {
  const { balances, packages } = useWeb3();
  const received = packages.reduce((n, p) => n + p.etReceived, 0n);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="liquid-glass-red rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex gap-2 items-center px-3 py-1 rounded-full text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Coins className="w-4 h-4" />
              Swiz Ecosystem Token
            </span>
            <h2 className="text-3xl font-black">
              Ecosystem Token (ET) Dashboard
            </h2>
            <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
              ET is issued directly to the original staker during Years 2–20
              buybacks. Your transferable balance may differ from total receipts
              if you have transferred ET.
            </p>
          </div>
          <div className="liquid-glass-box rounded-2xl p-6 min-w-0 w-full md:w-auto md:min-w-[260px] text-center border border-emerald-500/40">
            <p className="text-xs text-gray-400">Your ET Balance</p>
            <p className="text-3xl font-black font-mono my-3">
              {balances ? formatUnits(balances.et, 6) : "—"}{" "}
              <span className="text-emerald-400 text-xl">ET</span>
            </p>
            <span className="text-xs text-emerald-400">
              Issued automatically on eligible buybacks
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "ET Received",
            subtitle: `${formatUnits(received, 6)} ET across your packages`,
            body: "One ET is issued per dollar of applicable substituted payout. ET has no USDT redemption right or treasury claim.",
            icon: <Zap className="w-5 h-5" />,
          },
          {
            title: "Year 1 Buyback Payout",
            subtitle: "100% USDT.c to your wallet",
            body: "The first annual tranche pays the original staker in USDT.c when matched. The buyback price cap applies.",
            icon: "Y1",
          },
          {
            title: "Years 2–20 Buyback Payout",
            subtitle: "100% ET to your wallet",
            body: "Later annual tranches issue ET instead of a USDT.c payout. No purchase bonus or manual ET mint is available.",
            icon: "Y2+",
          },
        ].map((c, i) => (
          <div
            key={c.title}
            className={`${
              i === 2 ? "liquid-glass-red" : "liquid-glass"
            } rounded-2xl p-6 space-y-4`}
          >
            <div className="flex gap-3 items-center">
              <span className="w-10 h-10 rounded-xl bg-[#E3262E]/20 border border-[#E3262E]/40 text-[#E3262E] font-bold flex justify-center items-center">
                {c.icon}
              </span>
              <h3 className="font-extrabold text-base">{c.title}</h3>
            </div>
            <p className="text-xs text-emerald-400 font-semibold flex gap-1 items-center">
              {c.subtitle}
              <ArrowUpRight className="w-3 h-3" />
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
