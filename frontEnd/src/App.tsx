import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { BuyTokenPage } from "./pages/BuyTokenPage";
import { DepositPage } from "./pages/DepositPage";
import { AdminPage } from "./pages/AdminPage";
import { SecondaryWalletModal } from "./components/SecondaryWalletModal";
import { AlertCircle, RefreshCw } from "lucide-react";
function Layout() {
  const { error, refresh, isSecondaryWalletModalOpen, closeSecondaryWalletModal, isAdmin } = useWeb3();
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <ScrollToTop />
      <Navbar />
      {/* Secondary backup wallet modal is strictly for normal users, never prompted to admin */}
      {!isAdmin && (
        <SecondaryWalletModal
          isOpen={isSecondaryWalletModalOpen}
          onClose={closeSecondaryWalletModal}
        />
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-0">
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="flex-1 min-w-0 break-words">{error}</span>
            <button
              onClick={() => void refresh()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
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
    <Web3Provider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </Web3Provider>
  );
}
