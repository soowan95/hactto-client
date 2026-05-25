import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/hactto/v1';

const maskKey = (key: string | null): string => {
  if (!key) return '';
  if (key.length <= 3) return '*'.repeat(key.length);
  return key.slice(0, 3) + '*'.repeat(key.length - 3);
};

interface AlertState {
  type: 'success' | 'error';
  text: string;
}

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [clientIp, setClientIp] = useState<string>('');
  
  // Admin states
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [pendingIps, setPendingIps] = useState<string[]>([]);
  const [allowedIps, setAllowedIps] = useState<string[]>([]);
  const [masterKeys, setMasterKeys] = useState<string[]>([]);
  const [adminTab, setAdminTab] = useState<'pending' | 'allowed' | 'masterKeys'>('pending');
  const [manualIp, setManualIp] = useState<string>('');
  const [manualMk, setManualMk] = useState<string>('');

  // Master Key (allowed:mks bypass) states
  const [showMasterKey, setShowMasterKey] = useState<boolean>(false);
  const [masterKey, setMasterKey] = useState<string>('');

  // General UI states
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');

  // Show auto-dismiss alerts
  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(prev => (prev?.text === text ? null : prev));
    }, 6000);
  };

  // Fetch initial IP status / verify saved master key
  const checkIpStatus = async () => {
    try {
      setLoading(true);
      const savedUserMk = localStorage.getItem('user_mk');
      
      // If a Master Key is saved locally, prioritize verifying it first
      if (savedUserMk) {
        const adminRes = await fetch(`${API_BASE_URL}/check-ip?mk=${encodeURIComponent(savedUserMk)}`);
        const adminData = await adminRes.json();
        const adminResult = adminData.data || adminData;

        if (adminRes.ok && adminResult.allowed) {
          // Master Key is valid! Grant access and fetch IP for display
          setAllowed(true);
          setPending(false);
          setClientIp(adminResult.ip || 'unknown');
          setLoading(false);
          return;
        } else {
          // Saved key is invalid or revoked, clear it
          localStorage.removeItem('user_mk');
        }
      }

      // Default IP check
      const res = await fetch(`${API_BASE_URL}/check-ip`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('IP 상태를 조회하는 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      const result = data.data || data;

      setAllowed(!!result.allowed);
      setPending(!!result.pending);
      setClientIp(result.ip || 'unknown');
    } catch (err: any) {
      console.error(err);
      setAllowed(false);
      setPending(false);
      setClientIp('알 수 없음');
      showAlert('error', err.message || '서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Global hotkey listener for Admin Auth modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      // Trigger on Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
      if (isModifier && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        // Read key from session storage if already authenticated
        const savedKey = sessionStorage.getItem('rmk');
        if (savedKey && !isAdminMode) {
          loadAdminData(savedKey);
        } else {
          setShowAdminModal(prev => {
            const next = !prev;
            if (next) {
              setAdminError('');
            }
            return next;
          });
          setAlert(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Initial load
    checkIpStatus();
    
    // Check if admin session already exists
    const savedKey = sessionStorage.getItem('rmk');
    if (savedKey) {
      setIsAdminMode(true);
      loadAdminData(savedKey);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMode]);

  // Load administrative data from Redis
  const loadAdminData = async (key: string) => {
    try {
      setLoading(true);
      
      // 1. Fetch pending IPs
      const pendingRes = await fetch(`${API_BASE_URL}/admin/whitelist/pending?rmk=${encodeURIComponent(key)}`);
      if (!pendingRes.ok) throw new Error('승인 대기열 로드 실패');
      const pendingData = await pendingRes.json();

      // 2. Fetch whitelisted IPs
      const allowedRes = await fetch(`${API_BASE_URL}/admin/whitelist/read?t=ip&rmk=${encodeURIComponent(key)}`);
      if (!allowedRes.ok) throw new Error('화이트리스트 로드 실패');
      const allowedData = await allowedRes.json();

      // 3. Fetch Master Keys (allowed:mks)
      const mksRes = await fetch(`${API_BASE_URL}/admin/whitelist/read?t=mk&rmk=${encodeURIComponent(key)}`);
      if (!mksRes.ok) throw new Error('Master key 목록 로드 실패');
      const mksData = await mksRes.json();

      setPendingIps(pendingData.data || pendingData || []);
      setAllowedIps(allowedData.data || allowedData || []);
      setMasterKeys(mksData.data || mksData || []);
      
      sessionStorage.setItem('rmk', key);
      setIsAdminMode(true);
      setShowAdminModal(false);
      setAdminError('');
    } catch (err: any) {
      console.error(err);
      const errMsg = '관리자 키 인증 실패 또는 데이터를 불러오지 못했습니다.';
      if (showAdminModal) {
        setAdminError(errMsg);
      } else {
        showAlert('error', errMsg);
      }
      sessionStorage.removeItem('rmk');
      setIsAdminMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Submit Admin Key Modal
  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!adminKey.trim()) {
      setAdminError('관리자 키를 입력하세요.');
      return;
    }
    loadAdminData(adminKey);
  };

  // Register/Verify Master Key (allowed:mks query parameter bypass)
  const handleMasterKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey.trim()) {
      showAlert('error', 'Master key를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setAlert(null);
      
      // Verify key by checking with check-ip?mk=key
      const res = await fetch(`${API_BASE_URL}/check-ip?mk=${encodeURIComponent(masterKey)}`);
      const data = await res.json();
      const result = data.data || data;

      if (!res.ok || !result.allowed) {
        throw new Error('올바르지 않은 Master key이거나 인증에 실패했습니다.');
      }

      // Success! Store key in localStorage to automatically attach as query param in future API calls
      localStorage.setItem('user_mk', masterKey);
      showAlert('success', 'Master key 인증 성공! 플랫폼 접근 권한이 부여되었습니다.');
      setShowMasterKey(false);
      setMasterKey('');
      
      // Reload states
      checkIpStatus();
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || 'Master key 검증 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Request Access (Sends to pending queue)
  const handleRequestAccess = async () => {
    try {
      setSubmitting(true);
      setAlert(null);
      const res = await fetch(`${API_BASE_URL}/request-access`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '접근 승인 대기열 등록에 실패했습니다.');
      }

      showAlert('success', '관리자 승인 대기열에 성공적으로 등록되었습니다. 승인을 기다려주세요.');
      setTimeout(() => {
        checkIpStatus();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Approve Pending IP
  const handleApproveIp = async (ip: string) => {
    const key = sessionStorage.getItem('rmk');
    if (!key) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/approve?rmk=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });

      if (!res.ok) throw new Error('IP 승인 실패');
      showAlert('success', `${ip} 접근 승인 완료`);
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'IP 승인 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reject/Remove Pending IP
  const handleRejectIp = async (ip: string) => {
    const key = sessionStorage.getItem('rmk');
    if (!key) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/reject?rmk=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });

      if (!res.ok) throw new Error('요청 반려 실패');
      showAlert('success', `${ip} 요청 반려 완료`);
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', '요청 반려 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove/Block Allowed IP
  const handleBlockIp = async (ip: string) => {
    const key = sessionStorage.getItem('rmk');
    if (!key) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/ip/${ip}?rmk=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('IP 제거 실패');
      showAlert('success', `${ip} 접근 권한 제거 완료`);
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'IP 제거 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manually Add IP from Admin Dashboard
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = sessionStorage.getItem('rmk');
    if (!key) return;
    if (!manualIp.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/ip?rmk=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: manualIp }),
      });

      if (!res.ok) throw new Error('수동 등록 실패');
      showAlert('success', `${manualIp} 수동 등록 완료`);
      setManualIp('');
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'IP 수동 등록 중 문제가 발생했습니다. 올바른 IP 포맷인지 확인하세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manually Add Master Key from Admin Dashboard
  const handleManualAddMkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = sessionStorage.getItem('rmk');
    if (!key) return;
    if (!manualMk.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/mk?rmk=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mk: manualMk }),
      });

      if (!res.ok) throw new Error('Master key 등록 실패');
      showAlert('success', '새로운 Master key가 등록되었습니다.');
      setManualMk('');
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Master key 수동 등록 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove Master Key
  const handleRemoveMk = async (mk: string) => {
    const key = sessionStorage.getItem('rmk');
    if (!key) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/whitelist/mk/${encodeURIComponent(mk)}?rmk=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Master key 제거 실패');
      showAlert('success', 'Master key가 제거되었습니다.');
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Master key 제거 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Logout from Admin Dashboard
  const handleAdminLogout = () => {
    sessionStorage.removeItem('rmk');
    setIsAdminMode(false);
    setAdminKey('');
    checkIpStatus();
  };

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
      </div>

      <div className="access-container" style={isAdminMode ? { maxWidth: '800px' } : undefined}>
        
        {/* Loading Spinner */}
        {loading && !isAdminMode ? (
          <div className="glass-card" style={{ padding: '60px 40px' }}>
            <div className="logo-container">
              <span className="logo-glow">hactto</span>
            </div>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>네트워크 상태 조회 중...</p>
          </div>
        ) : isAdminMode ? (
          /* =========================================================================
             ADMIN DASHBOARD VIEW
             ========================================================================= */
          <div className="glass-card allowed-dashboard" style={{ textAlign: 'left' }}>
            <div className="admin-header">
              <div>
                <span className="logo-glow" style={{ fontSize: '1.8rem' }}>hactto admin</span>
                <h1 className="access-title" style={{ fontSize: '1.2rem', marginTop: '4px', color: 'var(--primary-cyan)' }}>
                  시스템 접근 권한 총괄 대시보드
                </h1>
              </div>
              <button className="btn-neon btn-outline" onClick={handleAdminLogout} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}>
                어드민 로그아웃
              </button>
            </div>

            {/* Manual Form (Conditional) */}
            {adminTab === 'allowed' && (
              <form onSubmit={handleManualAddSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>신규 IP 수동 화이트리스트 등록</label>
                  <input 
                    type="text" 
                    className="input-glow" 
                    placeholder="예: 192.168.0.1" 
                    value={manualIp} 
                    onChange={(e) => setManualIp(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <button className="btn-submit" type="submit" style={{ height: '42px', padding: '0 20px' }} disabled={submitting}>
                  추가
                </button>
              </form>
            )}

            {adminTab === 'masterKeys' && (
              <form onSubmit={handleManualAddMkSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>신규 Master key 수동 등록</label>
                  <input 
                    type="text" 
                    className="input-glow" 
                    placeholder="등록할 Master key 입력" 
                    value={manualMk} 
                    onChange={(e) => setManualMk(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <button className="btn-submit" type="submit" style={{ height: '42px', padding: '0 20px' }} disabled={submitting}>
                  추가
                </button>
              </form>
            )}

            {/* Tab Controllers */}
            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <button 
                className={`tab-btn ${adminTab === 'pending' ? 'active-tab' : ''}`} 
                onClick={() => setAdminTab('pending')}
              >
                승인 대기 요청 ({pendingIps.length})
              </button>
              <button 
                className={`tab-btn ${adminTab === 'allowed' ? 'active-tab' : ''}`} 
                onClick={() => setAdminTab('allowed')}
              >
                허용된 IP 목록 ({allowedIps.length})
              </button>
              <button 
                className={`tab-btn ${adminTab === 'masterKeys' ? 'active-tab' : ''}`} 
                onClick={() => setAdminTab('masterKeys')}
              >
                Master key 관리 ({masterKeys.length})
              </button>
            </div>

            {/* List Tables */}
            <div className="ip-list-container" style={{ minHeight: '200px', maxHeight: '350px', overflowY: 'auto' }}>
              {adminTab === 'pending' ? (
                pendingIps.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>대기 중인 접근 요청이 없습니다.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>요청 클라이언트 IP</th>
                        <th style={{ textAlign: 'right' }}>관리 조치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingIps.map(ip => (
                        <tr key={ip}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.95rem' }}>{ip}</td>
                          <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn-action-success" onClick={() => handleApproveIp(ip)} disabled={submitting}>승인</button>
                            <button className="btn-action-error" onClick={() => handleRejectIp(ip)} disabled={submitting}>반려</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : adminTab === 'allowed' ? (
                allowedIps.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>허용된 IP가 없습니다.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>화이트리스트 등록 IP</th>
                        <th style={{ textAlign: 'right' }}>관리 조치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowedIps.map(ip => (
                        <tr key={ip}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--primary-cyan)', fontSize: '0.95rem' }}>{ip}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-action-error" onClick={() => handleBlockIp(ip)} disabled={submitting}>접근 차단</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                masterKeys.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>등록된 Master key가 없습니다.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Master key 값 (Allowed Master Keys)</th>
                        <th style={{ textAlign: 'right' }}>관리 조치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterKeys.map(mk => (
                        <tr key={mk}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--primary-purple)', fontSize: '0.95rem' }}>{mk}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-action-error" onClick={() => handleRemoveMk(mk)} disabled={submitting}>키 제거</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>

            {alert && (
              <div className={`alert alert-${alert.type}`} style={{ marginTop: '20px' }}>
                <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
                <div>{alert.text}</div>
              </div>
            )}
          </div>
        ) : allowed === true ? (
          /* =========================================================================
             ALLOWED SCREEN VIEW
             ========================================================================= */
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
              {localStorage.getItem('user_mk') ? (
                <>
                  <p className="access-desc" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
                    유효한 Master key 인증을 통해 hactto의 핵심 분석 도구와 대시보드에 접근하실 수 있습니다.
                  </p>
                  <div className="ip-info" style={{ marginBottom: '0' }}>
                    <span>인증된 Master key:</span>
                    <span className="ip-value" style={{ color: 'var(--primary-purple)' }}>{maskKey(localStorage.getItem('user_mk'))}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="access-desc" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
                    귀하의 IP가 안전한 화이트리스트에 등록되어 hactto의 핵심 분석 도구와 대시보드에 접근하실 수 있습니다.
                  </p>
                  <div className="ip-info" style={{ marginBottom: '0' }}>
                    <span>인증된 클라이언트 IP:</span>
                    <span className="ip-value">{clientIp}</span>
                  </div>
                </>
              )}
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

            <button className="btn-neon btn-cyan" onClick={() => {
              const mk = localStorage.getItem('user_mk');
              showAlert('success', `대시보드 페이지 개발 진행 중입니다. (인증 Master key: ${maskKey(mk) || '없음 - IP 화이트리스트 통과'})`);
            }}>
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
        ) : pending ? (
          /* =========================================================================
             PENDING SCREEN VIEW
             ========================================================================= */
          <div className="glass-card">
            <div className="status-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            
            <span className="logo-glow" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '12px' }}>hactto</span>
            <h1 className="access-title">접근 승인 대기 중입니다</h1>
            <p className="access-desc">
              귀하의 접근 요청이 관리자 승인 대기열에 등록되었습니다. 관리자가 확인 후 승인하면 자동으로 대시보드로 입장하실 수 있습니다.
            </p>
            
            <div className="ip-info" style={{ marginBottom: '24px' }}>
              <span>대기 등록 IP:</span>
              <span className="ip-value" style={{ color: '#f59e0b' }}>{clientIp}</span>
            </div>

            <button className="btn-neon btn-outline" onClick={checkIpStatus} disabled={loading}>
              {loading ? '새로고침 중...' : '승인 상태 새로고침'}
            </button>

            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
                <div>{alert.text}</div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             DENIED SCREEN VIEW
             ========================================================================= */
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
                {showMasterKey ? 'Master key 입력 취소' : 'Master key 등록'}
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
              <form className="masterkey-form-container" onSubmit={handleMasterKeySubmit} style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'left' }}>
                <label className="form-label" htmlFor="masterKey" style={{ marginBottom: '8px', display: 'block' }}>Master key 입력</label>
                <div className="input-container" style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="masterKey"
                    className="input-glow"
                    type="password"
                    placeholder="Master key를 입력하세요"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    disabled={submitting}
                    autoComplete="current-password"
                    autoFocus
                    style={{ flex: 1 }}
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

      {/* =========================================================================
         ADMIN AUTHENTICATION MODAL (Triggered by Hotkey Cmd+Shift+H / Ctrl+Shift+H)
         ========================================================================= */}
      {showAdminModal && (
        <div className="admin-modal-overlay">
          <div className="glass-card admin-modal-content">
            <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '8px' }}>관리자 키 인증</h2>
            <p className="access-desc" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              이 화면은 인가된 관리자만 접근 가능합니다. 관리자 키를 입력하여 주십시오.
            </p>
            
            {adminError && (
              <div className="alert alert-error" style={{ fontSize: '0.85rem', padding: '8px 12px', marginTop: '0', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>⚠</span>
                <div>{adminError}</div>
              </div>
            )}
            
            <form onSubmit={handleAdminAuthSubmit}>
              <input
                type="password"
                className="input-glow"
                style={{ width: '100%', marginBottom: '16px' }}
                placeholder="Redis Manager Key 입력"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, height: '42px' }}>
                  인증하기
                </button>
                <button type="button" className="btn-neon btn-outline" style={{ flex: 1, padding: 0, height: '42px' }} onClick={() => { setShowAdminModal(false); setAdminError(''); }}>
                  닫기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
