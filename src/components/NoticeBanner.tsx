import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils';

interface Notice {
  id: string;
  title: string;
  content: string;
  endsAt: string;
}

function NoticeText({
  currentNotice,
  onClick,
}: {
  currentNotice: Notice;
  onClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [fade, setFade] = useState(true);
  const [displayNotice, setDisplayNotice] = useState(currentNotice);

  useEffect(() => {
    const fadeOutTimeout = setTimeout(() => {
      setFade(false);
    }, 0);

    const swapTimeout = setTimeout(() => {
      setDisplayNotice(currentNotice);
      setFade(true);
    }, 250);

    return () => {
      clearTimeout(fadeOutTimeout);
      clearTimeout(swapTimeout);
    };
  }, [currentNotice]);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing =
          textRef.current.offsetWidth > containerRef.current.offsetWidth;
        setShouldScroll(isOverflowing);
      }
    };

    checkOverflow();
    // Re-check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [displayNotice]);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'opacity 0.25s ease-in-out',
        opacity: fade ? 1 : 0,
      }}
    >
      <span
        style={{
          background: 'var(--primary-cyan)',
          color: '#0a0b10',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        NOTICE
      </span>

      {/* Fixed Title */}
      <span
        style={{
          fontSize: '0.82rem',
          fontWeight: 'bold',
          color: 'var(--primary-cyan)',
          flexShrink: 0,
        }}
      >
        {displayNotice.title}
      </span>

      {/* Vertical divider or dash */}
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '0.82rem',
          flexShrink: 0,
        }}
      >
        |
      </span>

      {/* Marquee Content */}
      <div
        ref={containerRef}
        className={shouldScroll ? 'marquee-container' : ''}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          maskImage: shouldScroll
            ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
            : 'none',
          WebkitMaskImage: shouldScroll
            ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
            : 'none',
        }}
      >
        <div
          className={shouldScroll ? 'marquee-content' : ''}
          style={{
            display: 'inline-flex',
            gap: shouldScroll ? '50px' : '0px',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            ref={textRef}
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-main)',
              fontWeight: '500',
            }}
          >
            {displayNotice.content}
          </span>
          {shouldScroll && (
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                fontWeight: '500',
              }}
              aria-hidden="true"
            >
              {displayNotice.content}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NoticeBanner() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/visitor/notices`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          setNotices(list);
        }
      } catch (err) {
        console.error('공지사항을 불러오지 못했습니다:', err);
      }
    };

    fetchNotices();
  }, []);

  // Automatic notice rotation interval
  useEffect(() => {
    if (notices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 5000); // rotate every 5 seconds

    return () => clearInterval(interval);
  }, [notices.length]);

  // Disable/Enable page scroll when detail modal is active
  useEffect(() => {
    if (showDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDetail]);

  if (notices.length === 0) return null;

  const currentNotice = notices[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  return (
    <>
      <div
        style={{
          width: '100%',
          background:
            'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(157, 0, 255, 0.15) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
          animation: 'pulse 3s infinite alternate',
          flexShrink: 0,
        }}
      >
        <NoticeText
          currentNotice={currentNotice}
          onClick={() => setShowDetail(true)}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {notices.length > 1 && (
            <button
              onClick={handleNext}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-dim)',
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              다음 공지 ({currentIndex + 1}/{notices.length})
            </button>
          )}
        </div>
      </div>

      {showDetail && (
        <div
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(3, 4, 8, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'var(--bg-card)',
              border: 'var(--border-glass)',
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span
                  style={{
                    background: 'var(--primary-cyan)',
                    color: '#0a0b10',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  NOTICE
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#ffffff',
                  }}
                >
                  공지사항
                </span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content (No bottom spacing issues & cleanly scrollable internal content if too long) */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-cyan)',
                    marginBottom: '4px',
                  }}
                >
                  {currentNotice.title}
                </h3>
              </div>

              <div
                style={{
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {currentNotice.content}
              </div>
            </div>

            {/* Footer with Close Button (Compact, removing extra margins) */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <button
                onClick={() => setShowDetail(false)}
                className="btn-submit"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
