import { useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "../../context/AppContext";
import { API_BASE_URL } from "../../utils";

export function System() {
  const { showAlert } = useApp();
  const [fetchEpisodeInput, setFetchEpisodeInput] = useState("");
  const [fetchingWinningNumbers, setFetchingWinningNumbers] = useState(false);
  const [analyzingReliability, setAnalyzingReliability] = useState(false);

  const key = sessionStorage.getItem("rmk") || localStorage.getItem("user_mk");

  const handleAdminFetch = async (e: FormEvent) => {
    e.preventDefault();
    if (!fetchEpisodeInput.trim() || isNaN(Number(fetchEpisodeInput))) {
      showAlert("error", "올바른 회차 번호를 입력해주세요.");
      return;
    }
    if (!key) {
      showAlert("error", "인증 키가 존재하지 않습니다.");
      return;
    }

    try {
      setFetchingWinningNumbers(true);
      const res = await fetch(
        `${API_BASE_URL}/winning-numbers/fetch?latestEpisode=${fetchEpisodeInput}&rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
        },
      );

      if (!res.ok) throw new Error("당첨번호 동기화에 실패했습니다.");
      showAlert(
        "success",
        `${fetchEpisodeInput}회차까지의 당첨번호가 성공적으로 동기화되었습니다.`,
      );
      setFetchEpisodeInput("");
    } catch (err) {
      console.error(err);
      const error = err as Error;
      showAlert("error", error.message || "동기화 중 오류가 발생했습니다.");
    } finally {
      setFetchingWinningNumbers(false);
    }
  };

  const handleAdminAnalyze = async () => {
    if (!key) {
      showAlert("error", "인증 키가 존재하지 않습니다.");
      return;
    }
    try {
      setAnalyzingReliability(true);
      const res = await fetch(
        `${API_BASE_URL}/reliability/analyze?rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
        },
      );

      if (!res.ok) throw new Error("알고리즘 신뢰도 배치 분석에 실패했습니다.");
      showAlert(
        "success",
        "알고리즘 신뢰도 배치 분석이 성공적으로 실행되었습니다.",
      );
    } catch (err) {
      console.error(err);
      const error = err as Error;
      showAlert("error", error.message || "분석 실행 중 오류가 발생했습니다.");
    } finally {
      setAnalyzingReliability(false);
    }
  };

  if (!key) {
    return (
      <p style={{ color: "var(--text-dim)" }}>
        이 영역은 관리자 키 인증을 마친 사용자만 조작 가능합니다.
      </p>
    );
  }

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: "1.3rem", marginBottom: "16px" }}
      >
        시스템 데이터 관리
      </h2>
      <p
        className="access-desc"
        style={{ fontSize: "0.88rem", marginBottom: "24px" }}
      >
        시스템의 핵심 데이터를 동기화하고 알고리즘의 신뢰도를 실시간 분석할 수
        있는 관리자 도구입니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* 당첨번호 동기화 */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            padding: "20px",
            borderRadius: "12px",
            border: "var(--border-glass)",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: "var(--primary-cyan)",
              marginBottom: "8px",
            }}
          >
            당첨번호 동기화 (Fetch)
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}
          >
            동행복권 서버로부터 최신 당첨 번호 데이터를 긁어와 동기화합니다.
          </p>
          <form
            onSubmit={handleAdminFetch}
            style={{ display: "flex", gap: "10px", alignItems: "center" }}
          >
            <input
              type="text"
              className="input-glow"
              placeholder="동기화할 최신 회차 번호 입력 (예: 1220)"
              value={fetchEpisodeInput}
              onChange={(e) => setFetchEpisodeInput(e.target.value)}
              disabled={fetchingWinningNumbers}
              style={{ flex: 1 }}
            />
            <button
              className="btn-submit"
              type="submit"
              disabled={fetchingWinningNumbers}
              style={{ height: "42px", whiteSpace: "nowrap" }}
            >
              {fetchingWinningNumbers ? "동기화 중..." : "동기화 실행"}
            </button>
          </form>
        </div>

        {/* 알고리즘 신뢰도 산출 */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            padding: "20px",
            borderRadius: "12px",
            border: "var(--border-glass)",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: "var(--primary-purple)",
              marginBottom: "8px",
            }}
          >
            알고리즘 신뢰도 산출 (Reliability)
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}
          >
            예측 알고리즘 모델의 평균 신뢰도 통계를 다시 산출하는 배치
            프로세스를 실행합니다.
          </p>
          <button
            className="btn-submit"
            onClick={handleAdminAnalyze}
            disabled={analyzingReliability}
            style={{ height: "42px", width: "auto", padding: "0 24px" }}
          >
            {analyzingReliability ? "분석 중..." : "신뢰도 분석 실행"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default System;
