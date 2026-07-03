import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Alert } from './Alert';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { HelpModal } from './HelpModal';
import { WelcomeModal } from './WelcomeModal';
import { PaymentModal } from './PaymentModal';
import { NoticeBanner } from './NoticeBanner';
import { AdSenseBanner } from './AdSenseBanner';
import { PrivacyModal } from './PrivacyModal';
import { TermsModal } from './TermsModal';
import { RefundPolicyModal } from './RefundPolicyModal';
import { NicknameModal } from './NicknameModal';

const MENU_GROUPS = [
  {
    title: '당첨 결과',
    items: [
      { path: '/home', label: '최근 당첨번호' },
      { path: '/search', label: '당첨번호 조회' },
    ],
  },
  {
    title: '통계 및 분석',
    items: [
      { path: '/stats', label: '알고리즘 통계' },
      { path: '/analysis-charts', label: '당첨통계 차트' },
    ],
  },
  {
    title: '예측 시스템',
    items: [{ path: '/generate', label: '예측번호 분석기' }],
  },
  {
    title: '마이페이지',
    items: [{ path: '/history', label: '내 당첨이력' }],
  },
  {
    title: '커뮤니티 및 지원',
    items: [
      { path: '/board', label: '게시판' },
      { path: '/support', label: '1:1 문의' },
    ],
  },
];

