import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Alert } from "./Alert";
import { IpRequestModal } from "./IpRequestModal";
import { UnsavedChangesModal } from "./UnsavedChangesModal";

export function Layout() {
  const {
    allowed,
    alert,
    setAlert,
    showAlert,
    submitting,
    checkIpStatus,
    handleMasterKeySubmit,
    visitorId,
    showIpRequestModal,
    setShowIpRequestModal,
    hasUnsavedWeights,
    showUnsavedModal,
    setShowUnsavedModal,
    setUnsavedActionTarget,
  } = useApp();

  const navigate = useNavigate();
  const [showMasterKeyForm, setShowMasterKeyForm] = useState(false);
  const [masterKey, setMasterKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If user is not allowed, redirect to Gate
  useEffect(() => {
    if (allowed === false) {
      navigate("/gate");
    }
  }, [allowed, navigate]);

  const onMasterKeySubmitLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleMasterKeySubmit(masterKey);
    if (success) {
      setMasterKey("");
      setShowMasterKeyForm(false);
    }
  };

  const handleDisconnectMasterKey = async () => {
    localStorage.removeItem("user_mk");
    showAlert("success", "Master key 등록이 해제되었습니다.");
    await checkIpStatus();
  };

  // Determine if System admin tab should be visible
  const hasAdminAccess = !!(
    localStorage.getItem("user_mk") || sessionStorage.getItem("rmk")
  );

  const handleTabClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
    isRestricted: boolean = false,
  ) => {
    if (isRestricted && visitorId === "guest") {
      e.preventDefault();
      setShowIpRequestModal(true);
      return;
    }

    if (hasUnsavedWeights) {
      e.preventDefault();
      setUnsavedActionTarget(() => () => {
        navigate(path);
      });
      setShowUnsavedModal(true);
    }
  };

  const handleGoBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    const performGoBack = async () => {
      if (visitorId === "guest") {
        localStorage.removeItem("visitor_id");
        await checkIpStatus();
        navigate("/gate");
      } else {
        navigate("/");
      }
    };

    if (hasUnsavedWeights) {
      e.preventDefault();
      setUnsavedActionTarget(() => () => {
        performGoBack();
      });
      setShowUnsavedModal(true);
    } else {
      performGoBack();
    }
  };

  const layoutWidth = hasAdminAccess ? "820px" : "720px";

  return (
    <div
      className="access-container"
      style={{ maxWidth: layoutWidth, width: "100%" }}
    >
      <div
        className="glass-card dashboard-container"
        style={{ textAlign: "left", padding: "30px 40px" }}
      >
        {/* Dashboard Header */}
        <div
          className="admin-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "16px",
          }}
        >
          <div>
            <span
              className="logo-glow"
              style={{ fontSize: "1.8rem", cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              hactto
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                background: "rgba(0, 240, 255, 0.1)",
                color: "var(--primary-cyan)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                marginLeft: "12px",
              }}
            >
              대시보드
            </span>
          </div>

          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            {localStorage.getItem("user_mk") ? (
              <button
                className="btn-neon btn-outline"
                onClick={handleDisconnectMasterKey}
                style={{
                  width: "auto",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  color: "var(--primary-purple)",
                  borderColor: "rgba(189, 0, 255, 0.3)",
                }}
              >
                Master key 해제
              </button>
            ) : (
              <button
                className="btn-neon btn-outline"
                onClick={() => {
                  setShowMasterKeyForm((prev) => !prev);
                  setAlert(null);
                }}
                style={{
                  width: "auto",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                }}
              >
                {showMasterKeyForm ? "등록 취소" : "Master key 등록"}
              </button>
            )}
            <button
              className="btn-neon btn-outline"
              onClick={handleGoBack}
              style={{ width: "auto", padding: "6px 12px", fontSize: "0.8rem" }}
            >
              돌아가기
            </button>
          </div>
        </div>

        {/* Master Key Form */}
        {showMasterKeyForm && !localStorage.getItem("user_mk") && (
          <form
            className="masterkey-form-container"
            onSubmit={onMasterKeySubmitLocal}
            style={{
              marginBottom: "24px",
              background: "rgba(255,255,255,0.02)",
              padding: "20px",
              borderRadius: "16px",
              border: "var(--border-glass)",
              textAlign: "left",
            }}
          >
            <label
              className="form-label"
              htmlFor="dashboardMasterKey"
              style={{ marginBottom: "8px", display: "block" }}
            >
              Master key 등록
            </label>
            <div
              className="input-container"
              style={{ display: "flex", gap: "8px" }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  id="dashboardMasterKey"
                  className="input-glow"
                  type={showPassword ? "text" : "password"}
                  placeholder="Master key를 입력하세요"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  autoFocus
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-dim)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                className="btn-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "검증..." : "인증"}
              </button>
            </div>
          </form>
        )}

        {/* Navigation Tabs */}
        <div
          className="admin-tabs"
          style={{
            display: "flex",
            gap: "5px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <NavLink
            to="/home"
            onClick={(e) => handleTabClick(e, "/home", false)}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            최근 당첨번호
          </NavLink>
          <NavLink
            to="/search"
            onClick={(e) => handleTabClick(e, "/search", false)}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            당첨번호 조회
          </NavLink>
          <NavLink
            to="/stats"
            onClick={(e) => handleTabClick(e, "/stats", false)}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            알고리즘 통계
          </NavLink>
          <NavLink
            to="/generate"
            onClick={(e) => handleTabClick(e, "/generate", true)}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            예측번호 생성
          </NavLink>
          <NavLink
            to="/history"
            onClick={(e) => handleTabClick(e, "/history", true)}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            내 당첨이력
          </NavLink>
          {hasAdminAccess && (
            <NavLink
              to="/system"
              onClick={(e) => handleTabClick(e, "/system", true)}
              className={({ isActive }) =>
                `tab-btn ${isActive ? "active-tab" : ""}`
              }
            >
              시스템 관리
            </NavLink>
          )}
        </div>

        {/* Tab Page Contents */}
        <div
          className="scroll-y-container"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "8px",
            marginRight: "-8px",
            minHeight: 0,
            marginBottom: "12px",
          }}
        >
          <Outlet />
        </div>

        {/* Global Toast Alerts */}
        <Alert alert={alert} />
      </div>

      {/* Guest IP Access Request Modal */}
      <IpRequestModal
        isOpen={showIpRequestModal}
        onClose={() => setShowIpRequestModal(false)}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
      />
    </div>
  );
}
