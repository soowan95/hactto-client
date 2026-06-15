import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  createdAt: string;
  answeredAt: string | null;
}

export function Support() {
  const { showAlert, visitorId } = useApp();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Accordion expanded state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(`${API_BASE_URL}/manager/inquiries?forBlock=false`, {
        headers: {
          ...(vid ? { 'x-visitor-id': vid } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        // ResponseTransformInterceptor wraps response as { statusCode, data: [...] }
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setInquiries(list);
      }
    } catch (err) {
      console.error('문의 내역을 가져오지 못했습니다:', err);
      showAlert('error', '문의 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showAlert('error', '제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(`${API_BASE_URL}/manager/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(vid ? { 'x-visitor-id': vid } : {}),
        },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        showAlert('success', '문의가 성공적으로 등록되었습니다.');
        setTitle('');
        setContent('');
        fetchInquiries();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 className="section-title" style={{ color: 'var(--primary-cyan)', marginBottom: '8px' }}>
          1:1 관리자 문의하기
        </h3>
        <p className="access-desc" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          서비스 이용 중 불편한 점이나 건의사항을 남겨주시면 관리자가 신속하게 답변해 드립니다.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Inquiry Form */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            overflow: 'hidden',
            height: '380px',
          }}
        >
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px', marginTop: 0 }}>
            새 문의 작성
          </h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'left' }}>제목</label>
              <input
                type="text"
                className="input-glow"
                placeholder="문의 제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'left' }}>내용</label>
              <textarea
                className="input-glow"
                placeholder="문의하실 구체적인 내용을 작성해 주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                style={{
                  flex: 1,
                  fontSize: '0.85rem',
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
                height: '40px',
                background: 'linear-gradient(135deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)',
                color: '#0f111a',
                fontWeight: 'bold',
                border: 'none',
              }}
            >
              {submitting ? '제출 중...' : '문의하기'}
            </button>
          </form>
        </div>

        {/* Inquiry List */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            overflow: 'hidden',
            height: '380px',
          }}
        >
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px', marginTop: 0 }}>
            내 문의 내역
          </h4>

          {loading && inquiries.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              불러오는 중...
            </p>
          ) : inquiries.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>✉</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                등록된 문의 내역이 없습니다.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: '4px',
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
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleExpand(inq.id)}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', overflow: 'hidden' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '220px',
                          }}
                        >
                          {inq.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background:
                            inq.status === 'ANSWERED'
                              ? 'rgba(0, 240, 255, 0.12)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color:
                            inq.status === 'ANSWERED'
                              ? 'var(--primary-cyan)'
                              : 'var(--text-dim)',
                          border:
                            inq.status === 'ANSWERED'
                              ? '1px solid rgba(0, 240, 255, 0.25)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0,
                        }}
                      >
                        {inq.status === 'ANSWERED' ? '답변 완료' : '답변 대기'}
                      </span>
                    </div>

                    {/* Content (Expanded) */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '14px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                          background: 'rgba(0, 0, 0, 0.1)',
                          fontSize: '0.82rem',
                          lineHeight: '1.6',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <div style={{ whiteSpace: 'pre-wrap', marginBottom: inq.answer ? '14px' : 0 }}>
                          {inq.content}
                        </div>

                        {inq.answer && (
                          <div
                            style={{
                              padding: '12px',
                              background: 'rgba(157, 0, 255, 0.05)',
                              borderLeft: '3px solid var(--primary-purple)',
                              borderRadius: '4px',
                              marginTop: '8px',
                            }}
                          >
                            <span
                              style={{
                                color: 'var(--primary-purple)',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                display: 'block',
                                marginBottom: '4px',
                              }}
                            >
                              관리자 답변
                            </span>
                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                              {inq.answer}
                            </div>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-dim)',
                                display: 'block',
                                marginTop: '6px',
                              }}
                            >
                              {inq.answeredAt && new Date(inq.answeredAt).toLocaleString()}
                            </span>
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
      </div>
    </div>
  );
}
export default Support;
