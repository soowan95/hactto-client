import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import { AppProvider, useApp } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { Gate } from "./pages/Gate";
import { Welcome } from "./pages/Welcome";
import { Home } from "./pages/Dashboard/Home";
import { Search } from "./pages/Dashboard/Search";
import { Stats } from "./pages/Dashboard/Stats";
import { Generate } from "./pages/Dashboard/Generate";
import { History } from "./pages/Dashboard/History";
import { System } from "./pages/Dashboard/System";
import { AdminDashboard } from "./pages/Admin/AdminDashboard";
import { AdminLoginModal } from "./components/AdminLoginModal";

function AppContent() {
  const {
    isAdminMode,
    showAdminModal,
    setShowAdminModal,
    adminKey,
    setAdminKey,
    adminError,
    setAdminError,
    setAlert,
    loadAdminData,
  } = useApp();

  const navigate = useNavigate();

  // Global hotkey listener for Admin Auth modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      // Trigger on Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
      if (isModifier && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        const savedKey = sessionStorage.getItem("rmk");
        if (savedKey && !isAdminMode) {
          loadAdminData(savedKey)
            .then(() => {
              navigate("/admin");
            })
            .catch(() => {});
        } else {
          setShowAdminModal(!showAdminModal);
          setAdminError("");
          setAlert(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Ensure visitor_id exists
    let vid = localStorage.getItem("visitor_id");
    if (!vid) {
      vid =
        "vis_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem("visitor_id", vid);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAdminMode,
    showAdminModal,
    navigate,
    loadAdminData,
    setAdminError,
    setAlert,
    setShowAdminModal,
  ]);

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAdminError("관리자 키를 입력하세요.");
      return;
    }
    try {
      await loadAdminData(adminKey);
      navigate("/admin");
    } catch {
      // Error is set in context
    }
  };

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
      </div>

      <Routes>
        {/* Gate page for pending/denied IPs */}
        <Route path="/gate" element={<Gate />} />

        {/* Welcome screen for allowed IPs */}
        <Route path="/" element={<Welcome />} />

        {/* Admin Dashboard page */}
        <Route
          path="/admin"
          element={
            sessionStorage.getItem("rmk") ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* User Service Dashboard pages wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/history" element={<History />} />
          <Route path="/system" element={<System />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>

      {/* Secret admin login modal */}
      <AdminLoginModal
        isOpen={showAdminModal}
        adminKey={adminKey}
        setAdminKey={setAdminKey}
        adminError={adminError}
        onClose={() => {
          setShowAdminModal(false);
          setAdminError("");
        }}
        onSubmit={handleAdminAuthSubmit}
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
