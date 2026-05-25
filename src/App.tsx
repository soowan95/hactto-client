import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/hactto/v1';

interface AlertState {
  type: 'success' | 'error';
  text: string;
}

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [clientIp, setClientIp] = useState<string>('');
  const [showMasterKey, setShowMasterKey] = useState<boolean>(false);
  const [masterKey, setMasterKey] = useState<string>('');
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Check IP permission status on mount
  const checkIpStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/check-ip`, {
        credentials: 'include', // Important to pass cookies
      });

      if (!res.ok) {
        throw new Error('IP 상태를 확인하는 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      // Expecting { data: { allowed: boolean, ip: string } } due to NestJS ResponseTransformInterceptor
      // If it returns standard response, or check wrapped data
      const resultData = data.data || data;
      
      setAllowed(!!resultData.allowed);
      setClientIp(resultData.ip || 'unknown');
    } catch (err: any) {
      console.error(err);
      setAllowed(false);
      setClientIp('알 수 없음');
      showAlert('error', err.message || '서버와의 통신에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIpStatus();
  }, []);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    // Auto-dismiss alert after 6 seconds
    setTimeout(() => {
      setAlert(prev => (prev?.text === text ? null : prev));
    }, 6000);
  };

  // Request Access (For South Korea IP only)
  const handleRequestAccess = async () => {
    try {
      setSubmitting(true);
      setAlert(null);
      const res = await fetch(`${API_BASE_URL}/request-access`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Look for validation/exception message
        const errMsg = data.message || '접근 요청이 거부되었습니다.';
        throw new Error(errMsg);
      }

      showAlert('success', '접근 권한이 성공적으로 부여되었습니다! 잠시 후 승인 상태로 전환됩니다.');
      
      // Re-check IP status after 1.5 seconds
      setTimeout(() => {
        checkIpStatus();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || '대한민국 IP에서만 접근이 가능합니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Register IP using Master Key
  const handleMasterKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey.trim()) {
      showAlert('error', '마스터 키를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setAlert(null);
      
      // POST admin/whitelist/ip?rmk=masterKey with body { ip: clientIp }
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/ip?rmk=${encodeURIComponent(masterKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: clientIp }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.message || '올바르지 않은 마스터 키이거나 등록에 실패했습니다.';
        throw new Error(errMsg);
      }

      showAlert('success', '마스터 키 인증 성공! IP가 화이트리스트에 등록되었습니다.');
      setShowMasterKey(false);
      setMasterKey('');
      
      // Recheck status
      setTimeout(() => {
        checkIpStatus();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || '마스터 키 검증 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
      </div>

      <div className="access-container">
        {loading ? (
          <div className="glass-card" style={{ padding: '60px 40px' }}>
            <div className="logo-container">
              <span className="logo-glow">hactto</span>
            </div>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>보안 네트워크 상태 확인 중...</p>
          </div>
        ) : allowed === true ? (
          /* Allowed State Dashboard View */
          <div className="glass-card allowed-dashboard">
            <div className="status-icon status-allowed">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            
            <div className="allowed-header">
              <span className="logo-glow" style={{ fontSize: '2.5rem' }}>hactto</span>
              <h1 className="access-title" style={{ marginTop: '16px' }}>접근 권한이 확인되었습니다</h1>
              <p className="access-desc" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
                귀하의 IP가 안전한 화이트리스트에 등록되어 hactto의 핵심 분석 도구와 대시보드에 접근하실 수 있습니다.
              </p>
              <div className="ip-info" style={{ marginBottom: '0' }}>
                <span>인증된 클라이언트 IP:</span>
                <span className="ip-value">{clientIp}</span>
              </div>
            </div>

            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-title">로또 번호 분석</div>
                <div className="feature-desc">역대 로또 번호 데이터를 기반으로 한 최적의 번호 생성 알고리즘 엔진입니다.</div>
              </div>
              <div className="feature-item">
                <div className="feature-title">알고리즘 신뢰도</div>
                <div className="feature-desc">추첨 결과 통계 시뮬레이션을 통해 생성된 번호들의 신뢰도 점수를 검증합니다.</div>
              </div>
            </div>

            <button className="btn-neon btn-cyan" onClick={() => showAlert('success', '대시보드 페이지 개발 진행 중입니다.')}>
              서비스 진입하기
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            
            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
                <div>{alert.text}</div>
              </div>
            )}
          </div>
        ) : (
          /* Denied State Access Block View */
          <div className="glass-card">
            <div className="status-icon status-denied">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            
            <span className="logo-glow" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '12px' }}>hactto</span>
            <h1 className="access-title">hactto에 대한 접근 권한이 없습니다.</h1>
            <p className="access-desc">
              이 시스템은 인가된 IP 주소에서만 접근할 수 있는 폐쇄적 분석 플랫폼입니다. 권한을 부여받으려면 아래 수단 중 하나로 요청해 주십시오.
            </p>
            
            <div className="ip-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>접근 IP:</span>
              <span className="ip-value">{clientIp}</span>
            </div>

            <div className="actions-wrapper">
              <button 
                className="btn-neon btn-cyan" 
                onClick={handleRequestAccess}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : '관리자에게 등록 요청'}
                {!submitting && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </button>

              <button 
                className="btn-neon btn-outline" 
                onClick={() => {
                  setShowMasterKey(!showMasterKey);
                  setAlert(null);
                }}
                disabled={submitting}
              >
                {showMasterKey ? '마스터 키 입력 취소' : 'Master Key 등록'}
                {!showMasterKey && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </button>
            </div>

            {/* Master Key Form */}
            {showMasterKey && (
              <form className="masterkey-form-container" onSubmit={handleMasterKeySubmit}>
                <label className="form-label" htmlFor="masterKey">마스터 키 입력</label>
                <div className="input-container">
                  <input
                    id="masterKey"
                    className="input-glow"
                    type="password"
                    placeholder="Master Key를 입력하세요"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    disabled={submitting}
                    autoComplete="current-password"
                  />
                  <button className="btn-submit" type="submit" disabled={submitting}>
                    {submitting ? '검증...' : '인증'}
                  </button>
                </div>
              </form>
            )}

            {/* Response Alerts */}
            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span style={{ fontWeight: 'bold' }}>{alert.type === 'success' ? '✓' : '⚠'}</span>
                <div>{alert.text}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
