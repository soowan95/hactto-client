import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';

export const VerifySignup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('유효하지 않은 접근입니다.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/verify-signup?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('만료되었거나 유효하지 않은 링크입니다.');
        return res.json();
      })
      .then((data) => {
        const verifiedEmail = data.data?.email || data.email;
        if (!verifiedEmail) {
          throw new Error('이메일 정보를 불러올 수 없습니다.');
        }
        setEmail(verifiedEmail);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        '비밀번호는 영문 대소문자, 숫자, 특수기호를 모두 포함하여 10자리 이상이어야 합니다.',
      );
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nickname, password, token }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '회원가입에 실패했습니다.');
      }
      navigate('/login');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
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
        <div style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
          확인 중...
        </div>
      </div>
    );
  }

  if (error && !email) {
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
        <div style={{ color: 'var(--error)', fontSize: '1.2rem' }}>{error}</div>
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
            회원가입 완료
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            인증된 이메일: <strong style={{ color: '#fff' }}>{email}</strong>
          </p>

          <form onSubmit={handleSignup} style={{ width: '100%' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
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
                placeholder="사용하실 닉네임을 입력해주세요"
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
                비밀번호{' '}
                <span style={{ fontSize: '0.75rem' }}>
                  (대소문자/숫자/특수기호 포함 10자리)
                </span>
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
              {error && (
                <div
                  style={{
                    color: 'var(--error)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                opacity: submitLoading ? 0.7 : 1,
                backgroundColor: 'var(--primary-cyan)',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {submitLoading ? '가입 처리 중...' : '가입하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
