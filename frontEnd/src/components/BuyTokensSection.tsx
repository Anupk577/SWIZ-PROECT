import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import { units } from "../context/Web3Context";
import { EXPLORER, ADDRESSES, SZ_ABI } from "../constants/contracts";
import { Interface, formatUnits } from "ethers";
import confetti from "canvas-confetti";
import {
  ShoppingCart,
  ArrowRight,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
export const BuyTokensSection: React.FC = () => {
  const {
    protocolStats,
    walletState,
    connectWallet,
    buy,
    loading,
    error,
    ready,
    stats,
    mintTestnetUsdt,
  } = useWeb3();
  const [usdtInput, setUsdtInput] = useState("1000"),
    [minimumOverride, setMinimumOverride] = useState<string | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<
    "idle" | "approve" | "processing" | "success"
  >("idle");
  const [txHash, setTxHash] = useState(""),
    [txError, setTxError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    quantity: bigint;
    packageId: bigint;
  } | null>(null);
  let usdtAmount = 0n;
  try {
    usdtAmount = units(usdtInput);
  } catch { }
  const usdtAmountVal = Number(usdtAmount) / 1e6,
    currentPrice = protocolStats.currentPriceUSD;
  const estimatedSwiz =
    currentPrice > 0n ? (usdtAmount * 1000000n) / currentPrice : 0n;
  const minimumSz =
    minimumOverride ??
    (estimatedSwiz > 0n ? formatUnits(estimatedSwiz, 6) : "");
  const formatTokens = (n: bigint) =>
    (Number(n) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 });
  const formatUSD = (n: bigint) => (ready ? formatUnits(n, 6) : "—");
  const statusText = "Awaiting wallet approval and on-chain confirmation…";
  const handleInitiateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    try {
      const value = units(usdtInput);
      units(minimumSz);
      if (!stats) throw Error("Protocol data is unavailable");
      if (value < stats.minimum || value > stats.maximum)
        throw Error(
          `Purchase range: ${formatUnits(stats.minimum, 6)}–${formatUnits(
            stats.maximum,
            6
          )} USDT.c`
        );
      setMinimumOverride(minimumSz);
      setConfirmed(null);
      setPurchaseStep("approve");
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Invalid purchase");
    }
  };
  const handleExecuteBuy = async () => {
    setTxError(null);
    setPurchaseStep("processing");
    let receipt;
    try {
      receipt = await buy(units(usdtInput), units(minimumSz));
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Purchase failed");
      setPurchaseStep("approve");
      return;
    }
    setTxHash(receipt.hash);
    // A confirmed transaction must never become a retry prompt because receipt rendering failed.
    const iface = new Interface(SZ_ABI);
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== ADDRESSES.sz.toLowerCase()) continue;
      try {
        const event = iface.parseLog(log);
        if (event?.name === "PurchaseCompleted")
          setConfirmed({
            quantity: event.args.quantity,
            packageId: event.args.packageId,
          });
      } catch {
        /* Unknown event: retain the confirmed transaction link. */
      }
    }
    setPurchaseStep("success");
    void confetti({
      particleCount: 80,
      spread: 60,
      colors: ["#E3262E", "#10B981"],
      disableForReducedMotion: true,
    });
  };
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="lumix-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#E3262E] rounded-2xl text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Purchase Swiz Tokens
              </h2>
              <p className="text-xs text-gray-300">
                Dedicated purchase gateway for 20-year progressive staking
                packages
              </p>
            </div>
          </div>

          <Link
            to="/bridge"
            className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Bridge USDT
          </Link>
        </div>

        {/* Wallet Connection Required Banner when Disconnected */}
        {!walletState.isConnected && (
          <div className="mb-6 p-5 bg-[#181d29] border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Wallet Connection Required</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold rounded-md border border-amber-500/30">
                    Action Needed
                  </span>
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  Connect your Web3 wallet (MetaMask, WalletConnect, Coinbase,
                  etc.) to purchase SZ staking packages on{" "}
                  {walletState.networkName}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={connectWallet}
              className="w-full sm:w-auto px-6 py-3 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-105"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {(txError || error) && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl space-y-3 text-red-300 text-sm animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <div className="min-w-0 break-words">
                <span className="font-bold">Notice: </span>
                <span>{txError || error}</span>
              </div>
            </div>
            {(txError || error)?.includes("Insufficient USDT") && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-red-500/30">
                <Link
                  to="/bridge"
                  className="px-4 py-2 bg-[#E3262E] hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Go to Bridge Page to Get USDT.c →</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setTxError(null);
                    try {
                      await mintTestnetUsdt();
                    } catch (e) {
                      setTxError(e instanceof Error ? e.message : "Minting failed");
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  <span>Mint 10,000 Testnet USDT</span>
                </button>
              </div>
            )}
          </div>
        )}

        {(stats?.paused || stats?.wrapperPaused) && (
          <p
            role="status"
            className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-sm"
          >
            Purchases are paused. Please check again after the protocol and
            payment token resume.
          </p>
        )}
        {/* 1. INPUT FORM STATE (IDLE) */}
        {purchaseStep === "idle" && (
          <form onSubmit={handleInitiateOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300 flex flex-wrap gap-2 justify-between items-center">
                  <label htmlFor="purchase-amount">USDT.c Payment Amount</label>
                  {walletState.isConnected ? (
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Balance:{" "}
                      {ready ? formatTokens(walletState.usdtBalance) : "—"}{" "}
                      USDT.c
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Connect Wallet</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={usdtInput}
                    id="purchase-amount"
                    onChange={(e) => {
                      setUsdtInput(e.target.value);
                      setMinimumOverride(null);
                    }}
                    placeholder="Enter USDT.c amount"
                    className="w-full liquid-glass-box focus:border-[#E3262E] rounded-xl px-4 py-3.5 text-lg font-mono text-white placeholder-gray-500 outline-none transition-all pr-20"
                  />
                  <div className="absolute right-3 top-3 px-2.5 py-1 bg-[#131926] border border-white/10 rounded-lg text-xs font-bold text-gray-300">
                    USDT.c
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 flex justify-between">
                  <span>You Receive (Swiz in Custody)</span>
                  <span>Reference Price: ${formatUSD(currentPrice)}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    aria-label="Estimated Swiz in custody"
                    value={ready ? formatTokens(estimatedSwiz) : "—"}
                    className="w-full liquid-glass-box rounded-xl px-4 py-3.5 text-lg font-mono text-[#E3262E] font-bold outline-none cursor-not-allowed pr-20"
                  />
                  <div className="absolute right-3 top-3 px-2.5 py-1 bg-[#E3262E]/20 border border-[#E3262E]/40 rounded-lg text-xs font-bold text-[#E3262E]">
                    SWIZ
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <label htmlFor="minimum-sz">Minimum Swiz to accept</label>
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={minimumSz}
                id="minimum-sz"
                onChange={(e) => {
                  setMinimumOverride(e.target.value);
                }}
                placeholder="Minimum Swiz after price changes"
                className="w-full liquid-glass-box focus:border-[#E3262E] rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>

            <div className="liquid-glass-box rounded-2xl p-4 space-y-2 text-xs text-gray-300">
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <span>Protocol Reference Price:</span>
                <span className="text-white font-mono">
                  ${formatUSD(currentPrice)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <span>Buyback FIFO Matching Status:</span>
                <span className="text-emerald-400 font-semibold">
                  {!ready
                    ? "Unavailable"
                    : protocolStats.buybackQueueLength > 0
                      ? "Eligible tranches checked on-chain"
                      : "Treasury inventory route"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <span>20-Year Schedule:</span>
                <span className="text-gray-300 font-semibold">
                  5% Annual Unlock (365 days interval)
                </span>
              </div>
            </div>

            {walletState.isConnected ? (
              <button
                type="submit"
                disabled={
                  usdtAmountVal <= 0 ||
                  !ready ||
                  loading ||
                  stats?.paused ||
                  stats?.wrapperPaused
                }
                className="btn-red-outline-lg w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Initiate Package Purchase</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="btn-red-outline-lg w-full py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-2.5 animate-pulse"
              >
                <Wallet className="w-5 h-5 text-white" />
                <span>Connect Wallet to Buy Tokens</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </form>
        )}

        {/* 2. APPROVAL CONFIRMATION STATE */}
        {purchaseStep === "approve" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-extrabold text-gray-300 border-b border-white/10 pb-3">
              <span className="text-[#FF4D52]">Review: USDT.c allowance</span>
              <span>Then confirm purchase</span>
            </div>

            <div className="liquid-glass-box rounded-2xl p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-gray-300">
                <span>USDT.c Payment:</span>
                <span className="text-white font-bold">
                  ${formatTokens(usdtAmount)} USDT.c
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Estimated Swiz:</span>
                <span className="text-[#FF4D52] font-bold">
                  {formatTokens(estimatedSwiz)} Swiz
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Minimum Swiz:</span>
                <span className="text-emerald-400 font-bold">
                  {minimumSz} Swiz
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPurchaseStep("idle")}
                className="w-1/3 py-3.5 liquid-glass-box text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={handleExecuteBuy}
                disabled={loading || !walletState.isConnected || !ready}
                className="btn-red-outline-lg w-2/3 py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <span>Approve & Purchase Package</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3. ORDER FILLING CIRCULAR RING ANIMATION STATE */}
        {purchaseStep === "processing" && (
          <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#1F2937"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#buyPageFillGrad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={80}
                  strokeLinecap="round"
                  className="animate-spin origin-center"
                />
                <defs>
                  <linearGradient
                    id="buyPageFillGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#E3262E" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-xl font-black text-white">Pending</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Confirmation
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
                <Loader2 className="w-5 h-5 animate-spin text-[#E3262E]" />
                <span>{statusText}</span>
              </div>
              <p className="text-xs text-gray-400 max-w-sm">
                Broadcasting smart contract transaction to the configured
                destination network.
              </p>
            </div>
          </div>
        )}

        {/* 4. SUCCESS CONFIRMATION STATE */}
        {purchaseStep === "success" && (
          <div className="py-6 space-y-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white">
                {confirmed
                  ? "Package Successfully Created!"
                  : "Purchase Transaction Confirmed"}
              </h3>
              <p className="text-xs text-gray-300">
                {confirmed
                  ? "Your 20-year progressive staking package is live on-chain."
                  : "Refresh your dashboard or open the transaction to view your package."}
              </p>
            </div>

            <div className="liquid-glass-box rounded-2xl p-5 space-y-2.5 font-mono text-xs text-left max-w-md mx-auto">
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <span className="text-gray-400">SZ in New Package:</span>
                <span className="text-[#E3262E] font-bold">
                  {confirmed
                    ? formatTokens(confirmed.quantity)
                    : "See transaction"}{" "}
                  SZ
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <span className="text-gray-400">Package ID:</span>
                <span className="text-emerald-400 font-bold">
                  #{confirmed?.packageId.toString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-gray-400">Tx Hash:</span>
                <a
                  href={`${EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline font-bold"
                >
                  {txHash.substring(0, 10)}...
                  {txHash.substring(txHash.length - 6)}
                </a>
              </div>
            </div>

            <button
              onClick={() => {
                setPurchaseStep("idle");
                setConfirmed(null);
                setMinimumOverride(null);
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Make Another Purchase</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
