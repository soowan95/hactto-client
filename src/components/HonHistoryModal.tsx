import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../utils';

interface HonEvent {
  id: number;
  visitorId: string;
  type: string;
  amount: number;
  freeAmount: number;
  paidAmount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

interface HonHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HonHistoryModal: React.FC<HonHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { visitorId, showAlert, freeHon, paidHon } = useApp();
  const [events, setEvents] = useState<HonEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const vid = visitorId || localStorage.getItem('visitor_id') || '';
        const res = await fetch(`${API_BASE_URL}/visitor/hon-events`, {
          headers: {
            ...(vid ? { 'x-visitor-id': vid } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.data) ? data.data : [];
          setEvents(list);
        } else {
          showAlert('error', 'HON 사용내역을 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error(err);
        showAlert('error', 'HON 사용내역을 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isOpen, visitorId, showAlert]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '80vh',
          background: 'rgba(15, 17, 26, 0.95)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(0, 240, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect inside modal */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-40%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(0, 240, 255, 0.08)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🪙 HON 사용 내역
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Current Balance Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(0, 240, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.1)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}
              >
                이벤트 HON
              </span>
              <span
                style={{
                  color: 'var(--primary-cyan)',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                {freeHon}
              </span>
            </div>
            <div
              style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }}
            />
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}
              >
                충전 HON
              </span>
              <span
                style={{
                  color: '#ffb86c',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                {paidHon}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'flex-end',
            }}
          >
            <span
              style={{
                color: 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: '500',
              }}
            >
              총 잔액
            </span>
            <span
              style={{
                color: 'var(--text-main)',
                fontSize: '1.3rem',
                fontWeight: 'bold',
              }}
            >
              {freeHon + paidHon}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '8px',
          }}
        >
          {[
            { id: 'ALL', label: '전체' },
            { id: 'FREE', label: '이벤트 HON' },
            { id: 'PAID', label: '충전 HON' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'ALL' | 'FREE' | 'PAID')}
              style={{
                background:
                  activeTab === tab.id
                    ? 'rgba(0, 240, 255, 0.1)'
                    : 'transparent',
                color:
                  activeTab === tab.id
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(0, 240, 255, 0.3)' : 'transparent'}`,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div
          className="scroll-y-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '200px',
            maxHeight: '400px',
            paddingRight: '4px',
          }}
        >
          {loading ? (
            <p
              style={{
                color: 'var(--text-dim)',
                textAlign: 'center',
                padding: '40px 0',
                fontSize: '0.88rem',
              }}
            >
              내역을 가져오는 중...
            </p>
          ) : (
            (() => {
              const getEffectiveAmounts = (evt: HonEvent) => {
                if (
                  evt.freeAmount === 0 &&
                  evt.paidAmount === 0 &&
                  evt.amount !== 0
                ) {
                  if (evt.type === 'CHARGE') {
                    const desc = evt.description || '';
                    if (
                      desc.includes('첫 방문') ||
                      desc.includes('무료') ||
                      desc.includes('이벤트') ||
                      desc.includes('보상')
                    ) {
                      return { fAmt: evt.amount, pAmt: 0 };
                    }
                    return { fAmt: 0, pAmt: evt.amount };
                  }
                  if (evt.type === 'ADMIN_PROVISION')
                    return { fAmt: evt.amount, pAmt: 0 };
                  // For legacy DEDUCT, display in both tabs using the total amount
                  return { fAmt: evt.amount, pAmt: evt.amount };
                }
                return { fAmt: evt.freeAmount, pAmt: evt.paidAmount };
              };

              const filteredEvents = events.filter((evt) => {
                const { fAmt, pAmt } = getEffectiveAmounts(evt);
                if (activeTab === 'ALL') return true;
                if (activeTab === 'FREE') return fAmt !== 0;
                if (activeTab === 'PAID') return pAmt !== 0;
                return true;
              });

              return filteredEvents.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '50px 20px',
                    margin: '10px 0',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at center, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0) 70%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      marginBottom: '16px',
                      boxShadow: '0 0 20px rgba(0, 240, 255, 0.05)',
                      border: '1px solid rgba(0, 240, 255, 0.15)',
                      animation: 'pulse-cyan 2s infinite ease-in-out',
                    }}
                  >
                    📭
                  </div>
                  <span
                    style={{
                      color: 'var(--text-main)',
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      marginBottom: '6px',
                    }}
                  >
                    내역이 없습니다
                  </span>
                  <span
                    style={{
                      color: 'var(--text-dim)',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      maxWidth: '220px',
                      lineHeight: '1.4',
                    }}
                  >
                    해당 탭에 표시할 HON 사용 또는 충전 내역이 존재하지
                    않습니다.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {filteredEvents.map((evt) => {
                    const { fAmt, pAmt } = getEffectiveAmounts(evt);
                    let displayAmount = evt.amount;
                    if (activeTab === 'FREE') displayAmount = fAmt;
                    if (activeTab === 'PAID') displayAmount = pAmt;
                    const isDisplayDeduct = displayAmount < 0;
                    return (
                      <div
                        key={evt.id}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--text-main)',
                              fontWeight: '600',
                            }}
                          >
                            {evt.description ||
                              (isDisplayDeduct ? '혼 사용' : '혼 충전')}
                          </span>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              fontSize: '0.68rem',
                            }}
                          >
                            {new Date(evt.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '3px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 'bold',
                              color: isDisplayDeduct
                                ? '#ff4b4b'
                                : 'var(--primary-cyan)',
                            }}
                          >
                            {isDisplayDeduct ? '' : '+'}
                            {displayAmount} HON
                          </span>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              fontSize: '0.68rem',
                            }}
                          >
                            잔액: {evt.balance} HON
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="btn-glow"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-dim)',
              fontSize: '0.78rem',
              padding: '6px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
