import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { API_BASE_URL, parseAlgorithmName } from "../utils";
import { Alert } from "./Alert";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const {
    adminKey,
    setAdminKey,
    adminError,
    setAdminError,
    loadAdminData,
    showAlert,
    appendAuth,
    alert,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"algo" | "system">("algo");
  const [algorithms, setAlgorithms] = useState<{ type: string; complexity: number }[]>([]);
  const [loadingAlgos, setLoadingAlgos] = useState(false);
  const [updatingAlgo, setUpdatingAlgo] = useState<string | null>(null);

  // System Tab States
  const [fetchingWinningNumbers, setFetchingWinningNumbers] = useState(false);
  const [analyzingReliability, setAnalyzingReliability] = useState(false);
  const [fetchEpisodeInput, setFetchEpisodeInput] = useState("");

  // Local authentication state so that it always asks for key on open
  const [isAuthSuccessLocal, setIsAuthSuccessLocal] = useState(false);

  // Reset local auth state and key whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAuthSuccessLocal(false);
      setAdminKey("");
      setAdminError("");
    }
  }, [isOpen, setAdminKey, setAdminError]);

  // Fetch algorithms on load if authenticated locally
  const fetchAlgorithms = async () => {
    setLoadingAlgos(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
      if (!res.ok) throw new Error("알고리즘 목록 로드 실패");
      const data = await res.json();
      const result = data.data || data;
      
      if (Array.isArray(result)) {
        setAlgorithms(result);
      } else if (result && Array.isArray(result.types)) {
        setAlgorithms(result.types.map((t: string) => ({ type: t, complexity: 0 })));
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "알고리즘 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingAlgos(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthSuccessLocal && activeTab === "algo") {
      fetchAlgorithms();
    }
  }, [isOpen, isAuthSuccessLocal, activeTab]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAdminError("관리자 키를 입력하세요.");
      return;
    }
    try {
      // Validate key via AppContext logic
      await loadAdminData(adminKey);
      setIsAuthSuccessLocal(true);
      showAlert("success", "관리자 인증에 성공했습니다.");
    } catch {
      // Error message is set inside AppContext and rendered below
    }
  };

  const handleUpdateComplexity = async (type: string, complexity: number) => {
    setUpdatingAlgo(type);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms/${type}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ complexity }),
      });
      if (!res.ok) throw new Error("알고리즘 복잡도 수정 실패");
      showAlert("success", `${parseAlgorithmName(type)} 복잡도를 ${complexity}로 변경했습니다.`);
      fetchAlgorithms();
    } catch (err) {
      console.error(err);
      showAlert("error", "복잡도 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdatingAlgo(null);
    }
  };

  // System actions
  const handleAdminFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchEpisodeInput.trim() || isNaN(Number(fetchEpisodeInput))) {
      showAlert("error", "올바른 회차 번호를 입력해주세요.");
      return;
    }
    setFetchingWinningNumbers(true);
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/winning-numbers/fetch?latestEpisode=${fetchEpisodeInput}`,
        ),
        { method: "POST" },
      );
      if (!res.ok) throw new Error("당첨번호 동기화에 실패했습니다.");
      showAlert("success", `${fetchEpisodeInput}회차까지 당첨번호가 성공적으로 동기화되었습니다.`);
      setFetchEpisodeInput("");
    } catch (err) {
      console.error(err);
      showAlert("error", "동기화 중 오류가 발생했습니다.");
    } finally {
      setFetchingWinningNumbers(false);
    }
  };

  const handleAdminAnalyze = async () => {
    setAnalyzingReliability(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/reliability/analyze`), {
        method: "POST",
      });
      if (!res.ok) throw new Error("알고리즘 신뢰도 배치 분석에 실패했습니다.");
      showAlert("success", "알고리즘 신뢰도 배치 분석이 성공적으로 실행되었습니다.");
    } catch (err) {
      console.error(err);
      showAlert("error", "분석 실행 중 오류가 발생했습니다.");
    } finally {
      setAnalyzingReliability(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div
        className="glass-card admin-modal-content"
        style={{
          maxWidth: "560px",
          width: "90%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 }}>
          <h2 className="access-title" style={{ fontSize: "1.3rem", margin: 0 }}>
            {isAuthSuccessLocal ? "관리자 제어판" : "관리자 키 인증"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "4px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {!isAuthSuccessLocal ? (
            /* Authentication Screen */
            <div>
              <p className="access-desc" style={{ fontSize: "0.85rem", marginBottom: "20px" }}>
                이 화면은 인가된 관리자만 접근 가능합니다. 관리자 키를 입력하여 주십시오.
              </p>

              {adminError && (
                <div className="alert alert-error" style={{ fontSize: "0.85rem", padding: "8px 12px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold" }}>⚠</span>
                  <div>{adminError}</div>
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                <input
                  type="password"
                  className="input-glow"
                  style={{ width: "100%", marginBottom: "16px" }}
                  placeholder="Master Key 입력"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn-submit" style={{ flex: 1, height: "42px" }}>
                    인증하기
                  </button>
                  <button type="button" className="btn-neon btn-outline" style={{ flex: 1, padding: 0, height: "42px" }} onClick={onClose}>
                    닫기
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Admin Control Panel Tab Screen */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px", marginBottom: "20px", flexShrink: 0 }}>
                <button
                  className={`tab-btn ${activeTab === "algo" ? "active-tab" : ""}`}
                  onClick={() => setActiveTab("algo")}
                  style={{ background: "transparent", border: "none", padding: "8px 16px", fontSize: "0.9rem", color: activeTab === "algo" ? "var(--primary-cyan)" : "var(--text-dim)", cursor: "pointer" }}
                >
                  알고리즘 관리
                </button>
                <button
                  className={`tab-btn ${activeTab === "system" ? "active-tab" : ""}`}
                  onClick={() => setActiveTab("system")}
                  style={{ background: "transparent", border: "none", padding: "8px 16px", fontSize: "0.9rem", color: activeTab === "system" ? "var(--primary-purple)" : "var(--text-dim)", cursor: "pointer" }}
                >
                  시스템 관리
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, minHeight: 0 }}>
                {activeTab === "algo" ? (
                  /* Algorithm Management Tab */
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "16px", flexShrink: 0 }}>
                      각 분석 알고리즘의 연산 복잡도(complexity) 수준을 실시간으로 커스텀 조율할 수 있습니다.
                    </p>

                    {loadingAlgos ? (
                      <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>목록 불러오는 중...</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "180px", overflowY: "auto", flex: 1, paddingRight: "6px" }}>
                        {algorithms.map((algo) => {
                          return (
                            <div key={algo.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                              <span style={{ fontSize: "0.88rem", fontWeight: "bold", color: "var(--text-main)" }}>
                                {parseAlgorithmName(algo.type)}
                              </span>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>복잡도:</span>
                                <input
                                  type="number"
                                  className="input-glow"
                                  style={{ width: "60px", height: "30px", padding: "0 6px", fontSize: "0.85rem", textAlign: "center" }}
                                  value={algo.complexity}
                                  min="1"
                                  max="5"
                                  onChange={(e) => {
                                    let val = parseInt(e.target.value, 10);
                                    if (isNaN(val)) val = 1;
                                    val = Math.max(1, Math.min(5, val));
                                    setAlgorithms(algorithms.map(a => a.type === algo.type ? { ...a, complexity: val } : a));
                                  }}
                                />
                                <button
                                  className="btn-submit"
                                  style={{ height: "30px", padding: "0 10px", fontSize: "0.75rem", background: "var(--primary-cyan)", color: "#0f111a", fontWeight: "bold" }}
                                  disabled={updatingAlgo === algo.type}
                                  onClick={() => handleUpdateComplexity(algo.type, algo.complexity)}
                                >
                                  {updatingAlgo === algo.type ? "변경중" : "변경"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* System Management Tab */
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", height: "100%", paddingRight: "6px" }}>
                    {/* Sync Winning Numbers */}
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                      <h4 style={{ fontSize: "0.9rem", color: "var(--primary-cyan)", margin: "0 0 6px 0" }}>당첨번호 동기화 (Fetch)</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", margin: "0 0 12px 0" }}>동행복권 최신 회차를 긁어와 로컬 데이터베이스를 동기화합니다.</p>
                      <form onSubmit={handleAdminFetch} style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          className="input-glow"
                          placeholder="최신 회차 번호 (예: 1220)"
                          value={fetchEpisodeInput}
                          onChange={(e) => setFetchEpisodeInput(e.target.value)}
                          disabled={fetchingWinningNumbers}
                          style={{ flex: 1, height: "36px", fontSize: "0.82rem" }}
                        />
                        <button className="btn-submit" type="submit" disabled={fetchingWinningNumbers} style={{ height: "36px", padding: "0 14px", fontSize: "0.82rem" }}>
                          {fetchingWinningNumbers ? "동기화중" : "실행"}
                        </button>
                      </form>
                    </div>

                    {/* Batch analysis */}
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                      <h4 style={{ fontSize: "0.9rem", color: "var(--primary-purple)", margin: "0 0 6px 0" }}>알고리즘 신뢰도 산출 (Reliability)</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", margin: "0 0 12px 0" }}>알고리즘별 평균 신뢰도 수치를 재산출하는 배치를 실행합니다.</p>
                      <button className="btn-submit" onClick={handleAdminAnalyze} disabled={analyzingReliability} style={{ height: "36px", width: "auto", padding: "0 20px", fontSize: "0.82rem" }}>
                        {analyzingReliability ? "분석 중..." : "신뢰도 분석 실행"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <Alert alert={alert} />
        </div>

        {/* Modal Footer */}
        {isAuthSuccessLocal && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0 }}>
            <button className="btn-neon btn-outline" style={{ height: "38px", padding: "0 20px", fontSize: "0.82rem" }} onClick={onClose}>
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
