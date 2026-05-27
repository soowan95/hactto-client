import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  API_BASE_URL,
  parseAlgorithmName,
  getAlgorithmDescription,
} from "../../utils";

export function Stats() {
  const { appendAuth, showAlert } = useApp();
  const [algorithmTypes, setAlgorithmTypes] = useState<string[]>([]);
  const [algorithmStats, setAlgorithmStats] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlgorithmStats = async () => {
      try {
        const typesRes = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
        if (!typesRes.ok) throw new Error("알고리즘 목록 로드 실패");
        const typesData = await typesRes.json();
        const result = typesData.data || typesData;
        const types = (result.types || []) as string[];
        setAlgorithmTypes(types);

        const stats: Record<string, number> = {};
        for (const type of types) {
          const statsRes = await fetch(
            appendAuth(`${API_BASE_URL}/reliability/average?algorithm=${type}`),
          );
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const statsResult = statsData.data || statsData;
            stats[type] = statsResult.average || 0;
          }
        }
        setAlgorithmStats(stats);
      } catch (err) {
        const error = err as Error;
        showAlert("error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlgorithmStats();
  }, [appendAuth, showAlert]);

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: "1.3rem", marginBottom: "16px" }}
      >
        알고리즘별 평균 신뢰도 통계
      </h2>
      <p
        className="access-desc"
        style={{ fontSize: "0.88rem", marginBottom: "24px" }}
      >
        알고리즘 신뢰도 점수는 과거 데이터 시뮬레이션을 통해 생성된 번호가 실제
        당첨 번호 분포와 얼마나 근접하게 일치했는지를 수치화한 지표입니다.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>통계 정보를 집계하는 중...</p>
      ) : algorithmTypes.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>
          조회 가능한 알고리즘 유형이 없습니다.
        </p>
      ) : (
        algorithmTypes.map((type) => {
          const score = algorithmStats[type];
          return (
            <div
              key={type}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "var(--border-glass)",
                padding: "20px",
                borderRadius: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    color: "var(--primary-cyan)",
                    fontFamily: "monospace",
                  }}
                >
                  {parseAlgorithmName(type)}
                </span>
                <span
                  style={{ fontWeight: "bold", color: "var(--primary-purple)" }}
                >
                  {score !== undefined ? `${score.toFixed(2)} %` : "집계 중..."}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${score || 0}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)",
                    borderRadius: "4px",
                    transition: "width 1s ease-out",
                  }}
                ></div>
              </div>
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                }}
              >
                {getAlgorithmDescription(type)}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
export default Stats;
