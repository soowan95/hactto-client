import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';

export const ResetPasswordRequestPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '이메일 전송에 실패했습니다.');
      }

      setSuccessMsg(
        '비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인해주세요.',
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-dark)',
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'var(--text-main)';
        }}
        title="돌아가기"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>

      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'var(--bg-dark)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            비밀번호 재설정
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            가입하신 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                required
                placeholder="가입된 이메일을 입력해주세요"
              />
            </div>

            <div style={{ minHeight: '24px', marginBottom: '1.5rem' }}>
              {errorMsg && (
                <div
                  style={{
                    color: 'var(--error)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div
                  style={{
                    color: 'var(--primary-cyan)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  {successMsg}
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    메일이 오지 않았다면 스팸함이나 휴지통을 확인해 주세요.
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                opacity: loading ? 0.7 : 1,
                backgroundColor: 'var(--primary-cyan)',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading
                ? '발송 중...'
                : successMsg
                  ? '재발송'
                  : '재설정 링크 보내기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
