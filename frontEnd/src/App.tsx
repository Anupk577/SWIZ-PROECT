import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { BuyTokenPage } from "./pages/BuyTokenPage";
import { DepositPage } from "./pages/DepositPage";
import { AdminPage } from "./pages/AdminPage";
import { AlertCircle, RefreshCw } from "lucide-react";
function Layout() {
  const { error, refresh } = useWeb3();
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <ScrollToTop />
      <Navbar />
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/buy" element={<BuyTokenPage />} />
          <Route path="/bridge" element={<DepositPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/admin" element={<AdminPage />} />
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
