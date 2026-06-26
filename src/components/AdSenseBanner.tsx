import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdSenseBannerProps {
  client?: string;
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AdFallback: React.FC<{ format: string }> = ({ format }) => {
  const isVertical = format === 'vertical' || format === 'rectangle';
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/generate');
  };

  if (isVertical) {
    return (
      <div
        className="ad-fallback-container ad-fallback-vertical"
        onClick={handleClick}
      >
        <div className="ad-title-wrap">
          <div className="ad-subtitle">차세대 로또 분석</div>
          <div className="ad-title">hactto</div>
          <div className="ad-badge">GRAND OPEN</div>
        </div>

        <div className="ad-balls-container">
          <div className="ad-ball ball-1">7</div>
          <div className="ad-ball ball-2">14</div>
          <div className="ad-ball ball-3">25</div>
          <div className="ad-ball ball-4">32</div>
          <div className="ad-ball ball-5">38</div>
          <div className="ad-ball ball-6">45</div>
        </div>

        <div className="ad-desc">
          AI 패턴 분석과 가중치 필터링으로{'\n'}더 스마트한 분석을 시작해
          보세요.
        </div>
        <button className="ad-button" onClick={handleClick}>
          분석하러 가기
        </button>
      </div>
    );
  }

  return (
    <div
      className="ad-fallback-container ad-fallback-horizontal"
      onClick={handleClick}
    >
      <div className="ad-left">
        <span className="ad-logo">hactto</span>
        <div className="ad-divider" />
        <div className="ad-text-content">
          <span className="ad-tagline">
            차세대 로또 분석 <span>hactto</span> grand open!
          </span>
          <span className="ad-subtag">AI 분석 시스템 가동 중</span>
        </div>
      </div>
      <div className="ad-right">
        <div className="ad-mini-balls">
          <div className="ad-mini-ball b1" />
          <div className="ad-mini-ball b2" />
          <div className="ad-mini-ball b3" />
        </div>
        <button className="ad-button" onClick={handleClick}>
          바로가기
        </button>
      </div>
    </div>
  );
};

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  client = 'ca-pub-XXXXXXXXXXXXXXXX',
  slot,
  format = 'vertical',
  responsive = 'true',
  style = { display: 'block', width: '100%', height: '100%' },
}) => {
  const initialized = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (initialized.current) return;

    let retries = 0;
    const maxRetries = 5;

    const initAd = () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          const insElements = document.querySelectorAll(
            `.adsbygoogle[data-ad-slot="${slot}"]`,
          );
          let hasWidth = false;

          for (let i = 0; i < insElements.length; i++) {
            const el = insElements[i] as HTMLElement;
            // Check if the element or its parent has width > 0
            if (
              el.clientWidth > 0 ||
              (el.parentElement && el.parentElement.clientWidth > 0)
            ) {
              hasWidth = true;
              break;
            }
          }

          if (!hasWidth) {
            if (retries < maxRetries) {
              retries++;
              setTimeout(initAd, 200); // Retry in 200ms
            } else {
              console.warn(
                `AdSense slot ${slot} initialization skipped: container width is 0.`,
              );
            }
            return;
          }

          (window.adsbygoogle = window.adsbygoogle || []).push({});
          initialized.current = true;
        }
      } catch (err) {
        console.error('AdSense initialization error:', err);
      }
    };

    const timer = setTimeout(initAd, 150); // Initial delay for layout reflow

    // Check if the ad failed to load or was blocked by an adblocker after 2 seconds
    const checkTimer = setTimeout(() => {
      const isScriptLoaded =
        typeof window !== 'undefined' &&
        window.adsbygoogle &&
        window.adsbygoogle.push !== Array.prototype.push;

      const insEl = insRef.current;
      if (!insEl) return;

      const hasIframe = insEl.getElementsByTagName('iframe').length > 0;
      const status = insEl.getAttribute('data-ad-status');

      if (!isScriptLoaded || !hasIframe || status === 'unfilled') {
        setAdFailed(true);
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkTimer);
    };
  }, [slot]);

  if (adFailed) {
    return <AdFallback format={format} />;
  }

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={style}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
};
