import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { isAddress } from "ethers";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Wallet,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Info,
  Lock,
} from "lucide-react";
import { EXPLORER } from "../constants/contracts";

interface SecondaryWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecondaryWalletModal: React.FC<SecondaryWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    walletState,
    secondaryWallet,
    secondaryWalletStatus,
    isSecondaryWallet,
    saveSecondaryWallet,
    refreshSecondaryWallet,
  } = useWeb3();

  const [inputAddress, setInputAddress] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"form" | "guide">("form");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      setSuccessMessage("");
      setInputAddress("");
      setIsConfirmed(false);
    }
  }, [isOpen, secondaryWallet]);

  if (!isOpen || isSecondaryWallet) return null;

  const currentAddress = walletState.address || "";
  const isAlreadyConfigured = Boolean(secondaryWallet);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFocusInput = () => {
    setActiveTab("form");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setInputAddress(val);
    setValidationError("");
    setSuccessMessage("");

    if (!val) return;

    if (!isAddress(val)) {
      setValidationError("Invalid address: Must be a valid 42-character 0x EVM address.");
      return;
    }

    if (currentAddress && val.toLowerCase() === currentAddress.toLowerCase()) {
      setValidationError("Secondary wallet cannot be identical to your connected primary wallet.");
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMessage("");

    const target = inputAddress.trim();

    if (!target) {
      setValidationError("Please enter a secondary wallet address.");
      return;
    }

    if (!isAddress(target)) {
      setValidationError("Invalid address format. Must be a valid 42-character 0x address.");
      return;
    }

    if (currentAddress && target.toLowerCase() === currentAddress.toLowerCase()) {
      setValidationError("Secondary wallet cannot be identical to your connected primary wallet.");
      return;
    }

    if (!isConfirmed) {
      setValidationError("Please check the confirmation box acknowledging you only have one chance to set your secondary wallet.");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveSecondaryWallet(target);
      setSuccessMessage(
        "Secondary backup wallet configured successfully and recorded in protocol database!"
      );
      await refreshSecondaryWallet();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setValidationError(err?.message || "Failed to configure secondary wallet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secondary-wallet-modal-title"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl overflow-hidden my-auto"
      >
        {/* Pinned Modal Header */}
        <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-[var(--border)] bg-[var(--bg-card)] relative">
          {/* Close Button */}
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute top-5 right-5 text-[var(--mid)] hover:text-[var(--ink)] transition-colors p-2 rounded-xl bg-[var(--bg-card-sub)] border border-[var(--border)] z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Badges & Title */}
          <div className="space-y-2 pr-12">
            <div className="label">
              EMERGENCY RECOVERY FEATURE
            </div>

            <h2
              id="secondary-wallet-modal-title"
              className="d-md text-[var(--ink)] flex items-center gap-2.5"
            >
              <span>Secondary Backup Wallet</span>
            </h2>
            <p className="text-[var(--mid)] text-xs sm:text-sm leading-relaxed font-body">
              Protect your Swiz staking packages, balances, and annual buyback distributions against primary wallet loss.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border)] mt-4 -mb-4 gap-2">
            <button
              onClick={() => setActiveTab("form")}
              className={`pb-3 px-4 text-xs font-cond font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "form"
                  ? "text-[#8B1A1A] border-b-2 border-[#8B1A1A]"
                  : "text-[var(--mid)] hover:text-[var(--ink)]"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{isAlreadyConfigured ? "Registered Backup" : "Configure Wallet"}</span>
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`pb-3 px-4 text-xs font-cond font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "guide"
                  ? "text-[#8B1A1A] border-b-2 border-[#8B1A1A]"
                  : "text-[var(--mid)] hover:text-[var(--ink)]"
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Do's & Don'ts Guide</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">
          {/* Tab 1: Configuration or Read-Only State */}
          {activeTab === "form" && (
            <div className="space-y-5">
              {/* Why Required Summary Callout */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-500">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold font-cond uppercase tracking-wider block">
                    Why is a secondary wallet required?
                  </span>
                  <p className="text-[var(--mid)] leading-relaxed font-body">
                    Decentralized Web3 wallets can be permanently lost due to lost seed phrases, stolen devices, or compromised keys. A registered secondary wallet allows protocol administration to safely migrate your packages to your backup address in an emergency.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("guide")}
                    className="text-[#8B1A1A] hover:underline font-bold inline-flex items-center gap-1 mt-1 text-[11px] cursor-pointer"
                  >
                    View full Do's & Don'ts guidelines
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Connected Primary Wallet Card */}
              <div className="bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-cond font-bold text-[var(--muted)] uppercase tracking-wider block">
                    Connected Primary Wallet (Active)
                  </span>
                  <span className="text-sm font-mono font-bold text-[var(--ink)] break-all">
                    {currentAddress || "Not Connected"}
                  </span>
                </div>
                {currentAddress && (
                  <button
                    type="button"
                    onClick={() => handleCopy(currentAddress)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border)] text-xs font-mono font-semibold text-[var(--mid)] flex items-center gap-1.5 self-start sm:self-auto transition-colors border border-[var(--border)] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* CASE 1: ALREADY CONFIGURED (VIEW ONLY - LOCKED FOR ONE-TIME UPDATE POLICY) */}
              {isAlreadyConfigured ? (
                <div className="space-y-4">
                  <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    secondaryWalletStatus === "PENDING_ACTIVATION"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        secondaryWalletStatus === "PENDING_ACTIVATION"
                          ? "bg-amber-500/15"
                          : "bg-emerald-500/15"
                      }`}>
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-cond font-bold uppercase tracking-wider block">
                            Registered Backup Wallet
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            secondaryWalletStatus === "PENDING_ACTIVATION"
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold"
                              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                          }`}>
                            {secondaryWalletStatus === "PENDING_ACTIVATION" ? "PENDING ADMIN ACTIVATION" : "ACTIVE & PROTECTED"}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-mono font-bold text-[var(--ink)] break-all">
                          {secondaryWallet}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopy(secondaryWallet!)}
                        className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                          secondaryWalletStatus === "PENDING_ACTIVATION"
                            ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30"
                            : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30"
                        }`}
                        title="Copy Secondary Wallet"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <a
                        href={`${EXPLORER}/address/${secondaryWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--mid)] hover:text-[var(--ink)] p-2 rounded-lg bg-[var(--bg-card)] transition-colors border border-[var(--border)]"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                      <Lock className="w-4 h-4 text-[#8B1A1A]" />
                      <span>One-Time Update Policy Locked</span>
                    </div>
                    <p className="text-[11px] text-[var(--mid)] leading-relaxed font-body">
                      Every user has <strong>only one chance to set their secondary wallet</strong>. Once submitted, it cannot be changed or edited.
                      {secondaryWalletStatus === "PENDING_ACTIVATION"
                        ? " Your backup wallet has been recorded in the database and is awaiting activation by a Protocol Administrator."
                        : " Your backup wallet is activated and permanently protected."}
                    </p>
                  </div>
                </div>
              ) : (
                /* CASE 2: FORM (NOT CONFIGURED YET) */
                <div className="space-y-4">
                  {!isAlreadyConfigured && (
                    <div className="bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 rounded-2xl p-4 flex items-center gap-3 text-[#8B1A1A]">
                      <div className="w-9 h-9 rounded-xl bg-[#8B1A1A]/15 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold font-cond uppercase tracking-wider block">
                          No Secondary Wallet Configured
                        </span>
                        <span className="text-[var(--mid)] font-body">
                          Your assets have no emergency backup assigned. Configure a secondary wallet below.
                        </span>
                      </div>
                    </div>
                  )}

                  <form id="secondary-wallet-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-cond font-bold text-[var(--mid)] uppercase tracking-wider">
                        Enter Secondary Wallet Address
                      </label>
                      <div className="relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputAddress}
                          onChange={handleAddressChange}
                          placeholder="0x..."
                          disabled={isSubmitting}
                          className="w-full bg-[var(--bg-card-sub)] border border-[var(--border)] rounded-2xl px-4 py-3.5 text-[var(--ink)] font-mono text-xs sm:text-sm focus:border-[#8B1A1A] focus:outline-none transition-colors pr-24"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const clip = await navigator.clipboard.readText();
                              if (clip) {
                                setInputAddress(clip.trim());
                                setValidationError("");
                              }
                            } catch {}
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--border)] text-[11px] font-cond font-bold text-[var(--mid)] transition-colors cursor-pointer"
                        >
                          Paste
                        </button>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] font-mono">
                        Must be a valid EVM address (Polygon / Ethereum compatible) that you exclusively control.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold font-cond uppercase tracking-wider block">
                          One Chance Policy
                        </span>
                        <p className="text-[11px] text-[var(--mid)] leading-relaxed font-body">
                          Every user can have only <strong>one chance to set/update their secondary wallet</strong>. Once set, there is no chance to update it. Please ensure you control this address and verify every character before saving.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-card-sub)] border border-[var(--border)] text-xs text-[var(--mid)] cursor-pointer select-none hover:border-[#8B1A1A]/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={(e) => {
                          setIsConfirmed(e.target.checked);
                          if (e.target.checked) setValidationError("");
                        }}
                        disabled={isSubmitting}
                        className="mt-0.5 rounded border-[var(--border)] text-[#8B1A1A] focus:ring-[#8B1A1A] bg-[var(--bg-card)] cursor-pointer"
                      />
                      <span className="text-[11px] leading-snug font-body">
                        I confirm this is my own secure backup address and understand that <strong className="text-[var(--ink)]">once saved, there is no chance to update this secondary wallet</strong>.
                      </span>
                    </label>

                    {validationError && (
                      <div
                        role="alert"
                        className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 font-mono font-semibold"
                      >
                        <XCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div
                        role="status"
                        className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs flex items-center gap-2.5 font-mono"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Why Required with Do's and Don'ts */}
          {activeTab === "guide" && (
            <div className="space-y-6 animate-fade-in font-body">
              <div className="p-5 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 text-[#8B1A1A] font-cond font-bold text-sm uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>The Core Purpose: Irreversible Loss Prevention</span>
                </div>
                <p className="text-[var(--mid)] text-xs leading-relaxed">
                  In traditional Web2 systems, lost passwords can be reset via email. In Web3, your private key is the sole key to your funds. If your hardware fails, your phone is stolen, or your seed phrase is misplaced, your assets in smart contracts can remain locked with no way to claim them.
                </p>
                <p className="text-[var(--mid)] text-xs leading-relaxed">
                  The Swiz Protocol incorporates a secure **Secondary Wallet Emergency Mechanism**. By pre-registering a verified secondary wallet while you have full access to your primary wallet, you create a documented, cryptographically provable recovery path.
                </p>
              </div>

              {/* Do's and Don'ts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DO'S */}
                <div className="rounded-2xl p-5 bg-emerald-500/5 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-cond font-bold text-sm uppercase tracking-wider pb-2 border-b border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>DO'S (Recommended Practices)</span>
                  </div>
                  <ul className="space-y-3 text-xs text-[var(--mid)]">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>
                        <strong className="text-[var(--ink)]">Use a separate self-custody wallet</strong> that YOU personally own and control.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>
                        <strong className="text-[var(--ink)]">Double-check the 42-character address</strong> before submitting to avoid typos.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>
                        <strong className="text-[var(--ink)]">Keep backup recovery phrases</strong> for your secondary wallet in a separate, secure offline vault.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* DON'TS */}
                <div className="rounded-2xl p-5 bg-[#8B1A1A]/5 border border-[#8B1A1A]/30 space-y-4">
                  <div className="flex items-center gap-2 text-[#8B1A1A] font-cond font-bold text-sm uppercase tracking-wider pb-2 border-b border-[#8B1A1A]/20">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>DON'TS (Critical Warnings)</span>
                  </div>
                  <ul className="space-y-3 text-xs text-[var(--mid)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#8B1A1A] font-bold">✕</span>
                      <span>
                        <strong className="text-[var(--ink)]">NEVER use a Centralized Exchange address</strong> (e.g. Binance, Coinbase, KuCoin deposit address).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#8B1A1A] font-bold">✕</span>
                      <span>
                        <strong className="text-[var(--ink)]">NEVER use a third-party address</strong>. If you do not own the keys, you do not own the recovered assets.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#8B1A1A] font-bold">✕</span>
                      <span>
                        <strong className="text-[var(--ink)]">DO NOT enter your current primary wallet</strong>. Must be an independent backup address.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Sticky Modal Footer */}
        <div className="shrink-0 p-4 sm:p-5 bg-[var(--bg-card)] border-t border-[var(--border)] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-ink text-xs px-5 py-2.5 w-full sm:w-auto"
          >
            {isAlreadyConfigured ? "Close" : "Remind Me Later"}
          </button>

          {!isAlreadyConfigured && (
            activeTab === "guide" ? (
              <button
                type="button"
                onClick={handleFocusInput}
                className="btn btn-red text-xs px-6 py-2.5 w-full sm:w-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Configure Secondary Wallet</span>
              </button>
            ) : (
              <button
                type="submit"
                form="secondary-wallet-form"
                disabled={isSubmitting || !inputAddress || !!validationError || !isConfirmed}
                className="btn btn-red text-xs px-6 py-2.5 w-full sm:w-auto disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Secondary Wallet for Admin Activation</span>
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
