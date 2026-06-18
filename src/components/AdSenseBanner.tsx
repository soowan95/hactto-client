import React, { useEffect, useRef } from 'react';

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

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  client = 'ca-pub-XXXXXXXXXXXXXXXX',
  slot,
  format = 'vertical',
  responsive = 'true',
  style = { display: 'block', width: '100%', height: '100%' },
}) => {
  const initialized = useRef(false);

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
    return () => clearTimeout(timer);
  }, [slot]);

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
};
