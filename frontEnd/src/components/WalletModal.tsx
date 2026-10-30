import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWeb3 } from "../context/Web3Context";
import { Wallet, X, Zap, ArrowRight, ExternalLink, CheckCircle2, ShieldAlert } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { connectInjected, openAppKitModal } = useWeb3();
  const [hasInjected, setHasInjected] = useState<boolean>(false);
  const [connectingInjected, setConnectingInjected] = useState<boolean>(false);
  const [injectedError, setInjectedError] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasInjected(Boolean((window as any).ethereum));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectInjected = async () => {
    setConnectingInjected(true);
    setInjectedError("");
    try {
      await connectInjected();
      onClose();
    } catch (e: any) {
      console.warn("Direct injected connect warning:", e);
      const msg = e?.message || "Failed to connect browser extension";
      if (msg.includes("User rejected") || msg.includes("4001")) {
        setInjectedError("Connection request was cancelled in your wallet.");
      } else if (msg.includes("Already processing") || msg.includes("-32002")) {
        setInjectedError("A request is already pending in MetaMask. Please open your MetaMask extension icon to approve it.");
      } else {
        setInjectedError(msg);
      }
    } finally {
      setConnectingInjected(false);
    }
  };

  const handleOpenAppKit = async () => {
    onClose();
    await openAppKitModal();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect Web3 Wallet"
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto lumix-card rounded-3xl p-6 my-auto custom-scrollbar z-[1000000] border border-[var(--border)] shadow-2xl"
      >
        {/* Close Button */}
        <button
          aria-label="Close wallet dialog"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--mid)] hover:text-[var(--ink)] transition-colors p-1.5 rounded-xl bg-[var(--bg-card-sub)] border border-[var(--border)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 rounded-xl text-[#8B1A1A]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="label mb-0.5">WEB3 AUTHENTICATION</div>
            <h3 className="d-md text-[var(--ink)]">
              Connect Wallet
            </h3>
            <p className="text-sm text-[var(--mid)] font-body font-medium">Select how you want to connect</p>
          </div>
        </div>

        {injectedError && (
          <div className="mb-4 p-4 bg-amber-100 dark:bg-amber-950/40 border border-amber-400 dark:border-amber-500/40 rounded-xl flex items-start gap-3 text-sm text-amber-950 dark:text-amber-200 font-medium animate-fade-in shadow-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 leading-relaxed">{injectedError}</div>
          </div>
        )}

        <div className="space-y-3.5">
          {/* Primary Injected / Browser Extension Option (Fast direct connection) */}
          {hasInjected ? (
            <button
              onClick={handleConnectInjected}
              disabled={connectingInjected}
              className="w-full flex items-center justify-between p-4.5 rounded-2xl transition-all group border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  {/* MetaMask Fox / Extension Icon representation */}
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12V7l-9-4-9 4v5c0 5 4 9 9 9s9-4 9-9z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[var(--ink)] font-cond font-bold text-base uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                    <span>MetaMask & Extensions</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Detected
                    </span>
                  </div>
                  <div className="text-sm text-[var(--mid)] font-body font-medium mt-0.5">
                    {connectingInjected ? "Connecting extension..." : "Instant direct browser extension connection"}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          ) : (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between p-4.5 rounded-2xl transition-all group border border-[var(--border)] bg-[var(--bg-card-sub)] hover:border-[#8B1A1A]/40 cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-[var(--ink)] font-cond font-bold text-base uppercase tracking-wider flex items-center gap-2">
                    <span>Install MetaMask</span>
                    <span className="px-2 py-0.5 bg-orange-500/15 text-orange-700 dark:text-orange-300 text-xs font-mono rounded font-bold">
                      Extension
                    </span>
                  </div>
                  <div className="text-sm text-[var(--mid)] font-body font-medium mt-0.5">
                    Download browser extension for desktop
                  </div>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-[var(--muted)] group-hover:text-[#8B1A1A] transition-colors shrink-0" />
            </a>
          )}

          {/* Reown AppKit / WalletConnect Option (Mobile, QR Code & Multi-wallet) */}
          <button
            onClick={handleOpenAppKit}
            className="w-full flex items-center justify-between p-4.5 liquid-glass-box hover:border-[#8B1A1A]/50 rounded-2xl transition-all group border border-[var(--border)] cursor-pointer text-left shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center text-[#8B1A1A] dark:text-red-400 font-bold shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-[var(--ink)] font-cond font-bold text-base uppercase tracking-wider group-hover:text-[#8B1A1A] dark:group-hover:text-red-400 transition-colors flex items-center gap-2">
                  <span>Mobile & QR Connect</span>
                  <span className="px-2.5 py-0.5 bg-[#8B1A1A]/15 text-[#8B1A1A] dark:text-red-400 text-xs font-mono rounded font-bold">
                    AppKit
                  </span>
                </div>
                <div className="text-sm text-[var(--mid)] font-body font-medium mt-0.5">
                  QR Code, Coinbase, Rainbow & Mobile Wallets
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--muted)] group-hover:text-[#8B1A1A] dark:group-hover:text-red-400 transition-all transform group-hover:translate-x-1 shrink-0" />
          </button>
        </div>

        {/* Security / Help Note */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--mid)] font-mono font-medium leading-relaxed">
            {hasInjected
              ? "Tip: Use 'MetaMask & Extensions' for one-click desktop connection without QR codes."
              : "Connecting your wallet does not submit transactions or move funds."}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

