import React from "react";
import { useUiData as useWeb3 } from "../hooks/useUiData";

export const TickerBanner: React.FC = () => {
  const { protocolStats, ready } = useWeb3();

  const rawPriceBig = protocolStats.currentPriceUSD;
  const priceFormatted = ready && rawPriceBig > 0n
    ? `$${(Number(rawPriceBig) / 1e6).toFixed(4)}`
    : "$1.0000";

  const tickerItems = [
    { label: "SWIZ PROTOCOL", value: "LIVE" },
    { label: "REFERENCE PRICE", value: `${priceFormatted} USD` },
    { label: "PRICE FORMULA", value: "+2.33% / STEP" },
    { label: "UNLOCK SCHEDULE", value: "20-YEAR LINEAR (5% / YR)" },
    { label: "MATCHING ENGINE", value: "FIFO RECONCILED" },
    { label: "NETWORK", value: "POLYGON AMOY (80002)" },
    { label: "CONTRACT CUSTODY", value: "NON-CUSTODIAL MULTI-SIG" },
    { label: "BUYBACK LIQUIDITY", value: "USDT.c AUTOMATED" },
    { label: "ZERO IMPERMANENT LOSS", value: "GUARANTEED STAKING TRANCHES" },
  ];

  return (
    <div className="w-full bg-[#141416] border-b border-white/10 overflow-hidden select-none py-3 text-sm sm:text-base font-cond font-bold tracking-wider uppercase">
      <div className="ticker-track flex items-center">
        {/* Set 1 */}
        <div className="ticker-set flex items-center shrink-0">
          {tickerItems.map((item, idx) => (
            <React.Fragment key={`set1-${idx}`}>
              <div className="flex items-center gap-2.5 px-6">
                <span className="text-white font-semibold tracking-wide">{item.label}:</span>
                <span className="text-[#FF4D4D] font-extrabold">{item.value}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#FF4D4D] shrink-0" />
            </React.Fragment>
          ))}
        </div>

        {/* Set 2 (for continuous loop) */}
        <div className="ticker-set flex items-center shrink-0" aria-hidden="true">
          {tickerItems.map((item, idx) => (
            <React.Fragment key={`set2-${idx}`}>
              <div className="flex items-center gap-2.5 px-6">
                <span className="text-white font-semibold tracking-wide">{item.label}:</span>
                <span className="text-[#FF4D4D] font-extrabold">{item.value}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#FF4D4D] shrink-0" />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
