import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { API_BASE_URL, parseAlgorithmName } from "../../utils";
import { LottoBalls } from "../../components/LottoBall";
import { LottoAnalysisCard } from "../../components/LottoAnalysisCard";
import { PersonalAnalysisCard } from "../../components/PersonalAnalysisCard";

export function History() {
  const location = useLocation();
  const { visitorId, appendAuth, showAlert } = useApp();
  
  const defaultTab = location.state?.defaultTab === "personal" ? "personal" : "algorithm";
  const [activeSubTab, setActiveSubTab] = useState<"algorithm" | "personal">(defaultTab);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string | number, boolean>>({});

  const toggleExpand = (id: string | number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchHistoryList = async () => {
      if (!visitorId) return;
      try {
        setLoading(true);
        setHistoryList([]);
        setExpandedItems({});
        
        const endpoint =
          activeSubTab === "algorithm"
            ? `${API_BASE_URL}/algorithms/history`
            : `${API_BASE_URL}/personal-predictions/history`;

        const res = await fetch(appendAuth(endpoint), {
          headers: {
            "x-visitor-id": visitorId,
          },
        });
        if (!res.ok) throw new Error("당첨 이력을 가져오지 못했습니다.");
        const data = await res.json();
        setHistoryList(data.data || data || []);
      } catch (err) {
        const error = err as Error;
        showAlert("error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryList();
  }, [visitorId, appendAuth, showAlert, activeSubTab]);

  const renderSubTabs = () => {
    const tabs = [
      { id: "algorithm", label: "알고리즘 분석" },
      { id: "personal", label: "개인 예측번호" },
    ] as const;

    return (
      <div
        style={{
          display: "inline-flex",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "4px",
          borderRadius: "10px",
          marginBottom: "24px",
          gap: "2px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                background: isActive
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
                border: "none",
                color: isActive ? "var(--text-main)" : "var(--text-muted)",
                fontFamily: "var(--font-family)",
                fontWeight: isActive ? "600" : "500",
                fontSize: "0.85rem",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: "1.3rem", marginBottom: "16px" }}
      >
        내 예측 당첨이력 확인
      </h2>
      <p
        className="access-desc"
        style={{ fontSize: "0.88rem", marginBottom: "24px" }}
      >
        이 브라우저 세션을 통해 생성된 모든 예측 조합의 추첨 대조 내역입니다.
        추첨이 완료되면 매칭된 등수(1~5등)가 표시됩니다.
      </p>

      {renderSubTabs()}

      <div className="scroll-y-container">
        {loading ? (
          <p
            style={{
              color: "var(--text-dim)",
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            이력을 로드하는 중...
          </p>
        ) : historyList.length === 0 ? (
          <p
            style={{
              color: "var(--text-dim)",
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            {activeSubTab === "algorithm"
              ? "생성된 이력이 없습니다. 예측 번호를 먼저 생성해주세요."
              : "저장된 개인 예측번호가 없습니다. 예측번호 분석기에서 번호를 저장해주세요."}
          </p>
        ) : (
          historyList.map((hist) => {
            const hasResult = hist.matchResult !== null;
            const isExpanded = !!expandedItems[hist.id];
            return (
              <div key={hist.id} className="history-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "var(--primary-cyan)",
                        fontSize: "0.95rem",
                      }}
                    >
                      {hist.episode}회차 예측
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-dim)",
                        marginLeft: "10px",
                      }}
                    >
                      {activeSubTab === "algorithm"
                        ? `[${parseAlgorithmName(hist.algorithm)}]`
                        : "[개인 지정]"}
                    </span>
                  </div>
                  <div>
                    {hasResult && hist.matchResult ? (
                      hist.matchResult.rank > 0 ? (
                        <span
                          className={`badge badge-rank-${hist.matchResult.rank}`}
                        >
                          {hist.matchResult.rank}등 당첨!!
                        </span>
                      ) : (
                        <span className="badge badge-no-prize">낙첨</span>
                      )
                    ) : (
                      <span className="badge badge-pending">추첨 대기중</span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    예측 조합:
                  </div>
                  <LottoBalls
                    numbers={hist.numbers}
                    matchResult={hist.matchResult}
                  />
                  <div style={{ marginTop: "8px", textAlign: "right" }}>
                    <button
                      onClick={() => toggleExpand(hist.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--primary-cyan)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        padding: "4px 0",
                        fontWeight: 600,
                      }}
                    >
                      {isExpanded ? "상세 분석 접기 ▲" : "상세 분석 보기 ▼"}
                    </button>
                  </div>
                </div>

                {isExpanded && hist.analysis && (
                  activeSubTab === "algorithm" ? (
                    <LottoAnalysisCard
                      numbers={hist.numbers}
                      analysis={hist.analysis}
                    />
                  ) : (
                    <PersonalAnalysisCard
                      numbers={hist.numbers}
                      analysis={hist.analysis}
                    />
                  )
                )}

                {hasResult && hist.matchResult && (
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      paddingTop: "10px",
                      marginTop: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}
                    >
                      실제 당첨: (일치 개수:{" "}
                      <span
                        style={{
                          color: "var(--primary-cyan)",
                          fontWeight: "bold",
                        }}
                      >
                        {hist.matchResult.matchCount}개
                      </span>
                      {hist.matchResult.bonusMatch ? " + 보너스 일치" : ""})
                    </div>
                    <LottoBalls numbers={hist.matchResult.winningNumbers} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default History;
