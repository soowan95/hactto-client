import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg('유효하지 않은 접근입니다.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    // Client-side regex validation for better UX
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg(
        '비밀번호는 영문 대소문자, 숫자, 특수기호를 모두 포함하여 10자리 이상이어야 합니다.',
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '비밀번호 재설정에 실패했습니다.');
      }

      navigate('/login');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-dark)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ color: 'var(--error)', fontSize: '1.2rem' }}>
          {errorMsg}
        </div>
      </div>
    );
  }

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
            새로운 비밀번호를 입력해주세요.
            <br />
            (영문 대소문자, 숫자, 특수기호 포함 10자리 이상)
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
                새 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                placeholder="새 비밀번호를 입력해주세요"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
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
                placeholder="비밀번호를 한번 더 입력해주세요"
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
              {loading ? '변경 중...' : '비밀번호 변경하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
