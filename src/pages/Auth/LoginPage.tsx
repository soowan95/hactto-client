import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import loginPromoImage from '../../assets/login-promo.jpg';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '로그인 실패');
      }

      const resData = await res.json();
      const payload = resData.data || resData;
      login(payload.accessToken, payload.refreshToken, payload.user);

      // Go back to the previous page or home
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/home');
      }
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
        onClick={() => {
          navigate('/home');
        }}
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

      {/* Left side (40%) - Login Form */}
      <div
        style={{
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 10%',
          backgroundColor: 'var(--bg-dark)',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: '#fff',
          }}
        >
          로그인
        </h1>
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
              placeholder="이메일을 입력해주세요"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              비밀번호
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
              placeholder="비밀번호를 입력해주세요"
            />
          </div>

          <div style={{ minHeight: '24px', marginBottom: '1.5rem' }}>
            {errorMsg && (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="action-btn"
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
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/signup')}
          >
            회원가입
          </button>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/reset-password-request')}
          >
            비밀번호 재설정
          </button>
        </div>
      </div>

      {/* Right side (60%) - Promotional Image */}
      <div style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
        <img
          src={loginPromoImage}
          alt="Hactto Promo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {/* Subtle overlay to blend the image nicely with the dark theme */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to right, var(--bg-dark) 0%, transparent 20%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
};
