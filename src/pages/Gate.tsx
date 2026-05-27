import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Alert } from "../components/Alert";

export function Gate() {
  const {
    allowed,
    pending,
    clientIp,
    submitting,
    handleRequestAccess,
    handleMasterKeySubmit,
    checkIpStatus,
    alert,
    setAlert,
    loading,
  } = useApp();

  const navigate = useNavigate();
  const [showMasterKeyForm, setShowMasterKeyForm] = useState(false);
  const [masterKey, setMasterKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If user becomes allowed, redirect to home page
  useEffect(() => {
    if (allowed === true) {
      navigate("/");
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

  return (
    <div className="access-container">
      {pending ? (
        /* =========================================================================
           PENDING SCREEN VIEW
           ========================================================================= */
        <div className="glass-card">
          <div
            className="status-icon"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid #f59e0b",
              color: "#f59e0b",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <span
            className="logo-glow"
            style={{
              fontSize: "1.8rem",
              display: "block",
              marginBottom: "12px",
            }}
          >
            hactto
          </span>
          <h1 className="access-title">접근 승인 대기 중입니다</h1>
          <p className="access-desc">
            귀하의 접근 요청이 관리자 승인 대기열에 등록되었습니다. 관리자가
            확인 후 승인하면 자동으로 대시보드로 입장하실 수 있습니다.
          </p>

          <div className="ip-info" style={{ marginBottom: "24px" }}>
            <span>대기 등록 IP:</span>
            <span className="ip-value" style={{ color: "#f59e0b" }}>
              {clientIp}
            </span>
          </div>

          <button
            className="btn-neon btn-outline"
            onClick={checkIpStatus}
            disabled={loading}
          >
            {loading ? "새로고침 중..." : "승인 상태 새로고침"}
          </button>

          <Alert alert={alert} />
        </div>
      ) : (
        /* =========================================================================
           DENIED SCREEN VIEW
           ========================================================================= */
        <div className="glass-card">
          <div className="status-icon status-denied">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <span
            className="logo-glow"
            style={{
              fontSize: "1.8rem",
              display: "block",
              marginBottom: "12px",
            }}
          >
            hactto
          </span>
          <h1 className="access-title">hactto에 대한 접근 권한이 없습니다.</h1>
          <p className="access-desc">
            이 시스템은 인가된 IP 주소에서만 접근할 수 있는 폐쇄적 분석
            플랫폼입니다. 권한을 부여받으려면 아래 수단 중 하나로 요청해
            주십시오.
          </p>

          <div className="ip-info">
            <span>접근 IP:</span>
            <span className="ip-value">{clientIp}</span>
          </div>

          <div className="actions-wrapper">
            <button
              className="btn-neon btn-cyan"
              onClick={handleRequestAccess}
              disabled={submitting}
            >
              {submitting ? "처리 중..." : "관리자에게 등록 요청"}
              {!submitting && (
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </button>

            <button
              className="btn-neon btn-outline"
              onClick={() => {
                setShowMasterKeyForm(!showMasterKeyForm);
                setAlert(null);
              }}
              disabled={submitting}
            >
              {showMasterKeyForm ? "Master key 입력 취소" : "Master key 등록"}
              {!showMasterKeyForm && (
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </button>
          </div>

          {/* Master Key Form */}
          {showMasterKeyForm && (
            <form
              className="masterkey-form-container"
              onSubmit={onMasterKeySubmitLocal}
              style={{
                marginTop: "20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "20px",
                textAlign: "left",
              }}
            >
              <label
                className="form-label"
                htmlFor="masterKey"
                style={{ marginBottom: "8px", display: "block" }}
              >
                Master key 입력
              </label>
              <div
                className="input-container"
                style={{ display: "flex", gap: "8px" }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    id="masterKey"
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

          {/* Response Alerts */}
          <Alert alert={alert} />
        </div>
      )}
    </div>
  );
}
