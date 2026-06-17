import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';
import { LottoBalls } from '../../components/LottoBall';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import type { WinningNumber } from '../../types';

export function Search() {
  const { appendAuth } = useApp();
  const [searchEpisode, setSearchEpisode] = useState('');
  const [searchResult, setSearchResult] = useState<WinningNumber | null>(null);
  const [searchError, setSearchError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allWinningNumbers, setAllWinningNumbers] = useState<WinningNumber[]>(
    [],
  );
  const [selectedEpisode, setSelectedEpisode] = useState<WinningNumber | null>(
    null,
  );

  // Prevent body scroll when modal is open and add ESC key support
  useEffect(() => {
    const scrollContainer = document.querySelector(
      '.scroll-y-container',
    ) as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEpisode(null);
      }
    };

    if (selectedEpisode) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      if (scrollContainer) scrollContainer.style.overflowY = 'auto';
    }
    return () => {
      document.body.style.overflow = '';
      if (scrollContainer) scrollContainer.style.overflowY = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedEpisode]);

  const handleSelectEpisode = async (episode: number) => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/winning-numbers/${episode}`),
      );
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data;
        setSelectedEpisode(result as WinningNumber);
      }
    } catch (err) {
      console.error('Failed to fetch episode details:', err);
    }
  };

  useEffect(() => {
    const fetchAllWinningNumbers = async () => {
      try {
        const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers`));
        if (res.ok) {
          const data = await res.json();
          const result = (data.data || data || []) as WinningNumber[];
          const sorted = [...result].sort((a, b) => b.episode - a.episode);
          const drawnResults = sorted.filter((wn) => wn.isDrawn === true);
          setAllWinningNumbers(drawnResults);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWinningNumbers();
  }, [appendAuth]);

  const handleSearchEpisode = async (e: FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    if (!searchEpisode.trim() || isNaN(Number(searchEpisode))) {
      setSearchError('올바른 회차 번호를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/winning-numbers/${searchEpisode}`),
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`${searchEpisode}회차 당첨번호가 존재하지 않습니다.`);
        }
        throw new Error('회차 번호 검색 중 오류가 발생했습니다.');
      }
      const data = await res.json();
      const result = data.data || data;
      if (!result || !result.isDrawn) {
        throw new Error(
          `${searchEpisode}회차는 아직 추첨이 진행되지 않았습니다.`,
        );
      }
      setSearchResult(result as WinningNumber);
    } catch (err) {
      const error = err as Error;
      setSearchError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: '1.3rem', marginBottom: '16px' }}
      >
        역대 로또 당첨번호 조회
      </h2>

      {/* Search Form */}
      <form
        onSubmit={handleSearchEpisode}
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          background: 'rgba(255,255,255,0.01)',
          padding: '16px',
          borderRadius: '12px',
          border: 'var(--border-glass)',
        }}
      >
        <input
          type="text"
          className="input-glow"
          placeholder="검색할 회차 번호 입력 (예: 1000)"
          value={searchEpisode}
          onChange={(e) => setSearchEpisode(e.target.value)}
          disabled={submitting}
          style={{ flex: 1 }}
        />
        <button
          className="btn-submit"
          type="submit"
          disabled={submitting}
          style={{ whiteSpace: 'nowrap' }}
        >
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
        <div
          onClick={() => handleSelectEpisode(searchResult.episode)}
          style={{
            background: 'rgba(0, 240, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.06)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.03)')
          }
        >
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>제 {searchResult.episode}회 당첨번호 결과</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              상세 분석 보기 🔍
            </span>
          </div>
          <LottoBalls numbers={searchResult.numbers} />
        </div>
      )}

      {/* Previous list */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: 'var(--text-muted)',
        }}
      >
        최근 당첨 번호 내역 (회차 클릭 시 상세 분석)
      </h3>
      <div className="scroll-y-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>회차</th>
              <th>당첨 번호</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={2}
                  style={{ textAlign: 'center', color: 'var(--text-dim)' }}
                >
                  불러오는 중...
                </td>
              </tr>
            ) : allWinningNumbers.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{ textAlign: 'center', color: 'var(--text-dim)' }}
                >
                  불러온 내역이 없습니다.
                </td>
              </tr>
            ) : (
              allWinningNumbers.slice(0, 20).map((wn) => (
                <tr
                  key={wn.episode}
                  onClick={() => handleSelectEpisode(wn.episode)}
                  style={{ cursor: 'pointer' }}
                >
                  <td
                    style={{ fontWeight: 'bold', color: 'var(--primary-cyan)' }}
                  >
                    {wn.episode}회 🔍
                  </td>
                  <td>
                    <LottoBalls numbers={wn.numbers} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>      {selectedEpisode &&
        createPortal(
          <div
            className="admin-modal-overlay"
          >
            <div
              className="glass-card admin-modal-content"
              style={{
                maxWidth: '600px',
                padding: '0',
                textAlign: 'left',
                position: 'relative',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                boxShadow:
                  '0 20px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 240, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '30px 30px 0 30px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <button
                  onClick={() => setSelectedEpisode(null)}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--text-main)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--text-dim)')
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <h2
                  className="access-title"
                  style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-main)',
                    marginBottom: '4px',
                    paddingRight: '24px',
                  }}
                >
                  제 {selectedEpisode.episode}회 당첨 결과 상세 분석
                </h2>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-dim)',
                    marginBottom: '20px',
                  }}
                >
                  당첨 번호 조합 및 통계 데이터를 바탕으로 분석 정보를 제공합니다.
                </p>

                <LottoAnalysisCard
                  numbers={selectedEpisode.numbers}
                  analysis={selectedEpisode.analysis}
                />
              </div>

              <div style={{ padding: '20px 30px 30px 30px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-submit"
                  style={{
                    width: '100%',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'linear-gradient(135deg, var(--primary-cyan) 0%, #00b0ff 100%)',
                    boxShadow: '0 4px 15px rgba(0, 240, 255, 0.25)',
                    color: '#030712',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                  onClick={() => setSelectedEpisode(null)}
                >
                  확인
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
export default Search;
