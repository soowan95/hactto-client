import { useState, useEffect } from 'react';
import { SouthKoreaMap } from '../../components/SouthKoreaMap';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';

interface Store {
  rnum: number;
  shpNm: string;
  shpAddr: string;
  atmtPsvYnTxt: string;
  wnShpRnk: number;
  region: string;
}

const regionNameMap: Record<string, string> = {
  Seoul: '서울',
  Busan: '부산',
  Daegu: '대구',
  Incheon: '인천',
  Gwangju: '광주',
  Daejeon: '대전',
  Ulsan: '울산',
  Sejong: '세종',
  Gyeonggi: '경기',
  Gangwon: '강원',
  'North Chungcheong': '충북',
  'South Chungcheong': '충남',
  'North Jeolla': '전북',
  'South Jeolla': '전남',
  'North Gyeongsang': '경북',
  'South Gyeongsang': '경남',
  Jeju: '제주',
};

export function Locations() {
  const { appendAuth } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rankFilter, setRankFilter] = useState<'all' | 1 | 2>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | '자동' | '수동' | '반자동'
  >('all');

  const [latestEpisode, setLatestEpisode] = useState<number | null>(null);
  const [episode, setEpisode] = useState<number | null>(null);

  useEffect(() => {
    const fetchLatestEpisode = async () => {
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/winning-numbers/latest`),
        );
        if (res.ok) {
          const data = await res.json();
          // Assuming data structure contains episode in data.data.episode or data.episode
          const maxEps = data.data?.episode || data.episode;
          if (maxEps) {
            setLatestEpisode(maxEps);
            setEpisode(maxEps);
          }
        }
      } catch (err) {
        console.error('최신 회차 로드 실패:', err);
      }
    };
    fetchLatestEpisode();
  }, [appendAuth]);

  useEffect(() => {
    if (!episode) return;
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://www.dhlottery.co.kr/wnprchsplcsrch/selectLtWnShp.do?srchWnShpRnk=all&srchLtEpsd=${episode}&srchShpLctn=&_=${Date.now()}`,
        );
        if (!res.ok) throw new Error('API 요청 실패');

        const data = await res.json();

        if (data && data.data && data.data.list) {
          setStores(data.data.list);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error(err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [episode]);

  const handleLocationClick = (id: string, name: string) => {
    setSelectedRegion({ id, name });
  };

  const filteredStores = selectedRegion
    ? stores.filter((store) => {
        if (store.region !== regionNameMap[selectedRegion.name]) return false;
        if (rankFilter !== 'all' && store.wnShpRnk !== rankFilter) return false;
        if (typeFilter !== 'all' && store.atmtPsvYnTxt !== typeFilter)
          return false;
        return true;
      })
    : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '10px 20px',
        gap: '10px',
      }}
    >
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <h2
          style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.3rem' }}
        >
          당첨지점 조회
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: '16px',
          minHeight: 0,
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            flex: '1.2',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
            }}
          >
            <div style={{ position: 'relative' }}>
              <select
                value={episode}
                onChange={(e) => setEpisode(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: 'rgba(20, 20, 25, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--primary-cyan)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '20px',
                  padding: '6px 32px 6px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 30, 40, 0.9)';
                  e.currentTarget.style.border =
                    '1px solid rgba(0, 240, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 20, 25, 0.8)';
                  e.currentTarget.style.border =
                    '1px solid rgba(0, 240, 255, 0.3)';
                }}
              >
                {latestEpisode &&
                  Array.from(
                    { length: latestEpisode },
                    (_, i) => latestEpisode - i,
                  ).map((ep) => (
                    <option
                      key={ep}
                      value={ep}
                      style={{ background: '#1a1a24', color: 'white' }}
                    >
                      제 {ep}회
                    </option>
                  ))}
              </select>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--primary-cyan)',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          <SouthKoreaMap
            onLocationClick={handleLocationClick}
            selectedRegionId={selectedRegion?.id}
          />
        </div>

        <div
          style={{
            flex: '1',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '0 20px 20px 20px',
            overflowY: 'auto',
            minHeight: 0,
            position: 'relative',
          }}
        >
          {selectedRegion ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '20px 0 12px 0',
                  marginBottom: '16px',
                  position: 'sticky',
                  top: 0,
                  background: 'rgba(20, 20, 25, 0.95)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 10,
                }}
              >
                <h3 style={{ color: 'var(--primary-cyan)', margin: 0 }}>
                  {regionNameMap[selectedRegion.name] || selectedRegion.name}{' '}
                  당첨지점
                </h3>

                <div
                  style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                >
                  <div style={{ position: 'relative' }}>
                    <select
                      value={rankFilter}
                      onChange={(e) =>
                        setRankFilter(
                          e.target.value === 'all'
                            ? 'all'
                            : (Number(e.target.value) as 1 | 2),
                        )
                      }
                      style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-main)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '20px',
                        padding: '4px 28px 4px 12px',
                        fontSize: '0.8rem',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.border =
                          '1px solid rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.border =
                          '1px solid rgba(255, 255, 255, 0.12)';
                      }}
                    >
                      <option value="all" style={{ background: '#1a1a24' }}>
                        전체 등수
                      </option>
                      <option value="1" style={{ background: '#1a1a24' }}>
                        1등
                      </option>
                      <option value="2" style={{ background: '#1a1a24' }}>
                        2등
                      </option>
                    </select>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-dim)',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as 'all' | '자동' | '수동' | '반자동')}
                      style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-main)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '20px',
                        padding: '4px 28px 4px 12px',
                        fontSize: '0.8rem',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.border =
                          '1px solid rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.border =
                          '1px solid rgba(255, 255, 255, 0.12)';
                      }}
                    >
                      <option value="all" style={{ background: '#1a1a24' }}>
                        전체 방식
                      </option>
                      <option value="자동" style={{ background: '#1a1a24' }}>
                        자동
                      </option>
                      <option value="수동" style={{ background: '#1a1a24' }}>
                        수동
                      </option>
                      <option value="반자동" style={{ background: '#1a1a24' }}>
                        반자동
                      </option>
                    </select>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-dim)',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--primary-cyan)',
                      background: 'rgba(0, 240, 255, 0.1)',
                      border: '1px solid rgba(0, 240, 255, 0.2)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      marginLeft: '4px',
                    }}
                  >
                    {filteredStores.length}곳
                  </span>
                </div>
              </div>

              {loading ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'var(--text-dim)',
                  }}
                >
                  불러오는 중...
                </div>
              ) : error ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: '#ff4b4b',
                  }}
                >
                  {error}
                </div>
              ) : filteredStores.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {filteredStores.map((store) => (
                    <div
                      key={store.rnum}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'transform 0.2s, background 0.2s',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        window.open(
                          `https://map.kakao.com/link/map/${store.shpNm},${store.shpLat},${store.shpLot}`,
                          '_blank',
                        );
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: 'var(--text-main)',
                          }}
                        >
                          {store.shpNm}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background:
                                store.wnShpRnk === 1
                                  ? 'rgba(255, 215, 0, 0.15)'
                                  : 'rgba(255, 255, 255, 0.1)',
                              color:
                                store.wnShpRnk === 1
                                  ? '#FFD700'
                                  : 'var(--text-dim)',
                              border:
                                store.wnShpRnk === 1
                                  ? '1px solid rgba(255, 215, 0, 0.3)'
                                  : '1px solid transparent',
                            }}
                          >
                            {store.wnShpRnk}등
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(0, 240, 255, 0.1)',
                              color: 'var(--primary-cyan)',
                            }}
                          >
                            {store.atmtPsvYnTxt}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-dim)',
                          lineHeight: '1.4',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '4px',
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
                            style={{ marginTop: '2px', flexShrink: 0 }}
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{store.shpAddr.trim()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'var(--text-dim)',
                  }}
                >
                  해당 지역에 당첨 지점이 없습니다.
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
                textAlign: 'center',
                lineHeight: '1.6',
              }}
            >
              왼쪽 지도에서
              <br />
              원하는 지역을 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