export function Layout() {
  const {
    alert,
    hasUnsavedWeights,
    showUnsavedModal,
    setShowUnsavedModal,
    setUnsavedActionTarget,
    setShowAdminModal,
    showWelcomeModal,
    setShowWelcomeModal,
    freeHon,
    paidHon,
    subscription,
    checkIpStatus,
    nickname,
    visitorId,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1200);
    };
    handleResize(); // run initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasAdminAccess = !!(
    localStorage.getItem('mk') || sessionStorage.getItem('mk')
  );

  const handleTabClick = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path === '/system' && !hasAdminAccess) {
      e.preventDefault();
      setShowAdminModal(true);
      return;
    }

    if (hasUnsavedWeights) {
      e.preventDefault();
      setUnsavedActionTarget(() => () => {
        navigate(path);
      });
      setShowUnsavedModal(true);
    }
  };

  const isYearlySubscribed =
    subscription &&
    (subscription.status === 'ACTIVE' ||
      (subscription.status === 'CANCELLED' &&
        subscription.endsAt &&
        new Date(subscription.endsAt) > new Date())) &&
    subscription.plan === 'YEARLY';

  return (
    <div className="layout-wrapper">
      {/* 좌측 구글 광고 지면 */}
      {!isYearlySubscribed && !isMobileOrTablet && (
        <div className="google-ad-sidebar left-ad">
          <AdSenseBanner slot="1234567890" format="vertical" />
        </div>
      )}

      <div className="access-container dashboard-main-container">
        <NoticeBanner />
        <div className="glass-card dashboard-container">
          <div
            className="admin-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                className="logo-glow"
                style={{
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  marginRight: '12px',
                }}
                onClick={() => navigate('/home')}
              >
                hactto
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: nickname ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  if (!nickname) setShowNicknameModal(true);
                }}
                onMouseEnter={(e) => {
                  if (!nickname) {
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                    e.currentTarget.style.borderColor =
                      'rgba(0, 240, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!nickname) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }
                }}
                title={!nickname ? '닉네임 설정하기' : undefined}
              >
                <span style={{ fontWeight: 'bold' }}>
                  {nickname || visitorId?.substring(0, 8)}
                </span>
                님
                {!nickname && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-dim)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginLeft: '2px' }}
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* 남은 혼(Hon) 충전 정보 위젯 */}
              {(() => {
                const isSubscribed =
                  subscription &&
                  (subscription.status === 'ACTIVE' ||
                    (subscription.status === 'CANCELLED' &&
                      subscription.endsAt &&
                      new Date(subscription.endsAt) > new Date()));
                const isMonthly =
                  isSubscribed && subscription.plan === 'MONTHLY';
                const isYearly = isSubscribed && subscription.plan === 'YEARLY';

                const totalHon = freeHon + paidHon;
                let widgetText = `${totalHon} HON`;
                const tooltipText = `보유 HON: ${totalHon} (이벤트 무료: ${freeHon} / 충전 유료: ${paidHon})`;
                let badgeText = '충전';
                let themeColor = 'var(--primary-cyan)';
                let bgGlow = 'rgba(0, 240, 255, 0.05)';
                let borderGlow = 'rgba(0, 240, 255, 0.2)';

                if (isMonthly) {
                  widgetText = '월간 무제한';
                  badgeText = '구독';
                  themeColor = 'var(--primary-purple)';
                  bgGlow = 'rgba(168, 85, 247, 0.05)';
                  borderGlow = 'rgba(168, 85, 247, 0.2)';
                } else if (isYearly) {
                  widgetText = '연간 무제한';
                  badgeText = '구독';
                  themeColor = '#eab308';
                  bgGlow = 'rgba(234, 179, 8, 0.05)';
                  borderGlow = 'rgba(234, 179, 8, 0.2)';
                }

                return (
                  <div
                    className="hon-widget"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: bgGlow,
                      border: `1px solid ${borderGlow}`,
                      padding: '6px 12px',
                      borderRadius: '6px',
                    }}
                    title={tooltipText}
                  >
                    {isSubscribed ? (
                      <>
                        <span
                          className="hon-widget-text"
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: themeColor,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {widgetText}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            background: themeColor,
                            color: isYearly ? '#090a0f' : '#0a0b10',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: 'bold',
                          }}
                        >
                          {badgeText}
                        </span>
                      </>
                    ) : (
                      <>
                        {!isMobileOrTablet ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.75rem',
                            }}
                          >
                            <span
                              style={{
                                color: 'var(--text-dim)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              보유 HON:
                            </span>
                            <span
                              style={{ fontWeight: '700', color: '#ffffff' }}
                            >
                              {totalHon}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'rgba(255, 255, 255, 0.3)',
                              }}
                            >
                              |
                            </span>
                            <span
                              style={{
                                color: 'var(--primary-cyan)',
                                opacity: 0.9,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              이벤트 {freeHon}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'rgba(255, 255, 255, 0.3)',
                              }}
                            >
                              |
                            </span>
                            <span
                              style={{
                                color: '#eab308',
                                opacity: 0.9,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              충전 {paidHon}
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{ fontWeight: '700', color: '#ffffff' }}
                            >
                              🪙 {totalHon}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: 'rgba(255, 255, 255, 0.4)',
                              }}
                            >
                              ({freeHon}/{paidHon})
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* 독립된 결제/충전 버튼 - 포트원 환경변수 설정 시에만 노출 */}
              {import.meta.env.VITE_PORTONE_STORE_ID &&
                (import.meta.env.VITE_PORTONE_CHANNEL_KEY ||
                  import.meta.env.VITE_PORTONE_TEST_CHANNEL_KEY) && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      border: '1px solid transparent',
                      backgroundImage:
                        'linear-gradient(rgba(10, 11, 16, 0.85), rgba(10, 11, 16, 0.85)), linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 0 8px rgba(0, 240, 255, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        'translateY(-1px) scale(1.04)';
                      e.currentTarget.style.backgroundImage =
                        'linear-gradient(rgba(0, 240, 255, 0.1), rgba(168, 85, 247, 0.1)), linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)';
                      e.currentTarget.style.boxShadow =
                        '0 0 15px rgba(0, 240, 255, 0.35), 0 0 5px rgba(168, 85, 247, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.backgroundImage =
                        'linear-gradient(rgba(10, 11, 16, 0.85), rgba(10, 11, 16, 0.85)), linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)';
                      e.currentTarget.style.boxShadow =
                        '0 0 8px rgba(0, 240, 255, 0.1)';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      🪙
                    </span>
                    <span
                      style={{
                        background:
                          'linear-gradient(135deg, #00f0ff 0%, #e9d5ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      충전 / 구독
                    </span>
                  </button>
                )}

              <button
                onClick={() => setShowHelpModal(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                  e.currentTarget.style.boxShadow =
                    '0 0 10px rgba(0, 240, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.color = 'var(--text-dim)';
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="로또 분석 용어 사전"
              >
                ?
              </button>
            </div>
          </div>

          <div
            className="admin-tabs"
            style={{ position: 'relative', zIndex: 10 }}
          >
            {MENU_GROUPS.map((group) => {
              const isActive = group.items.some(
                (item) => location.pathname === item.path,
              );

              return (
                <div key={group.title} className="dropdown-container">
                  <div
                    className={`tab-btn dropdown-trigger ${
                      isActive ? 'active-tab' : ''
                    }`}
                  >
                    {group.title}
                  </div>
                  <div className="dropdown-menu">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={(e) => handleTabClick(e, item.path)}
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? 'active-item' : ''}`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 모바일/태블릿용 가로형 구글 광고 지면 */}
          {!isYearlySubscribed && isMobileOrTablet && (
            <div className="google-ad-horizontal-wrapper">
              <AdSenseBanner
                slot="1234567890"
                format="horizontal"
                responsive="false"
                style={{
                  display: 'inline-block',
                  width: '100%',
                  height: '74px',
                }}
              />
            </div>
          )}

          <div
            className="scroll-y-container"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '8px',
              marginRight: '-8px',
              minHeight: 0,
              maxHeight: 'calc(100% - 10px)',
              marginBottom: 0,
            }}
          >
            <Outlet />
          </div>

          <Alert alert={alert} />

          {/* Footer containing Privacy Policy and Terms of Service (Essential for AdSense Approval) */}
          <footer
            style={{
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => setShowPrivacyModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: showPrivacyModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = showPrivacyModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)';
                }}
              >
                개인정보처리방침
              </button>
              <span style={{ opacity: 0.2 }}>|</span>
              <button
                onClick={() => setShowTermsModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: showTermsModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = showTermsModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)';
                }}
              >
                이용약관
              </button>
              <span style={{ opacity: 0.2 }}>|</span>
              <button
                onClick={() => setShowRefundModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: showRefundModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = showRefundModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)';
                }}
              >
                환불 규정
              </button>
            </div>
            <div
              style={{
                textAlign: 'center',
                lineHeight: '1.6',
                opacity: 0.7,
                marginTop: '4px',
              }}
            >
              <span>상호명: 핵또</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>대표자명: 김수완</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>사업자등록번호: 519-18-02415</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>통신판매업신고번호: 없음</span>
              <br />
              <span>
                사업장 소재지: 서울특별시 마포구 와우산로 105, 5층
                261A호(서교동)
              </span>
              <br />
              <span>고객센터 전화번호: 070-8110-8128</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>이메일 주소: hactto95@gmail.com</span>
              <br />
              <span style={{ display: 'block', marginTop: '6px' }}>
                © {new Date().getFullYear()} hactto. All rights reserved.
              </span>
            </div>
          </footer>
        </div>

        <UnsavedChangesModal
          isOpen={showUnsavedModal}
          onClose={() => setShowUnsavedModal(false)}
        />
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        />
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={checkIpStatus}
        />
        <PrivacyModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
        <RefundPolicyModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
        />
        <NicknameModal
          isOpen={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
        />
      </div>

      {/* 우측 구글 광고 지면 */}
      {!isYearlySubscribed && !isMobileOrTablet && (
        <div className="google-ad-sidebar right-ad">
          <AdSenseBanner slot="0987654321" format="vertical" />
        </div>
      )}
    </div>
  );
}
