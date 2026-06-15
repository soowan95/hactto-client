import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../utils';
import { Alert } from '../components/Alert';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  createdAt: string;
  answeredAt: string | null;
}

export function BlockedPage() {
  const { clientIp, visitorId, alert, showAlert } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // viewMode: 'form' (write appeal) | 'list' (view past inquiries/replies) | 'success' (submitted screen)
  const [viewMode, setViewMode] = useState<'form' | 'list' | 'success'>('form');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE_URL}/manager/inquiries?forBlock=true`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setInquiries(list);
        return list;
      }
    } catch (err) {
      console.error('문의 내역 조회 실패:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
    return [];
  }, []);

  // Fetch inquiries on mount to determine initial view mode
  useEffect(() => {
    const init = async () => {
      const list = await fetchInquiries();
      if (list && list.length > 0) {
        setViewMode('list');
      }
    };
    init();
  }, [fetchInquiries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showAlert('error', '제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/manager/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, isForBlock: true }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        showAlert('success', '문의가 성공적으로 접수되었습니다.');
        await fetchInquiries(true);
        setViewMode('success');
      } else {
        const data = await res.json();
        throw new Error(data.message || '문의 등록에 실패했습니다.');
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      showAlert('error', error.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="access-container"
      style={{
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        margin: '60px auto',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-purple" style={{ left: '40%', top: '30%' }}></div>
        <div className="orb orb-cyan" style={{ right: '40%', bottom: '30%' }}></div>
      </div>

      <div
        className="glass-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '36px 24px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 75, 75, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(255, 75, 75, 0.05)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background:
              'radial-gradient(circle, rgba(255, 75, 75, 0.05) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Warning Icon */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 75, 75, 0.1)',
              border: '2px solid #ff4b4b',
              color: '#ff4b4b',
              margin: '0 auto 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="28"
              height="28"
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
            style={{ fontSize: '1.8rem', display: 'block', color: '#ff4b4b' }}
          >
            접근 제한 안내
          </span>

          <h1
            className="access-title"
            style={{
              marginTop: '10px',
              color: 'var(--text-main)',
              fontSize: '1.3rem',
              fontWeight: 'bold',
            }}
          >
            서비스 이용이 제한되었습니다
          </h1>

          <p
            className="access-desc"
            style={{
              maxWidth: '460px',
              margin: '14px auto 20px',
              lineHeight: '1.55',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            운영 정책 위반 또는 이상 활동 감지로 인해 현재 IP 및 기기의 접속이 차단되었습니다.
            문의나 해명이 필요한 경우, 소명 내용을 작성하여 관리자에게 전달하실 수 있습니다.
          </p>

          {/* User Details Box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '24px',
              textAlign: 'left',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-dim)' }}>접속 IP</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{clientIp || '확인 불가'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>방문자 ID</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{visitorId || '확인 불가'}</span>
            </div>
          </div>

          {/* Subtitle / Mode Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              {viewMode === 'form' && '소명서 및 문의 작성'}
              {viewMode === 'list' && '문의 내역 및 답변 확인'}
              {viewMode === 'success' && '접수 완료'}
            </span>
            
            {/* Action buttons to switch view modes */}
            {inquiries.length > 0 && viewMode !== 'success' && (
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'form' ? 'list' : 'form')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-cyan)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  padding: '2px 6px',
                }}
              >
                {viewMode === 'form' ? '답변 보기' : '재문의하기'}
              </button>
            )}
          </div>

          {/* Content Areas based on Mode */}
          {viewMode === 'success' && (
            <div
              style={{
                background: 'rgba(0, 240, 255, 0.02)',
                border: '1px solid rgba(0, 240, 255, 0.1)',
                padding: '24px 16px',
                borderRadius: '10px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>✔️</span>
                <h4 style={{ color: 'var(--primary-cyan)', margin: '0 0 6px 0', fontSize: '0.92rem' }}>
                  소명서 제출 완료
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                  작성하신 내용이 관리자에게 안전하게 전달되었습니다.
                  <br />
                  답변이 등록되면 아래 버튼을 통해 바로 확인하실 수 있습니다.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    await fetchInquiries();
                    setViewMode('list');
                  }}
                  style={{
                    flex: 1,
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-main)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  답변 보기
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  style={{
                    flex: 1,
                    height: '36px',
                    background: 'linear-gradient(135deg, #ff4b4b 0%, var(--primary-purple) 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  재문의
                </button>
              </div>
            </div>
          )}

          {viewMode === 'form' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>제목</label>
                <input
                  type="text"
                  className="input-glow"
                  placeholder="예: 접속 제한 관련 확인 요청 드립니다."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  style={{ fontSize: '0.82rem', height: '36px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>내용</label>
                <textarea
                  className="input-glow"
                  placeholder="차단 사유에 대한 상세 소명이나 문의하고 싶으신 내용을 상세히 적어주세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={1000}
                  style={{
                    minHeight: '120px',
                    fontSize: '0.82rem',
                    resize: 'none',
                    padding: '10px',
                    lineHeight: '1.5',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn-submit"
                disabled={submitting}
                style={{
                  height: '38px',
                  background: 'linear-gradient(135deg, #ff4b4b 0%, var(--primary-purple) 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  border: 'none',
                  fontSize: '0.82rem',
                  marginTop: '4px',
                  cursor: 'pointer',
                }}
              >
                {submitting ? '전송 중...' : '소명서 제출하기'}
              </button>
            </form>
          )}

          {viewMode === 'list' && (
            <div style={{ textAlign: 'left' }}>
              {loadingList ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                  불러오는 중...
                </p>
              ) : inquiries.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                    제출된 문의 사항이 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode('form')}
                    style={{
                      marginTop: '12px',
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    문의 작성하러 가기
                  </button>
                </div>
              ) : (
                <div
                  className="scroll-y-container"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '2px',
                  }}
                >
                  {inquiries.map((inq) => {
                    const isExpanded = expandedId === inq.id;
                    return (
                      <div
                        key={inq.id}
                        style={{
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          background: 'rgba(255, 255, 255, 0.01)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          onClick={() => toggleExpand(inq.id)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px',
                            background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          }}
                        >
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                              {inq.title}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {new Date(inq.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: inq.status === 'ANSWERED' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                              color: inq.status === 'ANSWERED' ? 'var(--primary-cyan)' : 'var(--text-dim)',
                              border: inq.status === 'ANSWERED' ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                              flexShrink: 0,
                            }}
                          >
                            {inq.status === 'ANSWERED' ? '답변 완료' : '답변 대기'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div
                            style={{
                              padding: '12px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                              background: 'rgba(0, 0, 0, 0.1)',
                              fontSize: '0.78rem',
                              lineHeight: '1.5',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap', marginBottom: inq.answer ? '10px' : 0 }}>
                              {inq.content}
                            </div>

                            {inq.answer && (
                              <div
                                style={{
                                  padding: '10px',
                                  background: 'rgba(157, 0, 255, 0.04)',
                                  borderLeft: '2px solid var(--primary-purple)',
                                  borderRadius: '4px',
                                  marginTop: '6px',
                                }}
                              >
                                <span style={{ color: 'var(--primary-purple)', fontWeight: 'bold', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                  관리자 답변
                                </span>
                                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                                  {inq.answer}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global alert inside BlockedPage context */}
      <Alert alert={alert} />
    </div>
  );
}
export default BlockedPage;
