import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  API_BASE_URL,
  parseAlgorithmName,
  getBallStyle,
  getAlgorithmDescription,
} from "../../utils";

const DEFAULT_WEIGHTS = [25, 20, 15, 15, 10, 10, 5];

export function Generate() {
  const { appendAuth, showAlert, visitorId } = useApp();
  const [algorithmTypes, setAlgorithmTypes] = useState<string[]>([]);
  const [generatingAlgo, setGeneratingAlgo] = useState("MIN_COUNT");
  const [generatedNumbers, setGeneratedNumbers] = useState<number[] | null>(
    null,
  );
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Personal Weight States
  const [weights, setWeights] = useState<number[]>(DEFAULT_WEIGHTS);
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightStatus, setWeightStatus] = useState<"default" | "saved">(
    "default",
  );

  // Fetch weights when algorithm or visitorId changes
  useEffect(() => {
    const fetchPersonalWeights = async () => {
      if (!generatingAlgo || !visitorId) return;
      try {
        const res = await fetch(
          appendAuth(
            `${API_BASE_URL}/personal-weights?visitorId=${visitorId}&algorithm=${generatingAlgo}`,
          ),
        );
        if (res.ok) {
          const data = await res.json();
          const result = data.data || data;
          if (Array.isArray(result)) {
            setWeights(result);
            setWeightStatus("saved");
            return;
          }
        }
        // If not found or failed, reset to default
        setWeights(DEFAULT_WEIGHTS);
        setWeightStatus("default");
      } catch (err) {
        console.error("가중치 조회 실패", err);
        setWeights(DEFAULT_WEIGHTS);
        setWeightStatus("default");
      }
    };
    fetchPersonalWeights();
  }, [generatingAlgo, visitorId, appendAuth]);

  const currentWeightsSum = weights.reduce((a, b) => a + b, 0);
  const remainingWeight = 100 - currentWeightsSum;

  const handleWeightChange = (index: number, val: number) => {
    const sumOfOthers = weights.reduce(
      (sum, w, idx) => (idx === index ? sum : sum + w),
      0,
    );
    const maxAllowed = 100 - sumOfOthers;
    const finalVal = Math.min(val, maxAllowed);

    const nextWeights = [...weights];
    nextWeights[index] = finalVal;
    setWeights(nextWeights);
  };

  const handleSaveWeights = async () => {
    if (currentWeightsSum !== 100) {
      showAlert("error", "가중치의 합계는 반드시 100이어야 합니다.");
      return;
    }
    setSavingWeights(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/personal-weights`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: visitorId,
          algorithm: generatingAlgo,
          weights: weights,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "가중치 저장에 실패했습니다.");
      }
      showAlert(
        "success",
        "개인 가중치가 성공적으로 저장되었습니다. 번호 생성 시 이 가중치가 적용됩니다.",
      );
      setWeightStatus("saved");
    } catch (err) {
      const error = err as Error;
      showAlert("error", error.message);
    } finally {
      setSavingWeights(false);
    }
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setWeightStatus("default");
  };

  useEffect(() => {
    const fetchAlgorithmTypes = async () => {
      try {
        const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
        if (!res.ok) throw new Error("알고리즘 목록을 가져오지 못했습니다.");
        const data = await res.json();
        const result = data.data || data;
        const types = (result.types || []) as string[];
        setAlgorithmTypes(types);
        if (types.length > 0) {
          setGeneratingAlgo(types[0]);
        }
      } catch (err) {
        const error = err as Error;
        showAlert("error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlgorithmTypes();
  }, [appendAuth, showAlert]);

  // Click outside to close custom select dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".custom-select-container")) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleGeneratePrediction = async () => {
    setGenerating(true);
    setGeneratedNumbers(null);
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/algorithms/${generatingAlgo}/generate?visitorId=${visitorId}`,
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weights: weights,
          }),
        },
      );
      if (!res.ok) throw new Error("예측 번호 생성에 실패했습니다.");
      const data = await res.json();
      const result = data.data || data;
      setGeneratedNumbers(result.numbers as number[]);
      showAlert("success", "새로운 당첨 예측 번호가 생성되었습니다.");
    } catch (err) {
      const error = err as Error;
      showAlert("error", error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: "1.3rem", marginBottom: "16px" }}
      >
        당첨 예측번호 생성기
      </h2>
      <p
        className="access-desc"
        style={{ fontSize: "0.88rem", marginBottom: "24px" }}
      >
        사용하고자 하는 하이퍼-파라미터 알고리즘을 선택한 후 번호를
        생성해주십시오. 결과는 고유 식별자(IP 및 브라우저 세션)를 통해 내
        당첨이력에 즉시 아카이빙됩니다.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>
          알고리즘 목록을 불러오는 중...
        </p>
      ) : (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "var(--border-glass)",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "24px",
          }}
        >
          <label
            className="form-label"
            style={{ marginBottom: "8px", display: "block" }}
          >
            분석 예측 알고리즘 선택
          </label>

          {/* Premium Custom Dropdown */}
          <div
            className="custom-select-container"
            style={{ position: "relative", marginBottom: "20px" }}
          >
            <div
              className={`custom-select-trigger ${isDropdownOpen ? "active" : ""}`}
              onClick={() => !generating && setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.02)",
                border: isDropdownOpen
                  ? "1px solid rgba(250, 204, 21, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                padding: "12px 18px",
                borderRadius: "12px",
                color: "var(--text-main)",
                cursor: generating ? "not-allowed" : "pointer",
                boxShadow: isDropdownOpen
                  ? "0 0 20px rgba(250, 204, 21, 0.15)"
                  : "none",
                transition: "var(--transition-smooth)",
                opacity: generating ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!generating && !isDropdownOpen) {
                  e.currentTarget.style.borderColor =
                    "rgba(250, 204, 21, 0.25)";
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!generating && !isDropdownOpen) {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.02)";
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  선택된 알고리즘
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {parseAlgorithmName(generatingAlgo)}
                  {generatingAlgo && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        color: getBadgeDetails(generatingAlgo).color,
                        background: getBadgeDetails(generatingAlgo).bg,
                        border: getBadgeDetails(generatingAlgo).border,
                      }}
                    >
                      {getBadgeDetails(generatingAlgo).text}
                    </span>
                  )}
                </span>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                  color: isDropdownOpen ? "#facc15" : "var(--text-dim)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {isDropdownOpen && (
              <div
                className="custom-select-options"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "#0f111a",
                  border: "1px solid rgba(250, 204, 21, 0.25)",
                  borderRadius: "12px",
                  boxShadow:
                    "0 20px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(250, 204, 21, 0.05)",
                  zIndex: 10,
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  maxHeight: "240px",
                  overflowY: "auto",
                  animation: "slideDown 0.2s ease-out",
                }}
              >
                {algorithmTypes.map((type) => {
                  const badge = getBadgeDetails(type);
                  const isSelected = generatingAlgo === type;
                  return (
                    <div
                      key={type}
                      className={`custom-select-option ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setGeneratingAlgo(type);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "var(--transition-fast)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                        borderLeft: isSelected
                          ? "3px solid #facc15"
                          : "3px solid transparent",
                        background: isSelected
                          ? "rgba(250, 204, 21, 0.08)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.03)";
                          e.currentTarget.style.borderLeftColor =
                            "rgba(255, 255, 255, 0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderLeftColor = "transparent";
                        }
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: isSelected ? "#facc15" : "var(--text-main)",
                        }}
                      >
                        {parseAlgorithmName(type)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                          color: badge.color,
                          background: badge.bg,
                          border: badge.border,
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Algorithm Mechanism Info Box */}
          {generatingAlgo && (
            <div
              style={{
                background: "rgba(0, 240, 255, 0.02)",
                border: "1px solid rgba(0, 240, 255, 0.15)",
                padding: "16px 20px",
                borderRadius: "12px",
                marginBottom: "20px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                animation: "fadeIn 0.3s ease-out",
                boxShadow: "inset 0 0 15px rgba(0, 240, 255, 0.03)",
              }}
            >
              <div
                style={{
                  marginTop: "2px",
                  color: "var(--primary-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    color: "var(--primary-cyan)",
                    marginBottom: "4px",
                  }}
                >
                  알고리즘 상세 메커니즘
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    lineHeight: "1.5",
                  }}
                >
                  {getAlgorithmDescription(generatingAlgo)}
                </div>
              </div>
            </div>
          )}

          {/* Personal Weights Adjustment Section */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    color: "var(--text-main)",
                  }}
                >
                  개인 신뢰도 가중치 설정 (합계 100%)
                </span>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {weightStatus === "saved" ? (
                    <span style={{ color: "var(--success)" }}>
                      ● 개인화 가중치 적용됨
                    </span>
                  ) : (
                    <span>기본 가중치 적용 중</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    color:
                      currentWeightsSum === 100
                        ? "var(--success)"
                        : remainingWeight < 0
                          ? "var(--error)"
                          : "var(--primary-cyan)",
                  }}
                >
                  합계: {currentWeightsSum}%
                </span>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color:
                      remainingWeight === 0
                        ? "var(--success)"
                        : remainingWeight < 0
                          ? "var(--error)"
                          : "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {remainingWeight === 0
                    ? "완료"
                    : remainingWeight < 0
                      ? `${Math.abs(remainingWeight)}% 초과`
                      : `잔여: ${remainingWeight}% 가능`}
                </div>
              </div>
            </div>

            {/* Weights Sliders */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {weights.map((weight, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      width: "60px",
                    }}
                  >
                    {index < 6 ? index + 1 + "번째" : "보너스"} 자리
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) =>
                      handleWeightChange(index, Number(e.target.value))
                    }
                    style={{
                      flex: 1,
                      accentColor:
                        currentWeightsSum === 100
                          ? "var(--success)"
                          : "var(--primary-cyan)",
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: "var(--text-main)",
                      width: "35px",
                      textAlign: "right",
                    }}
                  >
                    {weight}%
                  </span>
                </div>
              ))}
            </div>

            {/* Save / Reset Actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: "14px",
              }}
            >
              <button
                type="button"
                className="btn-neon btn-outline"
                onClick={handleResetWeights}
                style={{
                  flex: 1,
                  height: "36px",
                  padding: "0 12px",
                  fontSize: "0.8rem",
                }}
              >
                기본값 재설정
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleSaveWeights}
                disabled={savingWeights || currentWeightsSum !== 100}
                style={{
                  flex: 2,
                  height: "36px",
                  padding: "0 12px",
                  fontSize: "0.8rem",
                  background:
                    currentWeightsSum !== 100
                      ? "var(--bg-input)"
                      : "linear-gradient(135deg, var(--primary-purple) 0%, #7c3aed 100%)",
                  color:
                    currentWeightsSum !== 100
                      ? "var(--text-dim)"
                      : "var(--text-main)",
                  cursor: currentWeightsSum !== 100 ? "not-allowed" : "pointer",
                  boxShadow:
                    currentWeightsSum !== 100
                      ? "none"
                      : "0 4px 15px var(--primary-purple-glow)",
                }}
              >
                {savingWeights ? "저장 중..." : "개인 가중치 저장 및 적용"}
              </button>
            </div>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textAlign: "left",
              marginBottom: "20px",
              lineHeight: "1.4",
            }}
          >
            ※ 설정한 가중치는 이번 예측번호 생성 시 적용되며, 이후 언제든
            가중치를 다르게 조절하여 새로운 번호를 추출해 볼 수 있습니다.
          </p>

          <button
            className="btn-neon btn-cyan"
            onClick={handleGeneratePrediction}
            disabled={generating || algorithmTypes.length === 0}
            style={{ height: "48px" }}
          >
            {generating ? "최적 조합 연산 중..." : "예측번호 생성하기"}
          </button>
        </div>
      )}

      {generatedNumbers && (
        <div
          style={{
            background: "rgba(189, 0, 255, 0.04)",
            border: "1px solid rgba(189, 0, 255, 0.25)",
            padding: "24px",
            borderRadius: "16px",
            textAlign: "center",
            animation: "fadeIn 0.4s ease-out",
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: "var(--primary-purple)",
              marginBottom: "16px",
            }}
          >
            생성된 {parseAlgorithmName(generatingAlgo)} 예측 조합 번호
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {generatedNumbers.slice(0, 6).map((num, i) => (
              <div
                key={i}
                className="lotto-ball lotto-ball-pop"
                style={{
                  ...getBallStyle(num),
                  animationDelay: `${i * 100}ms`,
                  margin: "0 4px",
                }}
              >
                {num}
              </div>
            ))}
            {generatedNumbers.length === 7 && (
              <>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "var(--text-muted)",
                    margin: "0 4px",
                    animation: "fadeIn 0.4s ease-out",
                    animationDelay: "600ms",
                    animationFillMode: "both",
                  }}
                >
                  +
                </div>
                <div
                  className="lotto-ball lotto-ball-pop"
                  style={{
                    ...getBallStyle(generatedNumbers[6]),
                    animationDelay: "700ms",
                    margin: "0 4px",
                  }}
                >
                  {generatedNumbers[6]}
                </div>
              </>
            )}
          </div>
          <p
            style={{
              marginTop: "16px",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            본 예측번호 조합은 [내 당첨이력] 메뉴에서 언제든지 실제 당첨결과와
            대조해 볼 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

const getBadgeDetails = (type: string) => {
  const commonBadgeStyle = {
    color: "#cbd5e1",
    bg: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  };

  switch (type) {
    case "MIN_COUNT":
      return {
        text: "자리별 희소",
        ...commonBadgeStyle,
      };
    case "TOTAL_MIN_COUNT":
      return {
        text: "누적 희소",
        ...commonBadgeStyle,
      };
    case "MAX_COUNT":
      return {
        text: "최다 빈출",
        ...commonBadgeStyle,
      };
    default:
      return {
        text: "알고리즘",
        ...commonBadgeStyle,
      };
  }
};

export default Generate;
