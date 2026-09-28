import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { isAddress } from "ethers";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import {
  ShieldAlert,
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
    saveSecondaryWallet,
    refreshSecondaryWallet,
  } = useWeb3();

  const [inputAddress, setInputAddress] = useState<string>("");
  const [registerOnChain, setRegisterOnChain] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"form" | "guide">("form");

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      setSuccessMessage("");
      if (secondaryWallet) {
        setInputAddress(secondaryWallet);
      } else {
        setInputAddress("");
      }
    }
  }, [isOpen, secondaryWallet]);

  if (!isOpen) return null;

  const currentAddress = walletState.address || "";

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      setValidationError("Please enter a valid secondary wallet address.");
      return;
    }

    if (!isAddress(target)) {
      setValidationError("Invalid address: Must be a valid 42-character 0x EVM address.");
      return;
    }

    if (currentAddress && target.toLowerCase() === currentAddress.toLowerCase()) {
      setValidationError("Secondary wallet cannot be identical to your connected primary wallet.");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveSecondaryWallet(target, registerOnChain);
      setSuccessMessage(
        registerOnChain
          ? "Secondary wallet registered successfully on-chain and in protocol records!"
          : "Secondary wallet successfully saved to protocol records!"
      );
      await refreshSecondaryWallet();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setValidationError(err?.message || "Failed to register secondary wallet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secondary-wallet-modal-title"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto lumix-card rounded-3xl p-5 sm:p-8 my-auto custom-scrollbar border border-white/15 shadow-2xl bg-[#0d111a]"
      >
        {/* Close Button */}
        <button
          aria-label="Close dialog"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Badges */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[#E3262E] text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Recovery Feature</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E3262E] animate-pulse"></span>
          </div>

          <h2
            id="secondary-wallet-modal-title"
            className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5"
          >
            <span>Secondary Backup Wallet</span>
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Protect your Swiz staking packages, balances, and annual buyback distributions against primary wallet loss.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("form")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "form"
                ? "text-white border-b-2 border-[#E3262E]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Configure Wallet</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "guide"
                ? "text-white border-b-2 border-[#E3262E]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Why is this required? (Do's & Don'ts)</span>
          </button>
        </div>

        {/* Tab 1: Configuration Form */}
        {activeTab === "form" && (
          <div className="space-y-6">
            {/* Why Required Summary Callout */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-300 block">
                  Why is a secondary wallet required?
                </span>
                <p className="text-gray-300 leading-relaxed">
                  Decentralized Web3 wallets can be permanently lost due to lost seed phrases, stolen devices, or compromised keys. If you lose your primary wallet, your staked packages and buyback returns could be lost forever. A registered secondary wallet allows protocol administration to safely migrate your packages to your backup address.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("guide")}
                  className="text-amber-400 hover:text-amber-300 font-bold underline inline-flex items-center gap-1 mt-1 text-[11px]"
                >
                  View full Do's & Don'ts guidelines
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Current Primary Wallet Pill */}
            <div className="bg-[#111520] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Connected Primary Wallet (Active)
                </span>
                <span className="text-sm font-mono font-bold text-white break-all">
                  {currentAddress || "Not Connected"}
                </span>
              </div>
              {currentAddress && (
                <button
                  type="button"
                  onClick={() => handleCopy(currentAddress)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1.5 self-start sm:self-auto transition-colors border border-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
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

            {/* Current Secondary Wallet State Indicator */}
            {secondaryWallet ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Registered Backup Wallet ({secondaryWalletStatus || "ACTIVE"})
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                      {secondaryWallet}
                    </span>
                  </div>
                </div>
                <a
                  href={`${EXPLORER}/address/${secondaryWallet}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-200">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-[#E3262E] shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-red-300 block">
                    No Secondary Wallet Configured
                  </span>
                  <span className="text-gray-300">
                    Your assets have no emergency backup assigned. Enter a secondary wallet below.
                  </span>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  {secondaryWallet ? "Update Secondary Wallet Address" : "Enter Secondary Wallet Address"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputAddress}
                    onChange={handleAddressChange}
                    placeholder="0x..."
                    disabled={isSubmitting}
                    className="w-full bg-[#0B0E14] border border-white/15 rounded-2xl px-4 py-3.5 text-white font-mono text-xs sm:text-sm focus:border-[#E3262E] focus:outline-none transition-colors pr-24"
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-gray-300 transition-colors"
                  >
                    Paste
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Must be an EVM address (Polygon / Ethereum compatible) that you exclusively control.
                </p>
              </div>

              {/* On-chain sync checkbox option */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <input
                  id="onchain-checkbox"
                  type="checkbox"
                  checked={registerOnChain}
                  onChange={(e) => setRegisterOnChain(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-700 text-[#E3262E] focus:ring-[#E3262E] cursor-pointer"
                />
                <label htmlFor="onchain-checkbox" className="text-xs text-gray-300 cursor-pointer select-none">
                  <span className="font-bold text-white block">
                    Record directly on-chain via smart contract transaction
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    Requires a fast gas confirmation on Polygon Amoy. When unchecked, your secondary wallet is registered instantly and gas-free in protocol records.
                  </span>
                </label>
              </div>

              {/* Error & Success Messages */}
              {validationError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center gap-2.5"
                >
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !inputAddress || !!validationError}
                  className="w-full sm:flex-1 py-3.5 bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#E3262E]/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{registerOnChain ? "Confirming on Chain..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{secondaryWallet ? "Update Secondary Wallet" : "Save Secondary Wallet"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-colors border border-white/10"
                >
                  {secondaryWallet ? "Close" : "Remind Me Later"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Why Required with Do's and Don'ts */}
        {activeTab === "guide" && (
          <div className="space-y-6 animate-fade-in">
            {/* Why Required Deep-Dive */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#131926] to-[#0B0E14] border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-[#E3262E] font-extrabold text-sm">
                <Lock className="w-4 h-4" />
                <span>The Core Purpose: Irreversible Loss Prevention</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                In traditional Web2 systems, lost passwords can be reset via email. In Web3, your private key is the sole key to your funds. If your hardware fails, your phone is stolen, or your seed phrase is misplaced, your assets in smart contracts can remain locked with no way to claim them.
              </p>
              <p className="text-gray-300 text-xs leading-relaxed">
                The Swiz Protocol incorporates a secure **Secondary Wallet Emergency Mechanism**. By pre-registering a verified secondary wallet while you have full access to your primary wallet, you create a documented, cryptographically provable recovery path. If disaster strikes, protocol administrators can verify your identity and migrate your packages and buyback rights to your secondary wallet.
              </p>
            </div>

            {/* Do's and Don'ts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DO's */}
              <div className="rounded-2xl p-5 bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm pb-2 border-b border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>DO'S (Recommended Practices)</span>
                </div>
                <ul className="space-y-3 text-xs text-gray-200">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong className="text-white">Use a separate self-custody wallet</strong> that YOU personally own and control (such as a hardware Ledger/Trezor or separate MetaMask account).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong className="text-white">Double-check the 42-character address</strong> before submitting to avoid typos or clip-jack malware.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong className="text-white">Keep backup recovery phrases</strong> for your secondary wallet in a separate, secure offline vault.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong className="text-white">Register early</strong> immediately upon connecting so you have active protection prior to any unforeseen incidents.
                    </span>
                  </li>
                </ul>
              </div>

              {/* DON'TS */}
              <div className="rounded-2xl p-5 bg-red-950/20 border border-red-500/30 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm pb-2 border-b border-red-500/20">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span>DON'TS (Critical Warnings)</span>
                </div>
                <ul className="space-y-3 text-xs text-gray-200">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong className="text-white">NEVER use a Centralized Exchange address</strong> (e.g. Binance, Coinbase, KuCoin deposit address). Exchange deposit contracts cannot receive smart contract payouts!
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong className="text-white">NEVER use a friend's or third-party address</strong>. If you do not own the keys, you do not own the recovered assets.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong className="text-white">DO NOT enter your current primary wallet</strong>. The secondary wallet must be an independent backup address.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong className="text-white">NEVER share your private keys or seed phrase</strong>. Protocol admins will never ask for your seed phrase or private key under any circumstances.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Back to Form Action */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className="px-6 py-3 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>Ready to Configure Backup Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
