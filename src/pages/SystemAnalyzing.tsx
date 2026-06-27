import { useApp } from '../context/AppContext';

export function SystemAnalyzing() {
  const { systemAnalysisProgress } = useApp();

  const formatEstimatedTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const displayHour = hours % 12 || 12;
      return `예상 완료 시간: ${ampm} ${displayHour}시 ${minutes}분`;
    } catch {
      return '';
    }
  };

  const progress = systemAnalysisProgress?.progress ?? 0;
  const statusMessage = systemAnalysisProgress?.message || '분석 준비 중...';
  const etaText = formatEstimatedTime(
    systemAnalysisProgress?.estimatedCompletionTime,
  );

  return (
    <div
      className="access-container"
      style={{ maxWidth: '640px', width: '100%', textAlign: 'center' }}
    >
      <div
        className="glass-card allowed-dashboard"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* Ambient background pulse */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background:
              'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Animated loading spinner icon */}
          <div
            className="status-icon"
            style={{
              borderColor: 'var(--primary-cyan)',
              color: 'var(--primary-cyan)',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 3s linear infinite',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </div>

          <span
            className="logo-glow"
            style={{ fontSize: '2.5rem', display: 'block' }}
          >
            hactto
          </span>

          <h1
            className="access-title"
            style={{ marginTop: '16px', color: 'var(--text-main)' }}
          >
            신규 당첨번호 분석 진행 중
          </h1>

          <p
            className="access-desc"
            style={{
              maxWidth: '480px',
              margin: '20px auto 24px',
              lineHeight: '1.6',
              color: 'var(--text-muted)',
            }}
          >
            매주 토요일 오후 9시부터 서비스 정합성을 위해
            <br />
            당첨번호 수집 및 알고리즘 신뢰도 측정 작업을 수행합니다.
            <br />이 시간 동안은 서비스 이용이 제한됩니다.
          </p>

          {/* Progress Section */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                }}
              >
                {statusMessage}
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: 'var(--primary-cyan)',
                  textShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
                }}
              >
                {progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: etaText ? '12px' : '0',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background:
                    'linear-gradient(90deg, var(--primary-cyan) 0%, #00e5ff 100%)',
                  boxShadow: '0 0 10px var(--primary-cyan)',
                  borderRadius: '4px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>

            {etaText && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {etaText}
              </div>
            )}
          </div>

          <div
            className="feature-item"
            style={{
              background: 'rgba(0, 240, 255, 0.03)',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'left',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--primary-cyan)',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              <span
                className="pulsing-dot"
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary-cyan)',
                  boxShadow: '0 0 8px var(--primary-cyan)',
                }}
              ></span>
              실시간 상태 감지 중
            </div>
            <div
              className="feature-desc"
              style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}
            >
              분석이 완료되는 즉시 페이지가 자동으로 새로고침 없이 대시보드로
              전환됩니다.
              <br />
              브라우저 창을 닫지 마시고 잠시만 기다려주세요.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .pulsing-dot {
          animation: dot-pulse 1.5s infinite ease-in-out;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
export default SystemAnalyzing;
