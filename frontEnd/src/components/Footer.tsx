import { useState } from "react";
import { SwizLogo } from "./SwizLogo";
import { ShieldCheck, ExternalLink, RefreshCw, Droplet } from "lucide-react";
import { EXPLORER } from "../constants/contracts";
import { useUiData as useWeb3 } from "../hooks/useUiData";

export function Footer() {
  const { walletState, mintTestnetUsdt } = useWeb3();
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintMsg, setMintMsg] = useState<string | null>(null);

  const handleMintNetwork = async (chainId: number) => {
    setMinting(true);
    setMintMsg(null);
    try {
      await mintTestnetUsdt(chainId);
      setMintMsg(`10,000 Testnet USDT minted successfully on Chain ID ${chainId}!`);
    } catch (e) {
      setMintMsg(e instanceof Error ? e.message : "Minting failed");
    } finally {
      setMinting(false);
    }
  };

  const isTestnet = true;

  return (
    <footer className="w-full bg-[#0B0E14] border-t border-[#E3262E]/20 mt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <SwizLogo size="md" showTagline />
          <div className="text-xs text-gray-400 text-center md:text-right space-y-2">
            <div className="flex items-center justify-center md:justify-end gap-2 text-white font-medium">
              <ShieldCheck className="w-4 h-4 text-[#E3262E]" />
              <span>
                {walletState.networkName || "Polygon Amoy Testnet"} · Progressive Unlock Protocol
              </span>
            </div>
            <p>
              Protocol reference price is not a guaranteed market value or return.
            </p>
            <p>ET has no redemption claim. Source deposits are one-way.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Swiz Smart Ecosystem.</p>

          <div className="flex flex-wrap items-center gap-5">
            {/* Conditional Testnet Faucet Button */}
            {isTestnet && (
              <button
                type="button"
                onClick={() => setShowFaucetModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Droplet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Testnet Faucets</span>
              </button>
            )}

            <a
              href={EXPLORER}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1"
            >
              Network Explorer <ExternalLink className="w-3 h-3" />
            </a>
            {import.meta.env.VITE_SUPPORT_EMAIL && (
              <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL}`}>
                Support
              </a>
            )}
            {import.meta.env.VITE_TERMS_URL && (
              <a href={import.meta.env.VITE_TERMS_URL}>Terms of Use</a>
            )}
            {import.meta.env.VITE_PRIVACY_URL && (
              <a href={import.meta.env.VITE_PRIVACY_URL}>Privacy Policy</a>
            )}
          </div>
        </div>
      </div>

      {/* Testnet Faucet Modal */}
      {showFaucetModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111520] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Multi-Chain Testnet Faucets</h3>
              </div>
              <button
                onClick={() => setShowFaucetModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Select your network below to mint <strong>10,000 Testnet USDT</strong> or claim native gas tokens for testing cross-chain deposits and package purchases.
            </p>

            {mintMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-medium">
                {mintMsg}
              </div>
            )}

            {/* Network Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: BSC Testnet */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">BSC Testnet (97)</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Source</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono break-all">
                    USDT: 0x890F...Ec9
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(97)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k BSC USDT</span>
                  </button>

                  <a
                    href="https://testnet.bnbchain.org/faucet-smart"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/10"
                  >
                    Get tBNB Gas <ExternalLink className="w-3 h-3 text-amber-400" />
                  </a>
                </div>
              </div>

              {/* Option 2: Polygon Amoy Testnet */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-wider">Polygon Amoy (80002)</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">Destination</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono break-all">
                    USDT: 0x9eff...e9f
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(80002)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k Amoy USDT</span>
                  </button>

                  <a
                    href="https://faucet.polygon.technology/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/10"
                  >
                    Get POL Gas <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFaucetModal(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
