import { useState } from "react";
import { Link } from "react-router-dom";
import { SwizLogo } from "./SwizLogo";
import { ExternalLink, RefreshCw, Droplet } from "lucide-react";
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
    <footer className="w-full bg-[#0C0C0C] text-white border-t-[3px] border-t-[#8B1A1A] mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Brand Information */}
          <div className="lg:col-span-2 space-y-4">
            <SwizLogo size="md" forceTheme="dark" showTagline />
            <p className="font-cond font-semibold text-xs tracking-wider uppercase text-[#8B1A1A]">
              We Deliver Wealth. Not Just Promises.
            </p>
            <p className="text-xs text-white/50 leading-relaxed max-w-sm font-light">
              Swizcoin pioneers algorithmic dynamic pricing combined with twenty-year progressive unlock schedules, automated FIFO buybacks, and multi-sig treasury governance.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {isTestnet && (
                <button
                  type="button"
                  onClick={() => setShowFaucetModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-cond font-bold text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Droplet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Testnet Faucets</span>
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/70">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{walletState.networkName || "Amoy 80002"}</span>
              </div>
            </div>
          </div>

          {/* Col 3: DApp Navigation */}
          <div className="space-y-3">
            <h4 className="font-cond font-bold text-xs tracking-widest uppercase text-white pb-2 border-b border-white/10">
              Protocol DApp
            </h4>
            <ul className="space-y-2 text-xs font-cond tracking-wide text-white/60">
              <li>
                <Link to="/" className="hover:text-white hover:text-[#8B1A1A] transition-colors">
                  Overview & Calculator
                </Link>
              </li>
              <li>
                <Link to="/buy" className="hover:text-white hover:text-[#8B1A1A] transition-colors">
                  Buy Swiz Tokens
                </Link>
              </li>
              <li>
                <Link to="/bridge" className="hover:text-white hover:text-[#8B1A1A] transition-colors">
                  Cross-Chain USDT Bridge
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white hover:text-[#8B1A1A] transition-colors">
                  Staking Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Architecture */}
          <div className="space-y-3">
            <h4 className="font-cond font-bold text-xs tracking-widest uppercase text-white pb-2 border-b border-white/10">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs font-cond tracking-wide text-white/60">
              <li>
                <span className="text-white/40">Pricing:</span> +2.33% / Threshold Step
              </li>
              <li>
                <span className="text-white/40">Vesting:</span> 20 Years (5% Annual)
              </li>
              <li>
                <span className="text-white/40">Matching:</span> Automated FIFO Engine
              </li>
              <li>
                <a
                  href={EXPLORER}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white text-[#8B1A1A] flex items-center gap-1 transition-colors"
                >
                  <span>Block Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Security & Governance */}
          <div className="space-y-3">
            <h4 className="font-cond font-bold text-xs tracking-widest uppercase text-white pb-2 border-b border-white/10">
              Governance
            </h4>
            <ul className="space-y-2 text-xs font-cond tracking-wide text-white/60">
              <li>
                <Link to="/admin" className="hover:text-white hover:text-[#8B1A1A] transition-colors">
                  Admin Console
                </Link>
              </li>
              <li>
                <span className="text-emerald-400/90 font-mono">100% Contract Custody</span>
              </li>
              <li>
                <span className="text-white/40">Multi-Sig:</span> Treasury Guarded
              </li>
              {import.meta.env.VITE_TERMS_URL && (
                <li>
                  <a href={import.meta.env.VITE_TERMS_URL} className="hover:text-white">Terms of Use</a>
                </li>
              )}
              {import.meta.env.VITE_PRIVACY_URL && (
                <li>
                  <a href={import.meta.env.VITE_PRIVACY_URL} className="hover:text-white">Privacy Policy</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Bottom Disclaimers */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
          <div>
            © {new Date().getFullYear()} Swizcoin Protocol Ecosystem. All rights reserved.
          </div>
          <p className="text-[11px] text-white/35 max-w-xl text-center md:text-right leading-relaxed font-sans">
            Protocol reference price is an algorithmic benchmark and not a guaranteed market price or financial return. Staking unlocks occur in linear 365-day increments. Non-custodial operations deployed on Polygon Amoy.
          </p>
        </div>
      </div>

      {/* Testnet Faucet Modal */}
      {showFaucetModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141414] border border-white/15 rounded-2xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Droplet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cond font-bold text-lg uppercase tracking-wider text-white">Multi-Chain Testnet Faucets</h3>
              </div>
              <button
                onClick={() => setShowFaucetModal(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-light">
              Select your network below to mint <strong>10,000 Testnet USDT</strong> or claim native gas tokens for testing cross-chain deposits and package purchases.
            </p>

            {mintMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-300 font-semibold font-mono">
                {mintMsg}
              </div>
            )}

            {/* Network Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: Ethereum Sepolia Testnet */}
              <div className="p-5 bg-[#1B1B1B] border border-blue-500/20 hover:border-blue-500/40 rounded-xl space-y-4 flex flex-col justify-between transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-cond font-bold text-sm uppercase tracking-wider text-blue-400">Sepolia Testnet</h4>
                      <span className="text-[10px] font-mono text-white/40">Chain ID 11155111</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-cond font-extrabold uppercase shrink-0">
                      Source
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 font-mono">
                    USDT: <span className="text-white/90">0x890F...Ec9</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(11155111)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white font-cond font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k Sepolia USDT</span>
                  </button>

                  <a
                    href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-cond font-semibold text-xs uppercase rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>Google Sepolia Faucet</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </a>
                </div>
              </div>

              {/* Option 2: BSC Testnet */}
              <div className="p-5 bg-[#1B1B1B] border border-amber-500/20 hover:border-amber-500/40 rounded-xl space-y-4 flex flex-col justify-between transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-cond font-bold text-sm uppercase tracking-wider text-amber-400">BSC Testnet</h4>
                      <span className="text-[10px] font-mono text-white/40">Chain ID 97</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-cond font-extrabold uppercase shrink-0">
                      Source
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 font-mono">
                    USDT: <span className="text-white/90">0x890F...Ec9</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(97)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2 px-3 bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-white font-cond font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k BSC USDT</span>
                  </button>

                  <a
                    href="https://testnet.bnbchain.org/faucet-smart"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-cond font-semibold text-xs uppercase rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>Get tBNB Gas</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                </div>
              </div>

              {/* Option 3: Polygon Amoy Testnet */}
              <div className="p-5 bg-[#1B1B1B] border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 rounded-xl space-y-4 flex flex-col justify-between transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-cond font-bold text-sm uppercase tracking-wider text-[#A52020]">Polygon Amoy</h4>
                      <span className="text-[10px] font-mono text-white/40">Chain ID 80002</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#8B1A1A]/20 text-[#A52020] text-[10px] font-cond font-extrabold uppercase shrink-0">
                      Destination
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 font-mono">
                    USDT: <span className="text-white/90">0x9eff...e9f</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleMintNetwork(80002)}
                    disabled={minting || !walletState.isConnected}
                    className="w-full py-2 px-3 bg-[#8B1A1A] hover:bg-[#A52020] disabled:opacity-50 text-white font-cond font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${minting ? "animate-spin" : ""}`} />
                    <span>Mint 10k Amoy USDT</span>
                  </button>

                  <a
                    href="https://faucet.polygon.technology/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 px-3 bg-[#8B1A1A]/10 hover:bg-[#8B1A1A]/20 text-white/80 border border-[#8B1A1A]/30 font-cond font-semibold text-xs uppercase rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>Get POL Gas</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#A52020]" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFaucetModal(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-cond font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
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
