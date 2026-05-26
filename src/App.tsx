import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/hactto/v1';

const ALGORITHM_NAMES: Record<string, string> = {
  MIN_COUNT: '최소 빈도 조합 모델',
  TOTAL_MIN_COUNT: '가중 분산 균형 모델',
};

const parseAlgorithmName = (type: string | null | undefined): string => {
  if (!type) return '';
  return ALGORITHM_NAMES[type] || type;
};

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
  const [adminTab, setAdminTab] = useState<'pending' | 'allowed' | 'masterKeys' | 'system'>('pending');
  const [manualIp, setManualIp] = useState<string>('');
  const [manualMk, setManualMk] = useState<string>('');

  // Master Key (allowed:mks bypass) states
  const [showMasterKey, setShowMasterKey] = useState<boolean>(false);
  const [masterKey, setMasterKey] = useState<string>('');

  // General UI states
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');

  // Main dashboard states
  const [enteredService, setEnteredService] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'stats' | 'generate' | 'history' | 'system'>('home');
  const [latestWinningNumber, setLatestWinningNumber] = useState<{ episode: number, numbers: number[] } | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [algorithmTypes, setAlgorithmTypes] = useState<string[]>([]);
  const [algorithmStats, setAlgorithmStats] = useState<Record<string, number>>({});
  const [searchEpisode, setSearchEpisode] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{ episode: number, numbers: number[] } | null>(null);
  const [searchError, setSearchError] = useState<string>('');
  const [generatingAlgo, setGeneratingAlgo] = useState<string>('MIN_COUNT');
  const [generatedNumbers, setGeneratedNumbers] = useState<number[] | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [allWinningNumbers, setAllWinningNumbers] = useState<any[]>([]);
  const [fetchEpisodeInput, setFetchEpisodeInput] = useState<string>('');
  const [fetchingWinningNumbers, setFetchingWinningNumbers] = useState<boolean>(false);
  const [analyzingReliability, setAnalyzingReliability] = useState<boolean>(false);

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
    
    // Ensure visitor_id exists
    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
      vid = 'vis_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('visitor_id', vid);
    }

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

  // Generate and register Master Key automatically
  const handleGenerateAndAddMk = async () => {
    const key = sessionStorage.getItem('rmk');
    if (!key) return;

    try {
      setSubmitting(true);
      
      // 1. Fetch random key from API
      const gkRes = await fetch(`${API_BASE_URL}/gk`);
      if (!gkRes.ok) throw new Error('Master key 랜덤 생성에 실패했습니다.');
      const gkData = await gkRes.json();
      const newMk = gkData.data || gkData;
      
      if (!newMk) throw new Error('생성된 Master key를 읽을 수 없습니다.');

      // 2. Register key
      const addRes = await fetch(`${API_BASE_URL}/admin/whitelist/mk?rmk=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mk: newMk }),
      });

      if (!addRes.ok) throw new Error('Master key 자동 등록에 실패했습니다.');

      showAlert('success', `랜덤 생성된 Master key(${newMk})가 성공적으로 등록되었습니다.`);
      loadAdminData(key);
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || 'Master key 자동 등록 중 문제가 발생했습니다.');
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

  // Helper to append Master Key if present
  const appendAuth = (url: string) => {
    const mk = localStorage.getItem('user_mk');
    if (!mk) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}mk=${encodeURIComponent(mk)}`;
  };

  const fetchLatestWinningNumber = async () => {
    try {
      setLoading(true);
      const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers/latest`));
      if (!res.ok) throw new Error('최근 당첨번호를 가져오지 못했습니다.');
      const data = await res.json();
      setLatestWinningNumber(data.data || data);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlgorithmTypes = async () => {
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
      if (!res.ok) throw new Error('알고리즘 목록을 가져오지 못했습니다.');
      const data = await res.json();
      const result = data.data || data;
      setAlgorithmTypes(result.types || []);
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const fetchAlgorithmStats = async () => {
    try {
      setLoading(true);
      const typesRes = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
      if (!typesRes.ok) throw new Error('알고리즘 목록 로드 실패');
      const typesData = await typesRes.json();
      const result = typesData.data || typesData;
      const types = result.types || [];
      setAlgorithmTypes(types);

      const stats: Record<string, number> = {};
      for (const type of types) {
        const statsRes = await fetch(appendAuth(`${API_BASE_URL}/reliability/average?algorithm=${type}`));
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          const statsResult = statsData.data || statsData;
          stats[type] = statsResult.average || 0;
        }
      }
      setAlgorithmStats(stats);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryList = async () => {
    try {
      setLoading(true);
      const vid = localStorage.getItem('visitor_id');
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms/history?visitorId=${vid}`));
      if (!res.ok) throw new Error('당첨 이력을 가져오지 못했습니다.');
      const data = await res.json();
      setHistoryList(data.data || data || []);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWinningNumbers = async () => {
    try {
      setLoading(true);
      const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers`));
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data || [];
        result.sort((a: any, b: any) => b.episode - a.episode);
        const drawnResults = result.filter((wn: any) => wn.isDrawn === true);
        setAllWinningNumbers(drawnResults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    if (!searchEpisode.trim() || isNaN(Number(searchEpisode))) {
      setSearchError('올바른 회차 번호를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers/${searchEpisode}`));
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`${searchEpisode}회차 당첨번호가 존재하지 않습니다.`);
        }
        throw new Error('회차 번호 검색 중 오류가 발생했습니다.');
      }
      const data = await res.json();
      const result = data.data || data;
      if (!result || !result.isDrawn) {
        throw new Error(`${searchEpisode}회차는 아직 추첨이 진행되지 않았습니다.`);
      }
      setSearchResult(result);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePrediction = async () => {
    setGenerating(true);
    setGeneratedNumbers(null);
    try {
      const vid = localStorage.getItem('visitor_id');
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms/${generatingAlgo}/generate?visitorId=${vid}`), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('예측 번호 생성에 실패했습니다.');
      const data = await res.json();
      const result = data.data || data;
      setGeneratedNumbers(result.numbers);
      showAlert('success', '새로운 당첨 예측 번호가 생성되었습니다.');
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAdminFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchEpisodeInput.trim() || isNaN(Number(fetchEpisodeInput))) {
      showAlert('error', '올바른 회차 번호를 입력해주세요.');
      return;
    }

    const key = sessionStorage.getItem('rmk') || localStorage.getItem('user_mk');
    if (!key) return;

    try {
      setFetchingWinningNumbers(true);
      const res = await fetch(`${API_BASE_URL}/winning-numbers/fetch?latestEpisode=${fetchEpisodeInput}&mk=${encodeURIComponent(key)}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('당첨번호 동기화에 실패했습니다.');
      showAlert('success', `${fetchEpisodeInput}회차까지의 당첨번호가 성공적으로 동기화되었습니다.`);
      setFetchEpisodeInput('');
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || '동기화 중 오류가 발생했습니다.');
    } finally {
      setFetchingWinningNumbers(false);
    }
  };

  const handleAdminAnalyze = async () => {
    const key = sessionStorage.getItem('rmk') || localStorage.getItem('user_mk');
    if (!key) return;

    try {
      setAnalyzingReliability(true);
      const res = await fetch(`${API_BASE_URL}/reliability/analyze?mk=${encodeURIComponent(key)}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('알고리즘 신뢰도 배치 분석에 실패했습니다.');
      showAlert('success', '알고리즘 신뢰도 배치 분석이 성공적으로 실행되었습니다.');
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || '분석 실행 중 오류가 발생했습니다.');
    } finally {
      setAnalyzingReliability(false);
    }
  };

  // Tab change trigger loading
  useEffect(() => {
    if (allowed && enteredService) {
      if (activeTab === 'home') {
        fetchLatestWinningNumber();
      } else if (activeTab === 'search') {
        fetchAllWinningNumbers();
      } else if (activeTab === 'stats') {
        fetchAlgorithmStats();
      } else if (activeTab === 'history') {
        fetchHistoryList();
      } else if (activeTab === 'generate') {
        fetchAlgorithmTypes();
      }
    }
  }, [allowed, enteredService, activeTab]);

  const getBallStyle = (num: number) => {
    if (num <= 0) return { background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', border: '1px dashed rgba(255,255,255,0.1)' };
    if (num <= 10) return { background: 'linear-gradient(135deg, #fbc02d 0%, #f57f17 100%)', color: '#000000', boxShadow: '0 0 10px rgba(245, 127, 23, 0.3)' };
    if (num <= 20) return { background: 'linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)', color: '#ffffff', boxShadow: '0 0 10px rgba(2, 136, 209, 0.3)' };
    if (num <= 30) return { background: 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)', color: '#ffffff', boxShadow: '0 0 10px rgba(211, 47, 47, 0.3)' };
    if (num <= 40) return { background: 'linear-gradient(135deg, #bdbdbd 0%, #616161 100%)', color: '#ffffff', boxShadow: '0 0 10px rgba(97, 97, 97, 0.3)' };
    return { background: 'linear-gradient(135deg, #66bb6a 0%, #388e3c 100%)', color: '#ffffff', boxShadow: '0 0 10px rgba(56, 142, 60, 0.3)' };
  };

  const renderLottoBalls = (numbers: number[], matchResult?: any) => {
    if (!numbers || numbers.length !== 7) return null;
    const mainNumbers = numbers.slice(0, 6);
    const bonusNumber = numbers[6];

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {mainNumbers.map((num, i) => {
          const isMatched = matchResult?.matchedNumbers.includes(num);
          const opacity = matchResult ? (isMatched ? 1 : 0.35) : 1;
          const border = isMatched ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.15)';
          const scale = isMatched ? '1.1' : '1';
          return (
            <div key={i} className="lotto-ball" style={{ ...getBallStyle(num), opacity, border, transform: `scale(${scale})` }}>
              {num}
            </div>
          );
        })}
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)', margin: '0 4px' }}>+</div>
        <div className="lotto-ball" style={getBallStyle(bonusNumber)}>
          {bonusNumber}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
      </div>

      <div className="access-container" style={isAdminMode ? { maxWidth: '800px' } : (allowed && enteredService) ? { maxWidth: '1000px', width: '100%' } : undefined}>
        
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
              <div style={{ marginBottom: '24px' }}>
                <form onSubmit={handleManualAddMkSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: 'var(--border-glass)' }}>
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
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn-neon btn-outline" 
                    onClick={handleGenerateAndAddMk} 
                    disabled={submitting}
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    {submitting ? '생성 및 등록 중...' : '랜덤 생성 및 등록'}
                  </button>
                </div>
              </div>
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
              <button 
                className={`tab-btn ${adminTab === 'system' ? 'active-tab' : ''}`} 
                onClick={() => setAdminTab('system')}
              >
                시스템 데이터 관리
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
              ) : adminTab === 'masterKeys' ? (
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
              ) : adminTab === 'system' ? (
                <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-cyan)', marginBottom: '8px' }}>당첨번호 동기화 (Fetch)</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      동행복권 서버로부터 최신 당첨 번호 데이터를 긁어와 동기화합니다.
                    </p>
                    <form onSubmit={handleAdminFetch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="input-glow" 
                        placeholder="동기화할 최신 회차 번호 입력 (예: 1220)" 
                        value={fetchEpisodeInput} 
                        onChange={(e) => setFetchEpisodeInput(e.target.value)}
                        disabled={submitting}
                        style={{ flex: 1 }}
                      />
                      <button className="btn-submit" type="submit" disabled={submitting} style={{ height: '42px', whiteSpace: 'nowrap' }}>
                        동기화 실행
                      </button>
                    </form>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-purple)', marginBottom: '8px' }}>알고리즘 신뢰도 분석 (Analyze)</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      예측 알고리즘 모델의 평균 신뢰도 통계를 다시 산출하는 배치 프로세스를 실행합니다.
                    </p>
                    <button 
                      className="btn-submit" 
                      onClick={handleAdminAnalyze} 
                      disabled={submitting}
                      style={{ height: '42px', width: 'auto', padding: '0 24px' }}
                    >
                      {submitting ? '분석 중...' : '신뢰도 분석 실행'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {alert && (
              <div className={`alert alert-${alert.type}`} style={{ marginTop: '20px' }}>
                <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
                <div>{alert.text}</div>
              </div>
            )}
          </div>
        ) : allowed === true ? (
          enteredService ? (
            /* =========================================================================
               MAIN DASHBOARD VIEW
               ========================================================================= */
            <div className="glass-card dashboard-container" style={{ textAlign: 'left', padding: '30px 40px' }}>
              
              {/* Dashboard Header */}
              <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <div>
                  <span className="logo-glow" style={{ fontSize: '1.8rem', cursor: 'pointer' }} onClick={() => setEnteredService(false)}>hactto</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary-cyan)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.2)', marginLeft: '12px' }}>대시보드</span>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {localStorage.getItem('user_mk') ? (
                    <button className="btn-neon btn-outline" onClick={() => {
                      localStorage.removeItem('user_mk');
                      showAlert('success', 'Master key 등록이 해제되었습니다.');
                      checkIpStatus();
                    }} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', color: 'var(--primary-purple)', borderColor: 'rgba(189, 0, 255, 0.3)' }}>
                      Master key 해제
                    </button>
                  ) : (
                    <button className="btn-neon btn-outline" onClick={() => {
                      setShowMasterKey(prev => !prev);
                      setAlert(null);
                    }} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                      {showMasterKey ? '등록 취소' : 'Master key 등록'}
                    </button>
                  )}
                  <button className="btn-neon btn-outline" onClick={() => setEnteredService(false)} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                    돌아가기
                  </button>
                </div>
              </div>

              {showMasterKey && !localStorage.getItem('user_mk') && (
                <form className="masterkey-form-container" onSubmit={handleMasterKeySubmit} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: 'var(--border-glass)', textAlign: 'left' }}>
                  <label className="form-label" htmlFor="dashboardMasterKey" style={{ marginBottom: '8px', display: 'block' }}>Master key 등록</label>
                  <div className="input-container" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="dashboardMasterKey"
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

              {/* Navigation Tabs */}
              <div className="admin-tabs" style={{ display: 'flex', gap: '5px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button className={`tab-btn ${activeTab === 'home' ? 'active-tab' : ''}`} onClick={() => setActiveTab('home')}>최근 당첨번호</button>
                <button className={`tab-btn ${activeTab === 'search' ? 'active-tab' : ''}`} onClick={() => setActiveTab('search')}>당첨번호 조회</button>
                <button className={`tab-btn ${activeTab === 'stats' ? 'active-tab' : ''}`} onClick={() => setActiveTab('stats')}>알고리즘 통계</button>
                <button className={`tab-btn ${activeTab === 'generate' ? 'active-tab' : ''}`} onClick={() => { setActiveTab('generate'); setGeneratedNumbers(null); }}>예측번호 생성</button>
                <button className={`tab-btn ${activeTab === 'history' ? 'active-tab' : ''}`} onClick={() => setActiveTab('history')}>내 당첨이력</button>
                {(localStorage.getItem('user_mk') || sessionStorage.getItem('rmk')) && (
                  <button className={`tab-btn ${activeTab === 'system' ? 'active-tab' : ''}`} onClick={() => setActiveTab('system')}>시스템 관리</button>
                )}
              </div>

              {/* Tab Contents */}
              {activeTab === 'home' && (
                <div>
                  <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>가장 최근 당첨 번호 결과</h2>
                  {latestWinningNumber ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-cyan)', marginBottom: '16px' }}>
                        제 {latestWinningNumber.episode}회 로또 당첨번호
                      </div>
                      {renderLottoBalls(latestWinningNumber.numbers)}
                      <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        본 결과는 동행복권 공식 데이터를 바탕으로 제공됩니다. (토요일 20시 35분 이후 자동 갱신)
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-dim)' }}>최근 당첨 번호를 로드하는 중...</p>
                  )}
                  
                  <div className="features-grid" style={{ marginTop: '24px' }}>
                    <div className="feature-item">
                      <div className="feature-title">데이터 동기화 완료</div>
                      <div className="feature-desc">역대 로또 번호 정보가 시스템 DB에 완전하게 연동되어 고정밀 통계 모델 계산이 가능합니다.</div>
                    </div>
                    <div className="feature-item">
                      <div className="feature-title">알고리즘 분석 기법</div>
                      <div className="feature-desc">빈도 분석 및 역가중 가설 기반 알고리즘 엔진을 통해 최적의 예측 번호를 산출합니다.</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'search' && (
                <div>
                  <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>역대 로또 당첨번호 조회</h2>
                  
                  {/* Search Form */}
                  <form onSubmit={handleSearchEpisode} style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                    <input 
                      type="text" 
                      className="input-glow" 
                      placeholder="검색할 회차 번호 입력 (예: 1000)" 
                      value={searchEpisode} 
                      onChange={(e) => setSearchEpisode(e.target.value)}
                      disabled={submitting}
                      style={{ flex: 1 }}
                    />
                    <button className="btn-submit" type="submit" disabled={submitting} style={{ whiteSpace: 'nowrap' }}>
                      {submitting ? '검색 중...' : '회차 검색'}
                    </button>
                  </form>

                  {searchError && (
                    <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                      <span>⚠</span>
                      <div>{searchError}</div>
                    </div>
                  )}

                  {searchResult && (
                    <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.15)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--primary-cyan)', marginBottom: '14px' }}>
                        제 {searchResult.episode}회 당첨번호 결과
                      </div>
                      {renderLottoBalls(searchResult.numbers)}
                    </div>
                  )}

                  {/* Previous list */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-muted)' }}>최근 당첨 번호 내역</h3>
                  <div className="scroll-y-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>회차</th>
                          <th>당첨 번호</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allWinningNumbers.length === 0 ? (
                          <tr>
                            <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>불러온 내역이 없습니다.</td>
                          </tr>
                        ) : (
                          allWinningNumbers.slice(0, 20).map((wn) => (
                            <tr key={wn.episode}>
                              <td style={{ fontWeight: 'bold', color: 'var(--primary-cyan)' }}>{wn.episode}회</td>
                              <td>{renderLottoBalls(wn.numbers)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>알고리즘별 평균 신뢰도 통계</h2>
                  <p className="access-desc" style={{ fontSize: '0.88rem', marginBottom: '24px' }}>
                    알고리즘 신뢰도 점수는 과거 데이터 시뮬레이션을 통해 생성된 번호가 실제 당첨 번호 분포와 얼마나 근접하게 일치했는지를 수치화한 지표입니다.
                  </p>
                  
                  {algorithmTypes.map((type) => {
                    const score = algorithmStats[type];
                    return (
                      <div key={type} style={{ background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)', padding: '20px', borderRadius: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>{parseAlgorithmName(type)}</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-purple)' }}>{score ? `${score.toFixed(2)} %` : '집계 중...'}</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${score || 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                        </div>
                        <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {type === 'MIN_COUNT' 
                            ? 'MIN_COUNT (최소 빈도 조합 가설): 역사적 당첨 데이터에서 가작 누적 출현 빈도가 낮았던 수들을 우선 조합하는 모델입니다. 평균 회귀 경향성을 추종합니다.' 
                            : 'TOTAL_MIN_COUNT (가중 분산 가설): 전체 출현 비율의 불균형을 해소하기 위하여 가중 분산 비중을 적용, 각 번호대별 밸런스를 고려한 정교한 생성 기법입니다.'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'generate' && (
                <div>
                  <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>당첨 예측번호 생성기</h2>
                  <p className="access-desc" style={{ fontSize: '0.88rem', marginBottom: '24px' }}>
                    사용하고자 하는 하이퍼-파라미터 알고리즘을 선택한 후 번호를 생성해주십시오. 결과는 고유 식별자(IP 및 브라우저 세션)를 통해 내 당첨이력에 즉시 아카이빙됩니다.
                  </p>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>분석 예측 알고리즘 선택</label>
                    <select 
                      className="input-glow" 
                      value={generatingAlgo} 
                      onChange={(e) => setGeneratingAlgo(e.target.value)}
                      disabled={generating}
                      style={{ marginBottom: '20px', background: 'var(--bg-dark)', cursor: 'pointer' }}
                    >
                      {algorithmTypes.map(type => (
                        <option key={type} value={type}>{parseAlgorithmName(type)}</option>
                      ))}
                    </select>

                    <button 
                      className="btn-neon btn-cyan" 
                      onClick={handleGeneratePrediction}
                      disabled={generating}
                      style={{ height: '48px' }}
                    >
                      {generating ? '최적 조합 연산 중...' : '예측번호 생성하기'}
                    </button>
                  </div>

                  {generatedNumbers && (
                    <div style={{ background: 'rgba(189, 0, 255, 0.04)', border: '1px solid rgba(189, 0, 255, 0.25)', padding: '24px', borderRadius: '16px', textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-purple)', marginBottom: '16px' }}>
                        생성된 {parseAlgorithmName(generatingAlgo)} 예측 조합 번호
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {generatedNumbers.slice(0, 6).map((num, i) => (
                          <div key={i} className="lotto-ball lotto-ball-pop" style={{ ...getBallStyle(num), animationDelay: `${i * 100}ms`, margin: '0 4px' }}>
                            {num}
                          </div>
                        ))}
                        {generatedNumbers.length === 7 && (
                          <>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)', margin: '0 4px', animation: 'fadeIn 0.4s ease-out', animationDelay: '600ms', animationFillMode: 'both' }}>+</div>
                            <div className="lotto-ball lotto-ball-pop" style={{ ...getBallStyle(generatedNumbers[6]), animationDelay: '700ms', margin: '0 4px' }}>
                              {generatedNumbers[6]}
                            </div>
                          </>
                        )}
                      </div>
                      <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        본 예측번호 조합은 [내 당첨이력] 메뉴에서 언제든지 실제 당첨결과와 대조해 볼 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>내 예측 당첨이력 확인</h2>
                  <p className="access-desc" style={{ fontSize: '0.88rem', marginBottom: '24px' }}>
                    이 브라우저 세션을 통해 생성된 모든 예측 조합의 추첨 대조 내역입니다. 추첨이 완료되면 매칭된 등수(1~5등)가 표시됩니다.
                  </p>

                  <div className="scroll-y-container">
                    {historyList.length === 0 ? (
                      <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>생성된 이력이 없습니다. 예측 번호를 먼저 생성해주세요.</p>
                    ) : (
                      historyList.map((hist) => {
                        const hasResult = hist.matchResult !== null;
                        return (
                          <div key={hist.id} className="history-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary-cyan)', fontSize: '0.95rem' }}>{hist.episode}회차 예측</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '10px' }}>[{parseAlgorithmName(hist.algorithm)}]</span>
                              </div>
                              <div>
                                {hasResult ? (
                                  hist.matchResult.rank > 0 ? (
                                    <span className={`badge badge-rank-${hist.matchResult.rank}`}>
                                      {hist.matchResult.rank}등 당첨!!
                                    </span>
                                  ) : (
                                    <span className="badge badge-no-prize">낙첨</span>
                                  )
                                ) : (
                                  <span className="badge badge-pending">추첨 대기중</span>
                                )}
                              </div>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>예측 조합:</div>
                              {renderLottoBalls(hist.numbers, hist.matchResult)}
                            </div>

                            {hasResult && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '10px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  실제 당첨: (일치 개수: <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{hist.matchResult.matchCount}개</span>{hist.matchResult.bonusMatch ? ' + 보너스 일치' : ''})
                                </div>
                                {renderLottoBalls(hist.matchResult.winningNumbers)}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div>
                  <h2 className="access-title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>시스템 데이터 관리</h2>
                  <p className="access-desc" style={{ fontSize: '0.88rem', marginBottom: '24px' }}>
                    시스템의 핵심 데이터를 동기화하고 알고리즘의 신뢰도를 실시간 분석할 수 있는 관리자 도구입니다.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 당첨번호 동기화 */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-cyan)', marginBottom: '8px' }}>당첨번호 동기화 (Fetch)</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        동행복권 서버로부터 최신 당첨 번호 데이터를 긁어와 동기화합니다.
                      </p>
                      <form onSubmit={handleAdminFetch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="input-glow" 
                          placeholder="동기화할 최신 회차 번호 입력 (예: 1220)" 
                          value={fetchEpisodeInput} 
                          onChange={(e) => setFetchEpisodeInput(e.target.value)}
                          disabled={fetchingWinningNumbers}
                          style={{ flex: 1 }}
                        />
                        <button className="btn-submit" type="submit" disabled={fetchingWinningNumbers} style={{ height: '42px', whiteSpace: 'nowrap' }}>
                          {fetchingWinningNumbers ? '동기화 중...' : '동기화 실행'}
                        </button>
                      </form>
                    </div>

                    {/* 신뢰도 분석 실행 */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: 'var(--border-glass)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-purple)', marginBottom: '8px' }}>알고리즘 신뢰도 분석 (Analyze)</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        예측 알고리즘 모델의 평균 신뢰도 통계를 다시 산출하는 배치 프로세스를 실행합니다.
                      </p>
                      <button 
                        className="btn-submit" 
                        onClick={handleAdminAnalyze} 
                        disabled={analyzingReliability}
                        style={{ height: '42px', width: 'auto', padding: '0 24px' }}
                      >
                        {analyzingReliability ? '분석 중...' : '신뢰도 분석 실행'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {alert && (
                <div className={`alert alert-${alert.type}`} style={{ marginTop: '20px' }}>
                  <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
                  <div>{alert.text}</div>
                </div>
              )}
            </div>
          ) : (
            /* =========================================================================
               ALLOWED SCREEN VIEW (WELCOME)
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

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="btn-neon btn-cyan" onClick={() => {
                  setEnteredService(true);
                }} style={{ flex: 2 }}>
                  서비스 진입하기
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                {localStorage.getItem('user_mk') ? (
                  <button className="btn-neon btn-outline" onClick={() => {
                    localStorage.removeItem('user_mk');
                    showAlert('success', 'Master key 등록이 해제되었습니다.');
                    checkIpStatus();
                  }} style={{ flex: 1, color: 'var(--primary-purple)', borderColor: 'rgba(189, 0, 255, 0.3)', padding: 0 }}>
                    Master key 해제
                  </button>
                ) : (
                  <button className="btn-neon btn-outline" onClick={() => {
                    setShowMasterKey(prev => !prev);
                    setAlert(null);
                  }} style={{ flex: 1, padding: 0 }}>
                    {showMasterKey ? '등록 취소' : 'Master key 등록'}
                  </button>
                )}
              </div>

              {showMasterKey && !localStorage.getItem('user_mk') && (
                <form className="masterkey-form-container" onSubmit={handleMasterKeySubmit} style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'left' }}>
                  <label className="form-label" htmlFor="welcomeMasterKey" style={{ marginBottom: '8px', display: 'block' }}>Master key 등록</label>
                  <div className="input-container" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="welcomeMasterKey"
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
              
              {alert && (
                <div className={`alert alert-${alert.type}`}>
                  <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
                  <div>{alert.text}</div>
                </div>
              )}
            </div>
          )
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
