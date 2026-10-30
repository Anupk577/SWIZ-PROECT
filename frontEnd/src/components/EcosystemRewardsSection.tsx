import { Zap, ArrowUpRight } from "lucide-react";
import { formatUnits } from "ethers";
import { useWeb3 } from "../context/Web3Context";

export function EcosystemRewardsSection() {
  const { balances, packages } = useWeb3();
  const received = packages.reduce((n, p) => n + p.etReceived, 0n);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="lumix-card rounded-3xl p-6 sm:p-8">
        <div className="page-num mb-3">[REWARDS // ECOSYSTEM TOKENS]</div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <div className="label">
              AUTOMATIC LIQUIDITY DISTRIBUTIONS
            </div>
            <h2 className="d-md text-[var(--ink)]">
              Ecosystem Token (ET) Dashboard
            </h2>
            <div className="rule" />
            <p className="text-xs sm:text-sm text-[var(--mid)] max-w-xl leading-relaxed font-body">
              ET is issued directly to the original staker during Years 2–20
              buybacks. Your transferable balance may differ from total receipts
              if you have transferred ET.
            </p>
          </div>
          <div className="liquid-glass-box rounded-2xl p-6 min-w-0 w-full md:w-auto md:min-w-[260px] text-center border border-emerald-500/30">
            <p className="text-xs font-cond font-bold uppercase tracking-wider text-[var(--muted)]">Your ET Balance</p>
            <p className="text-3xl font-bold font-mono my-2 text-[var(--ink)]">
              {balances ? formatUnits(balances.et, 6) : "—"}{" "}
              <span className="text-emerald-500 text-xl font-cond">ET</span>
            </p>
            <span className="text-[11px] font-mono text-emerald-500">
              Issued on eligible buybacks
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
            icon: <span className="font-mono font-bold text-sm">Y1</span>,
          },
          {
            title: "Years 2–20 Buyback Payout",
            subtitle: "100% ET to your wallet",
            body: "Later annual tranches issue ET instead of a USDT.c payout. No purchase bonus or manual ET mint is available.",
            icon: <span className="font-mono font-bold text-sm">Y2+</span>,
          },
        ].map((c) => (
          <div
            key={c.title}
            className="lumix-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex gap-3 items-center">
              <span className="w-10 h-10 rounded-xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold flex justify-center items-center">
                {c.icon}
              </span>
              <h3 className="font-cond font-bold text-base uppercase tracking-wider text-[var(--ink)]">{c.title}</h3>
            </div>
            <p className="text-xs text-emerald-500 font-mono font-semibold flex gap-1 items-center">
              {c.subtitle}
              <ArrowUpRight className="w-3 h-3" />
            </p>
            <p className="text-xs text-[var(--mid)] leading-relaxed font-body">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
