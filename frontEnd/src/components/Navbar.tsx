import React from "react";
import { Link, NavLink } from "react-router-dom";
import { SwizLogo } from "./SwizLogo";
import { ThemeToggle } from "./ThemeToggle";
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
  const {
    walletState,
    connectWallet,
    disconnectWallet,
    secondaryWallet,
    isSecondaryWallet,
    primaryWalletForSecondary,
    openSecondaryWalletModal,
    isWalletMigrated,
  } = useWeb3();

  const shortenAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const navButtonClass = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs sm:text-sm lg:text-base font-cond font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 lg:gap-2 whitespace-nowrap ${
      isActive
        ? "bg-[#8B1A1A] text-white shadow-md shadow-[#8B1A1A]/35"
        : "text-white/90 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#101010]/95 backdrop-blur-2xl border-b border-white/10 border-t-[3px] border-t-[#8B1A1A]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Swiz Logo Component */}
        <Link to={walletState.isAdmin ? "/admin" : "/"} className="cursor-pointer shrink-0">
          <SwizLogo size="md" forceTheme="dark" />
        </Link>

        {/* Center Navigation Bar Pill Container */}
        <nav className="hidden md:flex items-center gap-1 bg-[#191919] p-1 border border-white/15 rounded-xl shadow-inner shrink-0">
          {walletState.isAdmin ? (
            /* ADMIN VIEW */
            <NavLink to="/admin" className={navButtonClass}>
              <Shield className="w-4 h-4" />
              <span>Admin Console</span>
            </NavLink>
          ) : (
            /* USER VIEW */
            <>
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

              {walletState.isConnected && (
                <NavLink to="/dashboard" className={navButtonClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* Right Side Action Bar: Theme Toggle, Network Badge & Wallet Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Network Indicator Pill: Polygon Amoy Testnet */}
          <div className="hidden sm:flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3 lg:py-2 bg-[#191919] border border-white/20 rounded-xl text-xs lg:text-sm font-mono font-bold text-white whitespace-nowrap">
            <Globe className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#8B1A1A]" />
            <span className="hidden md:inline">{walletState.networkName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Primary Wallet has Migrated to Backup Recovery Wallet (READ-ONLY) */}
          {walletState.isConnected && !walletState.isAdmin && !isSecondaryWallet && isWalletMigrated && (
            <div
              title={
                secondaryWallet
                  ? `Packages & operations migrated to backup wallet: ${secondaryWallet}`
                  : "All packages migrated to recovery backup account"
              }
              className="hidden sm:flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-cond font-bold uppercase tracking-wider border bg-red-500/20 border-red-500/50 text-red-200 select-none cursor-default font-mono whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-red-300" />
              <span>
                {secondaryWallet
                  ? `Migrated: ${secondaryWallet.slice(0, 4)}...${secondaryWallet.slice(-4)}`
                  : "Migrated"}
              </span>
            </div>
          )}

          {/* Secondary Wallet Quick-Status Pill (USERS ONLY - HIDDEN FOR SECONDARY WALLETS) */}
          {walletState.isConnected && !walletState.isAdmin && !isSecondaryWallet && !isWalletMigrated && (
            <button
              onClick={openSecondaryWalletModal}
              title={
                secondaryWallet
                  ? `Secondary Backup Wallet: ${secondaryWallet}`
                  : "Add Secondary Backup Wallet to protect your assets"
              }
              className={`hidden sm:flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-cond font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                secondaryWallet
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                  : "bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30 animate-pulse"
              }`}
            >
              <Shield className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>
                {secondaryWallet
                  ? `Backup: ${secondaryWallet.slice(0, 4)}...${secondaryWallet.slice(-4)}`
                  : "Backup Wallet"}
              </span>
            </button>
          )}

          {/* Connected Wallet is a Secondary Recovery Wallet Indicator (READ-ONLY) */}
          {walletState.isConnected && !walletState.isAdmin && isSecondaryWallet && (
            <div
              title={
                primaryWalletForSecondary
                  ? `Authorized Recovery Backup Account for ${primaryWalletForSecondary}`
                  : "Authorized Secondary Recovery Backup Account"
              }
              className="hidden sm:flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-cond font-bold uppercase tracking-wider border bg-purple-500/20 border-purple-500/50 text-purple-200 select-none cursor-default whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>Recovery Account</span>
            </div>
          )}

          {/* Wallet Profile Connection Button */}
          {walletState.isConnected ? (
            <div className="flex items-center gap-1 bg-[#191919] border border-white/20 p-1 rounded-xl shrink-0">
              <div className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 bg-[#8B1A1A]/30 rounded-lg text-xs lg:text-sm font-mono font-bold text-white flex items-center gap-1.5 border border-[#8B1A1A]/50 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{shortenAddress(walletState.address)}</span>
                {walletState.isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-cond font-extrabold uppercase bg-[#8B1A1A] text-white tracking-widest">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                className="p-1.5 text-white/70 hover:text-white hover:bg-[#8B1A1A]/20 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="btn btn-red text-xs sm:text-sm py-2 px-3.5 lg:py-2.5 lg:px-5 shadow-sm font-bold whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-[#101010] border-t border-white/15 py-3 px-3">
        {walletState.isAdmin ? (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-sm font-cond font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                isActive ? "bg-[#8B1A1A] text-white" : "text-white/80 hover:text-white"
              }`
            }
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </NavLink>
        ) : (
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-cond font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all ${
                  isActive ? "bg-[#8B1A1A] text-white" : "text-white/80 hover:text-white"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/buy"
              className={({ isActive }) =>
                `text-sm font-cond font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all ${
                  isActive ? "bg-[#8B1A1A] text-white" : "text-white/80 hover:text-white"
                }`
              }
            >
              Buy Swiz
            </NavLink>
            <NavLink
              to="/bridge"
              className={({ isActive }) =>
                `text-sm font-cond font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all ${
                  isActive ? "bg-[#8B1A1A] text-white" : "text-white/80 hover:text-white"
                }`
              }
            >
              Bridge
            </NavLink>
            {walletState.isConnected && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-cond font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all ${
                    isActive ? "bg-[#8B1A1A] text-white" : "text-white/80 hover:text-white"
                  }`
                }
              >
                Dashboard
              </NavLink>
            )}
          </>
        )}
      </div>
    </header>
  );
};
