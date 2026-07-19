import { useState, useEffect } from 'react';
import { SouthKoreaMap } from '../../components/SouthKoreaMap';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';

interface Store {
  id: number;
  episode: number;
  rank: number;
  sortOrder: number;
  shopName: string;
  shopAddress: string;
  purchaseType: string;
  region: string;
  shopLatitude: number | null;
  shopLongitude: number | null;
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
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rankFilter, setRankFilter] = useState<'all' | 1 | 2>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | '자동' | '수동' | '반자동'
  >('all');

  const [latestEpisode, setLatestEpisode] = useState<number | null>(null);
  const [episode, setEpisode] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchLatestEpisode = async () => {
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/winning-numbers/latest`),
        );
        if (res.ok) {
          const data = await res.json();
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
          appendAuth(`${API_BASE_URL}/winning-numbers/${episode}/shops`),
        );
        if (!res.ok) throw new Error('API 요청 실패');

        const data = await res.json();
        const list = data.data || data;

        if (Array.isArray(list)) {
          setStores(list);
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
  }, [episode, appendAuth]);

  const handleLocationClick = (regionId: string, regionName: string) => {
    if (selectedRegion?.id === regionId) {
      setSelectedRegion(null);
      setShowMobileList(false);
    } else {
      setSelectedRegion({ id: regionId, name: regionName });
      if (isMobileOrTablet) {
        setShowMobileList(false);
      } else {
        setShowMobileList(true);
      }
    }
  };

  const filteredStores = selectedRegion
    ? stores.filter((store) => {
        if (store.region !== regionNameMap[selectedRegion.name]) return false;
        if (rankFilter !== 'all' && store.rank !== rankFilter) return false;
        if (typeFilter !== 'all' && store.purchaseType !== typeFilter)
          return false;
        return true;
      })
    : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: '100%',
        padding: '10px 20px',
        gap: '10px',
        overflow: 'hidden',
      }}
    >
      {!isMobileOrTablet && (
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <h2
            style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.3rem' }}
          >
            당첨지점 조회
          </h2>
        </div>
      )}

      <div
        style={{
          width: '100%',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            width: isMobileOrTablet ? '200%' : '100%',
            gap: isMobileOrTablet ? '0' : '20px',
            transform:
              isMobileOrTablet && showMobileList
                ? 'translateX(-50%)'
                : 'translateX(0)',
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Map Area */}
          <div
            style={{
              flex: isMobileOrTablet ? '1 0 50%' : '1.5',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: isMobileOrTablet ? '0' : '16px',
              border: isMobileOrTablet
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.05)',
              padding: isMobileOrTablet ? '8px' : '20px',
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
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'rgba(20, 20, 25, 0.8)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--primary-cyan)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '20px',
                    padding: isMobileOrTablet
                      ? '4px 16px 4px 12px'
                      : '6px 24px 6px 16px',
                    fontSize: isMobileOrTablet ? '0.85rem' : '0.9rem',
                    minWidth: isMobileOrTablet ? '90px' : 'auto',
                    fontWeight: 'bold',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
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
                  <span>제 {episode}회</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 90,
                      }}
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        background: 'rgba(20, 20, 25, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '12px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 100,
                        minWidth: '120px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {latestEpisode &&
                        Array.from(
                          { length: latestEpisode },
                          (_, i) => latestEpisode - i,
                        ).map((ep) => (
                          <div
                            key={ep}
                            onClick={() => {
                              setEpisode(ep);
                              setIsDropdownOpen(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: isMobileOrTablet ? '0.85rem' : '0.9rem',
                              color:
                                ep === episode
                                  ? 'var(--primary-cyan)'
                                  : 'white',
                              cursor: 'pointer',
                              borderBottom:
                                '1px solid rgba(255, 255, 255, 0.05)',
                              textAlign: 'center',
                              background:
                                ep === episode
                                  ? 'rgba(0, 240, 255, 0.1)'
                                  : 'transparent',
                              fontWeight: ep === episode ? 'bold' : 'normal',
                            }}
                          >
                            제 {ep}회
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <SouthKoreaMap
              onLocationClick={handleLocationClick}
              selectedRegionId={selectedRegion?.id}
            />
            {isMobileOrTablet && selectedRegion && !showMobileList && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                }}
              >
                <button
                  onClick={() => setShowMobileList(true)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: '1px solid var(--primary-cyan)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {regionNameMap[selectedRegion.name] || selectedRegion.name}{' '}
                  당첨지점 보기
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* List Area */}
          <div
            style={{
              flex: isMobileOrTablet ? '1 0 50%' : '1',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: isMobileOrTablet ? '0' : '16px',
              border: isMobileOrTablet
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.05)',
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
                    flexWrap: 'wrap',
                    gap: '12px',
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {isMobileOrTablet && (
                      <button
                        onClick={() => {
                          setShowMobileList(false);
                          setSelectedRegion(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          cursor: 'pointer',
                          marginRight: '4px',
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                    )}
                    <h3
                      style={{
                        color: 'var(--primary-cyan)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        fontSize: '1.2rem',
                      }}
                    >
                      {regionNameMap[selectedRegion.name] ||
                        selectedRegion.name}{' '}
                      당첨지점
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
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
                        <option value="all">전체 등수</option>
                        <option value="1">1등</option>
                        <option value="2">2등</option>
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
                        onChange={(e) =>
                          setTypeFilter(
                            e.target.value as
                              | 'all'
                              | '자동'
                              | '수동'
                              | '반자동',
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
                        <option value="all">전체 방식</option>
                        <option value="자동">자동</option>
                        <option value="수동">수동</option>
                        <option value="반자동">반자동</option>
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
                        key={store.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'transform 0.2s, background 0.2s',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          if (store.shopLatitude && store.shopLongitude) {
                            window.open(
                              `https://map.kakao.com/link/map/${store.shopName},${store.shopLatitude},${store.shopLongitude}`,
                              '_blank',
                            );
                          } else {
                            window.open(
                              `https://map.kakao.com/link/search/${encodeURIComponent(store.shopAddress)}`,
                              '_blank',
                            );
                          }
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
                            {store.shopName}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                background:
                                  store.rank === 1
                                    ? 'rgba(255, 215, 0, 0.15)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                color:
                                  store.rank === 1
                                    ? '#FFD700'
                                    : 'var(--text-dim)',
                                border:
                                  store.rank === 1
                                    ? '1px solid rgba(255, 215, 0, 0.3)'
                                    : '1px solid transparent',
                              }}
                            >
                              {store.rank}등
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                background: 'rgba(0, 240, 255, 0.1)',
                                color: 'var(--primary-cyan)',
                              }}
                            >
                              {store.purchaseType}
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
                            <span>{store.shopAddress.trim()}</span>
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
    </div>
  );
}
