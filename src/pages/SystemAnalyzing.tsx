export function SystemAnalyzing() {
  return (
    <div
      className="access-container"
      style={{ maxWidth: "640px", width: "100%", textAlign: "center" }}
    >
      <div className="glass-card allowed-dashboard" style={{ position: "relative", overflow: "hidden" }}>
        {/* Ambient background pulse */}
        <div 
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 60%)",
            pointerEvents: "none",
            zIndex: 0
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Animated loading spinner icon */}
          <div 
            className="status-icon" 
            style={{ 
              borderColor: "var(--primary-cyan)", 
              color: "var(--primary-cyan)", 
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "spin 3s linear infinite"
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

          <span className="logo-glow" style={{ fontSize: "2.5rem", display: "block" }}>
            hactto
          </span>

          <h1 className="access-title" style={{ marginTop: "16px", color: "var(--text-main)" }}>
            신규 당첨번호 분석 진행 중
          </h1>

          <p
            className="access-desc"
            style={{ 
              maxWidth: "480px", 
              margin: "20px auto 30px", 
              lineHeight: "1.6", 
              color: "var(--text-muted)" 
            }}
          >
            매주 토요일 오후 8시 30분부터 서비스 정합성을 위해
            <br />
            당첨번호 수집 및 알고리즘 신뢰도 측정 작업을 수행합니다.
            <br />
            이 시간 동안은 서비스 이용이 제한됩니다.
          </p>

          <div
            className="feature-item"
            style={{
              background: "rgba(0, 240, 255, 0.03)",
              border: "1px solid rgba(0, 240, 255, 0.15)",
              padding: "20px",
              borderRadius: "12px",
              textAlign: "left",
              marginBottom: "10px"
            }}
          >
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                color: "var(--primary-cyan)", 
                fontWeight: 600, 
                marginBottom: "8px" 
              }}
            >
              <span 
                className="pulsing-dot" 
                style={{ 
                  display: "inline-block", 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  background: "var(--primary-cyan)", 
                  boxShadow: "0 0 8px var(--primary-cyan)" 
                }}
              ></span>
              실시간 상태 감지 중
            </div>
            <div className="feature-desc" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              분석이 완료되는 즉시 페이지가 자동으로 새로고침 없이 대시보드로 전환됩니다. 브라우저 창을 닫지 마시고 잠시만 기다려주세요.
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
