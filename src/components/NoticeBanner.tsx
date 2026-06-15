import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils';

interface Notice {
  id: string;
  title: string;
  content: string;
  endsAt: string;
}

function NoticeText({ currentNotice }: { currentNotice: Notice }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

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
  }, [currentNotice]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        overflow: 'hidden',
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
        {currentNotice.title}
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
            {currentNotice.content}
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
              {currentNotice.content}
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
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/manager/notices`);
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

  // Check if this notice was dismissed during this session
  useEffect(() => {
    if (notices.length > 0) {
      const dismissedNotices = JSON.parse(
        sessionStorage.getItem('dismissed_notices') || '[]',
      );
      const currentNoticeId = notices[currentIndex]?.id;
      if (dismissedNotices.includes(currentNoticeId)) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [notices, currentIndex]);

  if (notices.length === 0 || isDismissed) return null;

  const currentNotice = notices[currentIndex];

  const handleDismiss = () => {
    const dismissedNotices = JSON.parse(
      sessionStorage.getItem('dismissed_notices') || '[]',
    );
    dismissedNotices.push(currentNotice.id);
    sessionStorage.setItem(
      'dismissed_notices',
      JSON.stringify(dismissedNotices),
    );
    setIsDismissed(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  return (
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
      }}
    >
      <NoticeText currentNotice={currentNotice} />

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
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '2px',
            lineHeight: 1,
          }}
          title="오늘 하루 닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
