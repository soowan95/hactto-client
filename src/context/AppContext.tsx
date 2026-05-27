/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { AlertState } from "../types";
import { API_BASE_URL } from "../utils";

interface AppContextType {
  loading: boolean;
  allowed: boolean | null;
  pending: boolean;
  clientIp: string;
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  showAdminModal: boolean;
  setShowAdminModal: (val: boolean) => void;
  adminKey: string;
  setAdminKey: (val: string) => void;
  adminError: string;
  setAdminError: (val: string) => void;
  visitorId: string;
  alert: AlertState | null;
  setAlert: (alert: AlertState | null) => void;
  showAlert: (type: "success" | "error", text: string) => void;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;
  checkIpStatus: () => Promise<void>;
  handleMasterKeySubmit: (key: string) => Promise<boolean>;
  handleRequestAccess: () => Promise<void>;
  loadAdminData: (
    key: string,
  ) => Promise<{
    pendingIps: string[];
    allowedIps: string[];
    masterKeys: string[];
  }>;
  handleAdminLogout: () => void;
  appendAuth: (url: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [clientIp, setClientIp] = useState<string>("");
  const [visitorId, setVisitorId] = useState<string>("");

  // Admin states
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>("");
  const [adminError, setAdminError] = useState<string>("");

  // UI state
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Show auto-dismiss alerts
  const showAlert = useCallback((type: "success" | "error", text: string) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  }, []);

  // Helper to append Master Key if present
  const appendAuth = useCallback((url: string) => {
    const mk = localStorage.getItem("user_mk");
    if (!mk) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}mk=${encodeURIComponent(mk)}`;
  }, []);

  // Fetch initial IP status / verify saved master key
  const checkIpStatus = useCallback(async () => {
    try {
      await Promise.resolve();
      setLoading(true);
      const savedUserMk = localStorage.getItem("user_mk");

      // If a Master Key is saved locally, prioritize verifying it first
      if (savedUserMk) {
        const adminRes = await fetch(
          `${API_BASE_URL}/check-ip?mk=${encodeURIComponent(savedUserMk)}`,
        );
        const adminData = await adminRes.json();
        const adminResult = adminData.data || adminData;

        if (adminRes.ok && adminResult.allowed) {
          setAllowed(true);
          setPending(false);
          setClientIp(adminResult.ip || "unknown");
          if (adminResult.visitorId) {
            setVisitorId(adminResult.visitorId);
            localStorage.setItem("visitor_id", adminResult.visitorId);
          }
          setLoading(false);
          return;
        } else {
          localStorage.removeItem("user_mk");
        }
      }

      // Default IP check
      const res = await fetch(`${API_BASE_URL}/check-ip`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("IP 상태를 조회하는 중 오류가 발생했습니다.");
      }

      const data = await res.json();
      const result = data.data || data;

      setAllowed(!!result.allowed);
      setPending(!!result.pending);
      setClientIp(result.ip || "unknown");
      if (result.visitorId) {
        setVisitorId(result.visitorId);
        localStorage.setItem("visitor_id", result.visitorId);
      }
    } catch (err: unknown) {
      console.error(err);
      setAllowed(false);
      setPending(false);
      setClientIp("알 수 없음");
      const error = err as Error;
      showAlert("error", error.message || "서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Register/Verify Master Key
  const handleMasterKeySubmit = useCallback(
    async (key: string): Promise<boolean> => {
      if (!key.trim()) {
        showAlert("error", "Master key를 입력해주세요.");
        return false;
      }

      try {
        setSubmitting(true);
        setAlert(null);

        const res = await fetch(
          `${API_BASE_URL}/check-ip?mk=${encodeURIComponent(key)}`,
        );
        const data = await res.json();
        const result = data.data || data;

        if (!res.ok || !result.allowed) {
          throw new Error(
            "올바르지 않은 Master key이거나 인증에 실패했습니다.",
          );
        }

        localStorage.setItem("user_mk", key);
        showAlert(
          "success",
          "Master key 인증 성공! 플랫폼 접근 권한이 부여되었습니다.",
        );

        // Reload states
        await checkIpStatus();
        return true;
      } catch (err: unknown) {
        console.error(err);
        const error = err as Error;
        showAlert(
          "error",
          error.message || "Master key 검증 중 오류가 발생했습니다.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [checkIpStatus, showAlert],
  );

  // Request Access
  const handleRequestAccess = useCallback(async () => {
    try {
      setSubmitting(true);
      setAlert(null);
      const res = await fetch(`${API_BASE_URL}/request-access`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || "접근 승인 대기열 등록에 실패했습니다.",
        );
      }

      showAlert(
        "success",
        "관리자 승인 대기열에 성공적으로 등록되었습니다. 승인을 기다려주세요.",
      );
      setTimeout(() => {
        checkIpStatus();
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      showAlert("error", error.message || "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [checkIpStatus, showAlert]);

  // Load administrative data from Redis
  const loadAdminData = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setAdminError("");

      const pendingRes = await fetch(
        `${API_BASE_URL}/admin/whitelist/pending?rmk=${encodeURIComponent(key)}`,
      );
      if (!pendingRes.ok) throw new Error("승인 대기열 로드 실패");
      const pendingData = await pendingRes.json();

      const allowedRes = await fetch(
        `${API_BASE_URL}/admin/whitelist/read?t=ip&rmk=${encodeURIComponent(key)}`,
      );
      if (!allowedRes.ok) throw new Error("화이트리스트 로드 실패");
      const allowedData = await allowedRes.json();

      const mksRes = await fetch(
        `${API_BASE_URL}/admin/whitelist/read?t=mk&rmk=${encodeURIComponent(key)}`,
      );
      if (!mksRes.ok) throw new Error("Master key 목록 로드 실패");
      const mksData = await mksRes.json();

      sessionStorage.setItem("rmk", key);
      setIsAdminMode(true);
      setShowAdminModal(false);

      return {
        pendingIps: (pendingData.data || pendingData || []) as string[],
        allowedIps: (allowedData.data || allowedData || []) as string[],
        masterKeys: (mksData.data || mksData || []) as string[],
      };
    } catch (err: unknown) {
      console.error(err);
      const errMsg = "관리자 키 인증 실패 또는 데이터를 불러오지 못했습니다.";
      setAdminError(errMsg);
      sessionStorage.removeItem("rmk");
      setIsAdminMode(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout from Admin
  const handleAdminLogout = useCallback(() => {
    sessionStorage.removeItem("rmk");
    setIsAdminMode(false);
    setAdminKey("");
    checkIpStatus();
  }, [checkIpStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkIpStatus();

    const savedKey = sessionStorage.getItem("rmk");
    if (savedKey) {
      setIsAdminMode(true);
      loadAdminData(savedKey).catch(() => {});
    }
  }, [checkIpStatus, loadAdminData]);

  return (
    <AppContext.Provider
      value={{
        loading,
        allowed,
        pending,
        clientIp,
        isAdminMode,
        setIsAdminMode,
        showAdminModal,
        setShowAdminModal,
        adminKey,
        setAdminKey,
        adminError,
        setAdminError,
        visitorId,
        alert,
        setAlert,
        showAlert,
        submitting,
        setSubmitting,
        checkIpStatus,
        handleMasterKeySubmit,
        handleRequestAccess,
        loadAdminData,
        handleAdminLogout,
        appendAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
export default AppProvider;
