import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL, parseAlgorithmName } from '../../utils';
import { LottoBalls } from '../../components/LottoBall';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import { PersonalAnalysisCard } from '../../components/PersonalAnalysisCard';
import { HonHistoryModal } from '../../components/HonHistoryModal';
import type { PersonalAnalysis } from '../../types';

export function History() {
  const location = useLocation();
  const { visitorId, appendAuth, showAlert } = useApp();
  const [showHonHistoryModal, setShowHonHistoryModal] = useState(false);
  const [selectedPersonalAnalysis, setSelectedPersonalAnalysis] = useState<{
    numbers: number[];
    analysis: PersonalAnalysis;
    episode: number;
  } | null>(null);

  const defaultTab =
    location.state?.defaultTab === 'personal' ? 'personal' : 'algorithm';
  const [activeSubTab, setActiveSubTab] = useState<'algorithm' | 'personal'>(
    defaultTab,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<
    Record<string | number, boolean>
  >({});

  // Prevent body scroll when modal is open and add ESC key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPersonalAnalysis(null);
      }
    };

    if (selectedPersonalAnalysis) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPersonalAnalysis]);

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
          activeSubTab === 'algorithm'
            ? `${API_BASE_URL}/algorithms/history`
            : `${API_BASE_URL}/personal-predictions/history`;

        const res = await fetch(appendAuth(endpoint), {
          headers: {
            'x-visitor-id': visitorId,
          },
        });
        if (!res.ok) throw new Error('당첨 이력을 가져오지 못했습니다.');
        const data = await res.json();
        setHistoryList(data.data || data || []);
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryList();
  }, [visitorId, appendAuth, showAlert, activeSubTab]);

  const renderSubTabs = () => {
    const tabs = [
      { id: 'algorithm', label: '알고리즘 분석' },
      { id: 'personal', label: '개인 예측번호' },
    ] as const;

    return (
      <div
        style={{
          display: 'inline-flex',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '24px',
          gap: '2px',
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
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                border: 'none',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                fontFamily: 'var(--font-family)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.85rem',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 className="access-title" style={{ fontSize: '1.3rem', margin: 0 }}>
          내 예측 당첨이력 확인
        </h2>
        <button
          onClick={() => setShowHonHistoryModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'var(--primary-cyan)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.color = 'var(--text-dim)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          HON 사용내역 확인
        </button>
      </div>
      <p
        className="access-desc"
        style={{ fontSize: '0.88rem', marginBottom: '24px' }}
      >
        이 브라우저 세션을 통해 생성된 모든 예측 조합의 추첨 대조 내역입니다.
        추첨이 완료되면 매칭된 등수(1~5등)가 표시됩니다.
      </p>

      {renderSubTabs()}

      <div className="scroll-y-container">
        {loading ? (
          <p
            style={{
              color: 'var(--text-dim)',
              textAlign: 'center',
              padding: '40px 0',
            }}
          >
            이력을 로드하는 중...
          </p>
        ) : historyList.length === 0 ? (
          <p
            style={{
              color: 'var(--text-dim)',
              textAlign: 'center',
              padding: '40px 0',
            }}
          >
            {activeSubTab === 'algorithm'
              ? '생성된 이력이 없습니다. 예측 번호를 먼저 생성해주세요.'
              : '저장된 개인 예측번호가 없습니다. 예측번호 분석기에서 번호를 저장해주세요.'}
          </p>
        ) : (
          historyList.map((hist) => {
            const hasResult = hist.matchResult !== null;
            const isExpanded = !!expandedItems[hist.id];
            return (
              <div key={hist.id} className="history-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: 'var(--primary-cyan)',
                        fontSize: '0.95rem',
                      }}
                    >
                      {hist.episode}회차 예측
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        marginLeft: '10px',
                      }}
                    >
                      {activeSubTab === 'algorithm'
                        ? `[${parseAlgorithmName(hist.algorithm)}]`
                        : '[개인 지정]'}
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

                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    예측 조합:
                  </div>
                  <LottoBalls
                    numbers={hist.numbers}
                    matchResult={hist.matchResult}
                  />
                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        if (activeSubTab === 'personal') {
                          setSelectedPersonalAnalysis({
                            numbers: hist.numbers,
                            analysis: hist.analysis,
                            episode: hist.episode,
                          });
                        } else {
                          toggleExpand(hist.id);
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-cyan)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '4px 0',
                        fontWeight: 600,
                      }}
                    >
                      {activeSubTab === 'personal'
                        ? '상세 분석 보기 →'
                        : isExpanded
                          ? '상세 분석 접기 ▲'
                          : '상세 분석 보기 ▼'}
                    </button>
                  </div>
                </div>

                {isExpanded &&
                  hist.analysis &&
                  activeSubTab === 'algorithm' && (
                    <LottoAnalysisCard
                      numbers={hist.numbers}
                      analysis={hist.analysis}
                    />
                  )}

                {hasResult && hist.matchResult && (
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      paddingTop: '10px',
                      marginTop: '10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      실제 당첨: (일치 개수:{' '}
                      <span
                        style={{
                          color: 'var(--primary-cyan)',
                          fontWeight: 'bold',
                        }}
                      >
                        {hist.matchResult.matchCount}개
                      </span>
                      {hist.matchResult.bonusMatch ? ' + 보너스 일치' : ''})
                    </div>
                    <LottoBalls numbers={hist.matchResult.winningNumbers} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <HonHistoryModal
        isOpen={showHonHistoryModal}
        onClose={() => setShowHonHistoryModal(false)}
      />

      {selectedPersonalAnalysis &&
        createPortal(
          <div
            className="admin-modal-overlay"
            style={{
              overflowY: 'auto',
              padding: '40px 20px',
              alignItems: 'flex-start',
              zIndex: 1000,
            }}
            onClick={() => setSelectedPersonalAnalysis(null)}
          >
            <div
              style={{
                maxWidth: '680px',
                width: '90%',
                maxHeight: '90vh',
                position: 'relative',
                margin: '0 auto',
                zIndex: 1005,
                paddingTop: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Row: Contains Close Button (Right) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  position: 'relative',
                  marginBottom: '16px',
                  width: '100%',
                }}
              >
                <button
                  onClick={() => setSelectedPersonalAnalysis(null)}
                  style={{
                    position: 'absolute',
                    right: '0px',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.2s ease',
                    zIndex: 110,
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--text-main)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')
                  }
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
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>닫기</span>
                </button>
              </div>

              <PersonalAnalysisCard
                numbers={selectedPersonalAnalysis.numbers}
                analysis={selectedPersonalAnalysis.analysis}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
export default History;
