import React, { useState, useEffect, useRef } from "react";
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

  if (!isOpen) return null;

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

    if (!isConfirmed) {
      setValidationError("Please check the confirmation box acknowledging you only have one chance to set your secondary wallet.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Configuration is stored strictly in the DB (gas-free)
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
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secondary-wallet-modal-title"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0d111a] border border-white/15 shadow-2xl overflow-hidden my-auto"
      >
        {/* Pinned Modal Header */}
        <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-white/10 bg-[#0d111a] relative">
          {/* Close Button */}
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Badges & Title */}
          <div className="space-y-2 pr-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[#E3262E] text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Emergency Recovery Feature</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E3262E] animate-pulse"></span>
            </div>

            <h2
              id="secondary-wallet-modal-title"
              className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5"
            >
              <span>Secondary Backup Wallet</span>
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Protect your Swiz staking packages, balances, and annual buyback distributions against primary wallet loss.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 mt-4 -mb-4 gap-2">
            <button
              onClick={() => setActiveTab("form")}
              className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "form"
                  ? "text-white border-b-2 border-[#E3262E]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{isAlreadyConfigured ? "Registered Backup Wallet" : "Configure Wallet"}</span>
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "guide"
                  ? "text-white border-b-2 border-[#E3262E]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Why is this required? (Do's & Don'ts)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">
          {/* Tab 1: Configuration or Read-Only State */}
          {activeTab === "form" && (
            <div className="space-y-5">
              {/* Why Required Summary Callout */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-300 block">
                    Why is a secondary wallet required?
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    Decentralized Web3 wallets can be permanently lost due to lost seed phrases, stolen devices, or compromised keys. A registered secondary wallet allows protocol administration to safely migrate your packages to your backup address in an emergency.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("guide")}
                    className="text-amber-400 hover:text-amber-300 font-bold underline inline-flex items-center gap-1 mt-1 text-[11px] cursor-pointer"
                  >
                    View full Do's & Don'ts guidelines
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Connected Primary Wallet Card */}
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
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1.5 self-start sm:self-auto transition-colors border border-white/10 cursor-pointer"
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

              {/* CASE 1: ALREADY CONFIGURED (READ-ONLY FOR USER, UPDATE RESTRICTED TO ADMIN ONLY) */}
              {isAlreadyConfigured ? (
                <div className="space-y-4">
                  {/* Verified Secondary Wallet Display */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                            Registered Backup Wallet ({secondaryWalletStatus || "ACTIVE"})
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Recorded in DB
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                          {secondaryWallet}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopy(secondaryWallet!)}
                        className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors border border-emerald-500/30 cursor-pointer"
                        title="Copy Secondary Wallet"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <a
                        href={`${EXPLORER}/address/${secondaryWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Security Notice: One Chance Used and Permanently Locked */}
                  <div className="p-4 rounded-2xl bg-[#111520] border border-white/10 space-y-2 text-xs text-gray-300">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>One Chance Used • Secondary Wallet Permanently Locked</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Every user has <strong>one chance to set/update their secondary wallet</strong>. Once set, there is no chance to update it directly. Your backup wallet address is permanently secured and recorded.
                    </p>
                    <p className="text-[11px] text-gray-500">
                      If your backup wallet itself is compromised in a critical emergency, submit an official identity-verified request to protocol administrators.
                    </p>
                  </div>
                </div>
              ) : (
                /* CASE 2: NOT CONFIGURED YET (USER CAN CONFIGURE INITIAL SECONDARY WALLET IN DB ONLY) */
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-200">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-[#E3262E] shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-red-300 block">
                        No Secondary Wallet Configured
                      </span>
                      <span className="text-gray-300">
                        Your assets have no emergency backup assigned. Configure a secondary wallet below.
                      </span>
                    </div>
                  </div>

                  {/* Registration Form (Stores ONLY in DB, gas-free) */}
                  <form id="secondary-wallet-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
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
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-gray-300 transition-colors cursor-pointer"
                        >
                          Paste
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Must be a valid EVM address (Polygon / Ethereum compatible) that you exclusively control. Stored securely in protocol database (Instant & Gas-Free).
                      </p>
                    </div>

                    {/* Security Notice on Single Chance Rule */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-300 block">
                          One Chance Policy
                        </span>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Every user can have only <strong>one chance to set/update their secondary wallet</strong>. Once set, there is no chance to update it. Please ensure you control this address and verify every character before saving.
                        </p>
                      </div>
                    </div>

                    {/* Acknowledgment Checkbox */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 cursor-pointer select-none hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={(e) => {
                          setIsConfirmed(e.target.checked);
                          if (e.target.checked) setValidationError("");
                        }}
                        disabled={isSubmitting}
                        className="mt-0.5 rounded border-white/20 text-[#E3262E] focus:ring-[#E3262E] focus:ring-offset-0 bg-[#0B0E14] cursor-pointer"
                      />
                      <span className="text-[11px] text-gray-300 leading-snug">
                        I confirm this is my own secure backup address and understand that <strong className="text-white">once saved, there is no chance to update this secondary wallet</strong>.
                      </span>
                    </label>

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
                  </form>
                </div>
              )}
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
                {/* DO'S */}
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

              {/* Action Button at bottom of guide */}
              <div className="text-center pt-2">
                {isAlreadyConfigured ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("form")}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>View Registered Backup Wallet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFocusInput}
                    className="px-6 py-3 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Configure Secondary Wallet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Sticky Modal Footer */}
        <div className="shrink-0 p-4 sm:p-5 bg-[#090c13] border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-colors border border-white/10 text-center cursor-pointer ${
              isAlreadyConfigured ? "w-full sm:w-auto" : "w-full sm:w-auto"
            }`}
          >
            {isAlreadyConfigured ? "Close" : "Remind Me Later"}
          </button>

          {!isAlreadyConfigured && (
            activeTab === "guide" ? (
              <button
                type="button"
                onClick={handleFocusInput}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#E3262E]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Configure Secondary Wallet</span>
              </button>
            ) : (
              <button
                type="submit"
                form="secondary-wallet-form"
                disabled={isSubmitting || !inputAddress || !!validationError || !isConfirmed}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#E3262E] hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#E3262E]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Secondary Backup Wallet</span>
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
