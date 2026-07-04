import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';
import { LottoBalls } from '../../components/LottoBall';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import type { WinningNumber } from '../../types';
import { SEO } from '../../components/SEO';

export function Home() {
  const { appendAuth, showAlert } = useApp();
  const [latestWinningNumber, setLatestWinningNumber] =
    useState<WinningNumber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestWinningNumber = async () => {
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/winning-numbers/latest`),
        );
        if (!res.ok) throw new Error('최근 당첨번호를 가져오지 못했습니다.');
        const data = await res.json();
        setLatestWinningNumber((data.data || data) as WinningNumber);
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestWinningNumber();
  }, [appendAuth, showAlert]);

  return (
    <div>
      <SEO canonical="https://hactto.com/" />
      <h2
        className="access-title"
        style={{ fontSize: '1.3rem', marginBottom: '16px' }}
      >
        가장 최근 당첨 번호 결과
      </h2>
      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>
          최근 당첨 번호를 로드하는 중...
        </p>
      ) : latestWinningNumber ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: 'var(--border-glass)',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginBottom: '16px',
            }}
          >
            제 {latestWinningNumber.episode}회 로또 당첨번호
          </div>
          <LottoBalls numbers={latestWinningNumber.numbers} />

          <LottoAnalysisCard
            numbers={latestWinningNumber.numbers}
            analysis={latestWinningNumber.analysis}
            title="당첨 번호 심층 분석 정보"
          />

          <p
            style={{
              marginTop: '20px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            본 결과는 동행복권 공식 데이터를 바탕으로 제공됩니다. (토요일 21시
            이후 자동 갱신)
          </p>
        </div>
      ) : (
        <p style={{ color: 'var(--text-dim)' }}>
          최근 당첨 번호 정보가 없습니다.
        </p>
      )}

      <div className="features-grid" style={{ marginTop: '24px' }}>
        <div className="feature-item">
          <div className="feature-title">데이터 동기화 완료</div>
          <div className="feature-desc">
            역대 로또 번호 정보가 시스템 DB에 완전하게 연동되어 고정밀 통계 모델
            계산이 가능합니다.
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-title">알고리즘 분석 기법</div>
          <div className="feature-desc">
            빈도 분석 및 역가중 가설 기반 알고리즘 엔진을 통해 최적의 예측
            번호를 산출합니다.
          </div>
        </div>
      </div>
    </div>
  );
}
export default Home;
