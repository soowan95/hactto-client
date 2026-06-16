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
    // React 18/19 StrictMode나 HMR 상황에서 중복 push가 실행되어 에러가 발생하는 것을 방지
    if (initialized.current) return;

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      }
    } catch (err) {
      console.error('AdSense initialization error:', err);
    }
  }, []);

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
