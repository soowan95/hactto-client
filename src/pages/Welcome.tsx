import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Alert } from "../components/Alert";

export function Welcome() {
  const {
    allowed,
    checkIpStatus,
    submitting,
    handleMasterKeySubmit,
    alert,
    setAlert,
    showAlert,
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

  return (
    <div
      className="access-container"
      style={{ maxWidth: "640px", width: "100%" }}
    >
      <div className="glass-card allowed-dashboard">
        <div className="status-icon status-allowed">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <div className="allowed-header">
          <span className="logo-glow" style={{ fontSize: "2.5rem" }}>
            hactto
          </span>
          <h1 className="access-title" style={{ marginTop: "16px" }}>
            접근 권한이 확인되었습니다
          </h1>
          {localStorage.getItem("user_mk") ? (
            <p
              className="access-desc"
              style={{ maxWidth: "440px", margin: "0 auto 20px" }}
            >
              유효한 Master key 인증을 통해 hactto의
              <br />
              핵심 분석 도구와 대시보드에 접근하실 수 있습니다.
            </p>
          ) : (
            <p
              className="access-desc"
              style={{ maxWidth: "440px", margin: "0 auto 20px" }}
            >
              귀하의 IP가 안전한 화이트리스트에 등록되어 hactto의
              <br />
              핵심 분석 도구와 대시보드에 접근하실 수 있습니다.
            </p>
          )}
        </div>

        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-title">로또 번호 분석</div>
            <div className="feature-desc">
              역대 로또 번호 데이터를 기반으로 한 최적의 번호 생성 알고리즘
              엔진입니다.
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-title">알고리즘 신뢰도</div>
            <div className="feature-desc">
              추첨 결과 통계 시뮬레이션을 통해 생성된 번호들의 신뢰도 점수를
              검증합니다.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button
            className="btn-neon btn-cyan"
            onClick={() => navigate("/home")}
            style={{ flex: 2 }}
          >
            서비스 진입하기
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          {localStorage.getItem("user_mk") ? (
            <button
              className="btn-neon btn-outline"
              onClick={handleDisconnectMasterKey}
              style={{
                flex: 1,
                color: "var(--primary-purple)",
                borderColor: "rgba(189, 0, 255, 0.3)",
                padding: 0,
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
              style={{ flex: 1, padding: 0 }}
            >
              {showMasterKeyForm ? "등록 취소" : "Master key 등록"}
            </button>
          )}
        </div>

        {showMasterKeyForm && !localStorage.getItem("user_mk") && (
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
              htmlFor="welcomeMasterKey"
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
                  id="welcomeMasterKey"
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

        <Alert alert={alert} />
      </div>
    </div>
  );
}
