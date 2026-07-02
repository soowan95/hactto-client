 
import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { SystemAnalyzing } from './pages/SystemAnalyzing';
import { BlockedPage } from './pages/BlockedPage';
import { Home } from './pages/Dashboard/Home';
import { Search } from './pages/Dashboard/Search';
import { Stats } from './pages/Dashboard/Stats';
import { AnalysisCharts } from './pages/Dashboard/AnalysisCharts';
import { Generate } from './pages/Dashboard/Generate';
import { History } from './pages/Dashboard/History';
import { Board } from './pages/Dashboard/Board';
import { Support } from './pages/Dashboard/Support';
import { AdminLoginModal } from './components/AdminLoginModal';
import { InteractiveBackground } from './components/InteractiveBackground';

function AppContent() {
  const {
    loading,
    isAdminMode,
    showAdminModal,
    setShowAdminModal,
    setAdminError,
    setAlert,
    isSystemAnalyzing,
    isBlockedUser,
  } = useApp();

  // Global hotkey listener for Admin Auth modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      const isHKey =
        e.code === 'KeyH' ||
        e.key.toLowerCase() === 'h' ||
        e.key === 'ㅗ' ||
        e.key === 'ㅗ';

      // Trigger on Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
      if (isModifier && e.shiftKey && isHKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowAdminModal(!showAdminModal);
        setAdminError('');
        setAlert(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capturing phase to override default browser/element behaviors

    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showAdminModal, setAdminError, setAlert, setShowAdminModal]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'var(--text-dim)',
        }}
      >
        불러오는 중...
      </div>
    );
  }

  if (isBlockedUser && !isAdminMode) {
    return (
      <>
        <BlockedPage />
        <AdminLoginModal
          isOpen={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setAdminError('');
            setAlert(null);
          }}
        />
      </>
    );
  }

  if (isSystemAnalyzing) {
    return (
      <>
        <SystemAnalyzing />
        <AdminLoginModal
          isOpen={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setAdminError('');
            setAlert(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
        <InteractiveBackground />
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
          <Route path="/board" element={<Board />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>

      {/* Secret admin login modal */}
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setAdminError('');
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
