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
import { UserDetailModal } from './UserDetailModal';

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
    subscription,
    checkIpStatus,
    nickname,
    visitorId,
    isAdminMode,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<
    'HON' | 'SUBSCRIPTION' | undefined
  >();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  useEffect(() => {
    if (visitorId) {
      fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/visitor/notifications/unread-count`,
        {
          headers: { 'x-visitor-id': visitorId },
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setUnreadNotiCount(data.data.count);
        })
        .catch(console.error);
    }
  }, [visitorId, showUserDetailModal]); // refetch when modal closes

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
              {!isAdminMode && (
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
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setShowUserDetailModal(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                    e.currentTarget.style.borderColor =
                      'rgba(0, 240, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                  title={'프로필 및 알림 보기'}
                >
                  <span style={{ fontWeight: 'bold' }}>
                    {nickname || visitorId?.substring(0, 8)}
                  </span>
                  님
                  {unreadNotiCount > 0 && (
                    <div
                      style={{
                        background: '#ff4b4b',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        marginLeft: '4px',
                      }}
                    >
                      {unreadNotiCount}
                    </div>
                  )}
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
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              const filteredItems = isAdminMode
                ? group.items.filter(
                    (item) =>
                      item.path !== '/generate' &&
                      item.path !== '/history' &&
                      item.path !== '/support',
                  )
                : group.items;

              if (filteredItems.length === 0) return null;

              const isActive = filteredItems.some(
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
                    {filteredItems.map((item) => (
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

            {isAdminMode && (
              <div className="dropdown-container">
                <div
                  className={`tab-btn dropdown-trigger ${
                    location.pathname === '/system' ? 'active-tab' : ''
                  }`}
                  style={{
                    color: '#FFD700',
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                  }}
                >
                  관리자
                </div>
                <div className="dropdown-menu">
                  <NavLink
                    to="/system"
                    onClick={(e) => handleTabClick(e, '/system')}
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? 'active-item' : ''}`
                    }
                    style={{ color: '#FFD700', fontWeight: 'bold' }}
                  >
                    대시보드
                  </NavLink>
                </div>
              </div>
            )}
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
          initialHighlight={paymentTarget}
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
        <UserDetailModal
          isOpen={showUserDetailModal}
          onClose={() => setShowUserDetailModal(false)}
          openPaymentModal={(target) => {
            setPaymentTarget(target);
            setShowPaymentModal(true);
          }}
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
