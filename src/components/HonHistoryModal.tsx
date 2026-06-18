import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../utils';

interface HonEvent {
  id: number;
  visitorId: string;
  type: string;
  amount: number;
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
  const { visitorId, showAlert } = useApp();
  const [events, setEvents] = useState<HonEvent[]>([]);
  const [loading, setLoading] = useState(false);

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
          ) : events.length === 0 ? (
            <div
              style={{
                color: 'var(--text-dim)',
                textAlign: 'center',
                padding: '60px 0',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📜</div>
              HON 사용 내역이 존재하지 않습니다.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {events.map((evt) => {
                const isDeduct = evt.amount < 0;
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
                        style={{ color: 'var(--text-main)', fontWeight: '600' }}
                      >
                        {evt.description || (isDeduct ? '혼 사용' : '혼 충전')}
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
                          color: isDeduct ? '#ff4b4b' : 'var(--primary-cyan)',
                        }}
                      >
                        {isDeduct ? '' : '+'}
                        {evt.amount} HON
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
