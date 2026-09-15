import React from "react";
import { Link, NavLink } from "react-router-dom";
import { SwizLogo } from "./SwizLogo";
import { useUiData as useWeb3 } from "../hooks/useUiData";
import {
  LogOut,
  Globe,
  Wallet,
  LayoutDashboard,
  Home,
  ShoppingCart,
  Shield,
  ArrowLeftRight,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { walletState, connectWallet, disconnectWallet } = useWeb3();

  const shortenAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const navButtonClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
      isActive
        ? "bg-[#E3262E] text-white shadow-md shadow-[#E3262E]/25"
        : "text-gray-300 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-2xl border-b border-white/10 border-t-2 border-t-[#E3262E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex flex-wrap gap-4 items-center justify-between">
        {/* Brand Dark Swiz Logo Component */}
        <Link to="/" className="cursor-pointer">
          <SwizLogo size="md" />
        </Link>

        {/* Center Navigation Bar Pill Container */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#111520] p-1.5 border border-white/10 rounded-2xl shadow-inner">
          <NavLink to="/" end className={navButtonClass}>
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>

          <NavLink to="/buy" className={navButtonClass}>
            <ShoppingCart className="w-4 h-4" />
            <span>Buy Swiz</span>
          </NavLink>

          <NavLink to="/bridge" className={navButtonClass}>
            <ArrowLeftRight className="w-4 h-4" />
            <span>Bridge USDT</span>
          </NavLink>

          {walletState.isAdmin && (
            <NavLink to="/admin" className={navButtonClass}>
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </NavLink>
          )}

          {walletState.isConnected && (
            <NavLink to="/dashboard" className={navButtonClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
          )}
        </nav>

        {/* Right Side Action Bar: Network Badge & Wallet Profile */}
        <div className="flex items-center gap-3">
          {/* Network Indicator Pill: Polygon Amoy Testnet */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#111520] border border-white/10 rounded-xl text-xs font-semibold text-gray-200">
            <Globe className="w-4 h-4 text-[#E3262E]" />
            <span className="hidden sm:inline">{walletState.networkName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Wallet Profile Connection Button */}
          {walletState.isConnected ? (
            <div className="flex items-center gap-2 bg-[#111520] border border-white/10 p-1.5 rounded-xl">
              <div className="px-3.5 py-1.5 bg-[#E3262E]/15 rounded-lg text-xs font-mono font-bold text-white flex items-center gap-2 border border-[#E3262E]/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {shortenAddress(walletState.address)}
              </div>
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                className="p-2 text-gray-400 hover:text-[#E3262E] hover:bg-[#E3262E]/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-[#E3262E] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#E3262E]/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-[#0B0E14] border-t border-white/10 py-2.5 px-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all ${
              isActive ? "bg-[#E3262E] text-white" : "text-gray-400 hover:text-white"
            }`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/buy"
          className={({ isActive }) =>
            `text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all ${
              isActive ? "bg-[#E3262E] text-white" : "text-gray-400 hover:text-white"
            }`
          }
        >
          Buy Swiz
        </NavLink>
        <NavLink
          to="/bridge"
          className={({ isActive }) =>
            `text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all ${
              isActive ? "bg-[#E3262E] text-white" : "text-gray-400 hover:text-white"
            }`
          }
        >
          Bridge
        </NavLink>
        {walletState.isConnected && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                isActive ? "bg-[#E3262E] text-white" : "text-gray-400 hover:text-white"
              }`
            }
          >
            Dashboard
          </NavLink>
        )}
      </div>
    </header>
  );
};
