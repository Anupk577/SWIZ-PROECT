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
          <div className="bg-[#111520] border border-white/15 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Droplet className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-black text-white">Multi-Chain Testnet Faucets</h3>
              </div>
              <button
                onClick={() => setShowFaucetModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Select your network below to mint <strong>10,000 Testnet USDT</strong> or claim native gas tokens for testing cross-chain deposits and package purchases.
            </p>

            {mintMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-300 font-semibold">
                {mintMsg}
              </div>
            )}

            {/* Network Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: Ethereum Sepolia Testnet */}
              <div className="p-5 bg-[#181D29] border border-blue-500/20 hover:border-blue-500/40 rounded-2xl space-y-4 flex flex-col justify-between transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-extrabold text-blue-400">Sepolia Testnet</h4>
                      <span className="text-[11px] font-mono text-gray-400">Chain ID 11155111</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase shrink-0">
                      Source
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    USDT: <span className="text-gray-200">0x890F...Ec9</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(11155111)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k Sepolia USDT</span>
                  </button>

                  <a
                    href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span>Google Sepolia Faucet</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </a>

                  <a
                    href="https://sepoliafaucet.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold text-xs rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span>Alchemy Sepolia Faucet</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </a>
                </div>
              </div>

              {/* Option 2: BSC Testnet */}
              <div className="p-5 bg-[#181D29] border border-amber-500/20 hover:border-amber-500/40 rounded-2xl space-y-4 flex flex-col justify-between transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-extrabold text-amber-400">BSC Testnet</h4>
                      <span className="text-[11px] font-mono text-gray-400">Chain ID 97</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase shrink-0">
                      Source
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    USDT: <span className="text-gray-200">0x890F...Ec9</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(97)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k BSC USDT</span>
                  </button>

                  <a
                    href="https://testnet.bnbchain.org/faucet-smart"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span>Get tBNB Gas</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                </div>
              </div>

              {/* Option 3: Polygon Amoy Testnet */}
              <div className="p-5 bg-[#181D29] border border-purple-500/20 hover:border-purple-500/40 rounded-2xl space-y-4 flex flex-col justify-between transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-extrabold text-purple-400">Polygon Amoy</h4>
                      <span className="text-[11px] font-mono text-gray-400">Chain ID 80002</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase shrink-0">
                      Destination
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    USDT: <span className="text-gray-200">0x9eff...e9f</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(80002)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k Amoy USDT</span>
                  </button>

                  <a
                    href="https://faucet.polygon.technology/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-between"
                  >
                    <span>Get POL Gas</span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFaucetModal(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
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
