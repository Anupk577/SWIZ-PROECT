import React from "react";
import { createPortal } from "react-dom";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import { Wallet, X, Zap, ArrowRight } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { connectWallet } = useWeb3();

  if (!isOpen) return null;

  const handleOpenReown = async () => {
    onClose();
    await connectWallet();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect Web3 Wallet"
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto lumix-card rounded-3xl p-6 my-auto custom-scrollbar z-[1000000]"
      >
        {/* Close Button */}
        <button
          aria-label="Close wallet dialog"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1.5 rounded-xl bg-[#0B0E14] border border-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#E3262E]/20 border border-[#E3262E]/40 rounded-2xl text-[#E3262E]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Connect Web3 Wallet
            </h3>
            <p className="text-xs text-gray-400">Choose your wallet provider</p>
          </div>
        </div>

        {/* Reown AppKit Option */}
        <div className="space-y-3">
          <button
            onClick={handleOpenReown}
            className="w-full flex items-center justify-between p-4 liquid-glass-box hover:bg-white/10 rounded-2xl transition-all group border border-blue-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-white font-medium group-hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span>Connect a wallet</span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded font-bold">
                    Default
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  MetaMask, Coinbase and WalletConnect-compatible wallets
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400">
            Connecting your wallet does not submit a purchase or move tokens.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
