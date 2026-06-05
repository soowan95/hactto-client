import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { AppProvider, useApp } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { SystemAnalyzing } from "./pages/SystemAnalyzing";
import { Home } from "./pages/Dashboard/Home";
import { Search } from "./pages/Dashboard/Search";
import { Stats } from "./pages/Dashboard/Stats";
import { AnalysisCharts } from "./pages/Dashboard/AnalysisCharts";
import { Generate } from "./pages/Dashboard/Generate";
import { History } from "./pages/Dashboard/History";
import { AdminLoginModal } from "./components/AdminLoginModal";

function AppContent() {
  const {
    showAdminModal,
    setShowAdminModal,
    setAdminError,
    setAlert,
    isSystemAnalyzing,
  } = useApp();

  // Global hotkey listener for Admin Auth modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      // Trigger on Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
      if (isModifier && e.shiftKey && e.code === "KeyH") {
        e.preventDefault();
        setShowAdminModal(!showAdminModal);
        setAdminError("");
        setAlert(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAdminModal, setAdminError, setAlert, setShowAdminModal]);

  if (isSystemAnalyzing) {
    return <SystemAnalyzing />;
  }

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
      </div>

      <Routes>
        {/* Welcome screen is bypassed, redirect to home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* User Service Dashboard pages wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/analysis-charts" element={<AnalysisCharts />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>

      {/* Secret admin login modal */}
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setAdminError("");
          setAlert(null);
        }}
      />
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
