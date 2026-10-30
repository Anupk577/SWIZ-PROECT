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
  ShieldAlert,
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
    isWalletPaused,
    walletPauseReason,
  } = useWeb3();
  const [usdtInput, setUsdtInput] = useState("1000");
  const [minimumOverride, setMinimumOverride] = useState<string | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<
    "idle" | "approve" | "processing" | "success"
  >("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    quantity: bigint;
    packageId: bigint;
  } | null>(null);

  let usdtAmount = 0n;
  try {
    usdtAmount = units(usdtInput);
  } catch {}
  const usdtAmountVal = Number(usdtAmount) / 1e6;
  const currentPrice = protocolStats.currentPriceUSD;
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
    if (isWalletPaused) {
      setTxError(
        walletPauseReason ||
          "Cannot purchase packages: This wallet is paused / frozen by protocol administration."
      );
      return;
    }
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
    if (isWalletPaused) {
      setTxError(
        walletPauseReason ||
          "Cannot purchase packages: This wallet is paused / frozen by protocol administration."
      );
      setPurchaseStep("idle");
      return;
    }
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
      colors: ["#8B1A1A", "#10B981"],
      disableForReducedMotion: true,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="lumix-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="page-num mb-3">[GATEWAY // 20Y STAKING]</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#8B1A1A] rounded-xl text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="label mb-1">STAKING ACQUISITION</div>
              <h2 className="d-md text-[var(--ink)]">
                Purchase Swiz Tokens
              </h2>
              <p className="text-sm sm:text-base text-[var(--mid)] font-body font-medium">
                Dedicated purchase gateway for 20-year progressive unlock packages
              </p>
            </div>
          </div>

          <Link
            to="/bridge"
            className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-cond font-bold text-sm tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Bridge USDT</span>
          </Link>
        </div>

        {/* Wallet Connection Required Banner when Disconnected */}
        {!walletState.isConnected && (
          <div className="mb-6 p-6 bg-[var(--bg-card-sub)] border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 font-cond uppercase tracking-wider">
                  <span>Wallet Connection Required</span>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold rounded border border-amber-500/30">
                    Action Needed
                  </span>
                </h4>
                <p className="text-sm text-[var(--mid)] mt-1 font-body font-medium">
                  Connect your Web3 wallet (MetaMask, WalletConnect, Coinbase,
                  etc.) to purchase SZ staking packages on{" "}
                  {walletState.networkName}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={connectWallet}
              className="btn btn-red w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-bold shrink-0"
            >
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {(txError || error) && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-500/40 rounded-2xl space-y-3 text-red-950 dark:text-red-200 text-sm animate-fade-in font-medium shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-700 dark:text-red-300" />
              <div className="min-w-0 break-words font-semibold text-red-950 dark:text-red-100">
                <span className="font-bold">Notice: </span>
                <span>{txError || error}</span>
              </div>
            </div>
            {(txError || error)?.includes("Insufficient USDT") && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-red-300 dark:border-red-500/20">
                <Link
                  to="/bridge"
                  className="btn btn-red px-4 py-2 text-xs"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-cond font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
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
            className="mb-6 px-4 py-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-mono font-bold"
          >
            Purchases are paused. Please check again after the protocol and
            payment token resume.
          </p>
        )}

        {isWalletPaused && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-500/40 text-red-950 dark:text-red-200 flex items-start gap-3 shadow-sm"
          >
            <ShieldAlert className="w-5 h-5 text-red-700 dark:text-red-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-cond font-bold text-sm uppercase tracking-wider text-red-900 dark:text-red-300 flex items-center gap-2">
                <span>Wallet Operations Frozen / Paused</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-200 dark:bg-red-500/20 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-500/40 font-mono font-bold">
                  Emergency Freeze Active
                </span>
              </div>
              <p className="text-xs text-red-900 dark:text-red-200 font-body leading-relaxed font-medium">
                {walletPauseReason ||
                  "Your connected wallet has been paused by protocol administration. All token acquisitions, package purchases, and reward distributions are halted for this address."}
              </p>
            </div>
          </div>
        )}

        {/* 1. INPUT FORM STATE (IDLE) */}
        {purchaseStep === "idle" && (
          <form onSubmit={handleInitiateOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)] flex flex-wrap gap-2 justify-between items-center">
                  <label htmlFor="purchase-amount">USDT.c Payment Amount</label>
                  {walletState.isConnected ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Balance:{" "}
                      {ready ? formatTokens(walletState.usdtBalance) : "—"}{" "}
                      USDT.c
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={usdtInput}
                    disabled={isWalletPaused}
                    id="purchase-amount"
                    onChange={(e) => {
                      setUsdtInput(e.target.value);
                      setMinimumOverride(null);
                    }}
                    placeholder="Enter USDT.c amount"
                    className="w-full liquid-glass-box focus:border-[#8B1A1A] rounded-xl px-4 py-4 text-xl font-mono font-bold text-[var(--ink)] placeholder-[var(--muted)] outline-none transition-all pr-24 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-3.5 top-3.5 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm font-mono font-bold text-[var(--ink)]">
                    USDT.c
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)] flex justify-between">
                  <span>You Receive (Swiz in Custody)</span>
                  <span className="font-mono text-[#8B1A1A] dark:text-red-400">Ref: ${formatUSD(currentPrice)}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    aria-label="Estimated Swiz in custody"
                    value={ready ? formatTokens(estimatedSwiz) : "—"}
                    className="w-full liquid-glass-box rounded-xl px-4 py-4 text-xl font-mono text-[#8B1A1A] dark:text-red-400 font-extrabold outline-none cursor-not-allowed pr-24"
                  />
                  <div className="absolute right-3.5 top-3.5 px-3 py-1.5 bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 rounded-lg text-sm font-mono font-bold text-[#8B1A1A] dark:text-red-400">
                    SWIZ
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <label htmlFor="minimum-sz">Minimum Swiz to accept (Slippage Cap)</label>
                <Info className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={minimumSz}
                disabled={isWalletPaused}
                id="minimum-sz"
                onChange={(e) => {
                  setMinimumOverride(e.target.value);
                }}
                placeholder="Minimum Swiz after price changes"
                className="w-full liquid-glass-box focus:border-[#8B1A1A] rounded-xl px-4 py-3 text-sm sm:text-base font-mono font-bold text-[var(--ink)] placeholder-[var(--muted)] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="liquid-glass-box rounded-2xl p-5 space-y-3 text-sm font-mono text-[var(--mid)] font-medium">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-between">
                <span>Protocol Reference Price:</span>
                <span className="text-[var(--ink)] font-bold text-base">
                  ${formatUSD(currentPrice)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-between">
                <span>Buyback FIFO Matching Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {!ready
                    ? "Unavailable"
                    : protocolStats.buybackQueueLength > 0
                      ? "Eligible tranches checked on-chain"
                      : "Treasury inventory route"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-between">
                <span>20-Year Unlock Schedule:</span>
                <span className="text-[var(--ink)] font-bold">
                  5% Annual Unlock (365 days interval)
                </span>
              </div>
            </div>

            {walletState.isConnected ? (
              <button
                type="submit"
                disabled={
                  isWalletPaused ||
                  usdtAmountVal <= 0 ||
                  !ready ||
                  loading ||
                  stats?.paused ||
                  stats?.wrapperPaused
                }
                className={`w-full py-4 text-base font-bold flex items-center justify-center gap-2.5 rounded-2xl transition-all ${
                  isWalletPaused
                    ? "bg-red-500/20 text-red-500 border border-red-500/30 cursor-not-allowed opacity-90"
                    : "btn btn-red disabled:opacity-50"
                }`}
              >
                {isWalletPaused ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <span>Wallet Operations Frozen</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Initiate Package Purchase</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="btn btn-red w-full py-4.5 text-base font-bold flex items-center justify-center gap-3"
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
            <div className="flex items-center justify-between text-sm font-cond font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--border)] pb-3">
              <span className="text-[#8B1A1A] dark:text-red-400">Review: USDT.c allowance</span>
              <span>Then confirm purchase</span>
            </div>

            <div className="liquid-glass-box rounded-2xl p-6 space-y-4 font-mono text-sm sm:text-base">
              <div className="flex justify-between text-[var(--mid)] font-medium">
                <span>USDT.c Payment:</span>
                <span className="text-[var(--ink)] font-extrabold text-base sm:text-lg">
                  ${formatTokens(usdtAmount)} USDT.c
                </span>
              </div>
              <div className="flex justify-between text-[var(--mid)] font-medium">
                <span>Estimated Swiz:</span>
                <span className="text-[#8B1A1A] dark:text-red-400 font-extrabold text-base sm:text-lg">
                  {formatTokens(estimatedSwiz)} Swiz
                </span>
              </div>
              <div className="flex justify-between text-[var(--mid)] font-medium">
                <span>Minimum Swiz:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {minimumSz} Swiz
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPurchaseStep("idle")}
                className="w-1/3 py-4 btn btn-ink text-sm sm:text-base font-bold"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={handleExecuteBuy}
                disabled={loading || !walletState.isConnected || !ready || isWalletPaused}
                className={`w-2/3 py-4 text-sm sm:text-base font-bold flex items-center justify-center gap-2 rounded-xl ${
                  isWalletPaused
                    ? "bg-red-500/20 text-red-500 border border-red-500/30 cursor-not-allowed"
                    : "btn btn-red"
                }`}
              >
                {isWalletPaused ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <span>Wallet Frozen</span>
                  </>
                ) : (
                  <>
                    <span>Approve & Purchase Package</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 3. ORDER PROCESSING STATE */}
        {purchaseStep === "processing" && (
          <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="var(--border)"
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
                    <stop offset="0%" stopColor="#8B1A1A" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-2xl font-extrabold text-[var(--ink)]">Pending</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                  Confirmation
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2.5 text-base sm:text-lg font-bold text-[var(--ink)]">
                <Loader2 className="w-5 h-5 animate-spin text-[#8B1A1A]" />
                <span>{statusText}</span>
              </div>
              <p className="text-sm text-[var(--mid)] max-w-md font-body font-medium">
                Broadcasting smart contract transaction to the configured
                destination network.
              </p>
            </div>
          </div>
        )}

        {/* 4. SUCCESS CONFIRMATION STATE */}
        {purchaseStep === "success" && (
          <div className="py-6 space-y-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="d-md text-[var(--ink)]">
                {confirmed
                  ? "Package Successfully Created!"
                  : "Purchase Transaction Confirmed"}
              </h3>
              <p className="text-sm sm:text-base text-[var(--mid)] font-body font-medium max-w-lg mx-auto">
                {confirmed
                  ? "Your 20-year progressive unlock staking package is live on-chain."
                  : "Refresh your dashboard or open the transaction to view your package."}
              </p>
            </div>

            <div className="liquid-glass-box rounded-2xl p-6 space-y-3 font-mono text-sm sm:text-base text-left max-w-md mx-auto">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-between">
                <span className="text-[var(--muted)] font-medium">SZ in New Package:</span>
                <span className="text-[#8B1A1A] dark:text-red-400 font-extrabold text-base sm:text-lg">
                  {confirmed
                    ? formatTokens(confirmed.quantity)
                    : "See transaction"}{" "}
                  SZ
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-between">
                <span className="text-[var(--muted)] font-medium">Package ID:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                  #{confirmed?.packageId.toString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[var(--muted)] font-medium">Tx Hash:</span>
                <a
                  href={`${EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8B1A1A] dark:text-red-400 hover:underline font-bold"
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
              className="btn btn-red px-8 py-4 text-sm sm:text-base font-bold mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Make Another Purchase</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
