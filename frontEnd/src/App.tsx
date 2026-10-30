import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { TickerBanner } from "./components/TickerBanner";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { BuyTokenPage } from "./pages/BuyTokenPage";
import { DepositPage } from "./pages/DepositPage";
import { AdminPage } from "./pages/AdminPage";
import { SecondaryWalletModal } from "./components/SecondaryWalletModal";
import { WalletModal } from "./components/WalletModal";
import { AlertCircle, RefreshCw } from "lucide-react";

function Layout() {
  const {
    error,
    refresh,
    isSecondaryWalletModalOpen,
    closeSecondaryWalletModal,
    isWalletModalOpen,
    closeWalletModal,
    isAdmin,
    isSecondaryWallet,
  } = useWeb3();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)] transition-colors duration-300 font-sans">
      <ScrollToTop />
      <Navbar />
      <TickerBanner />

      {/* Global Wallet Connect Modal */}
      <WalletModal isOpen={isWalletModalOpen} onClose={closeWalletModal} />

      {/* Secondary backup wallet modal - never rendered for secondary backup wallets */}
      {!isAdmin && !isSecondaryWallet && (
        <SecondaryWalletModal
          isOpen={isSecondaryWalletModalOpen}
          onClose={closeSecondaryWalletModal}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-0">
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-800 dark:text-red-200 text-sm animate-fade-in"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
            <span className="flex-1 min-w-0 break-words font-medium">{error}</span>
            <button
              onClick={() => void refresh()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8B1A1A] hover:bg-[#A52020] text-white text-xs font-cond font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        )}

        <Routes>
          {isAdmin ? (
            /* ADMIN VIEW: ONLY Admin permissions and console alone! */
            <>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            /* USER VIEW: Home, Dashboard, Buy, Bridge */
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/buy" element={<BuyTokenPage />} />
              <Route path="/bridge" element={<DepositPage />} />
              <Route path="/deposit" element={<DepositPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </Web3Provider>
    </ThemeProvider>
  );
}
