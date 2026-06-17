import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    honBalance,
    subscription,
    checkIpStatus,
  } = useApp();

  const navigate = useNavigate();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
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
    subscription.status === 'ACTIVE' &&
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
                style={{ fontSize: '1.8rem', cursor: 'pointer' }}
                onClick={() => navigate('/home')}
              >
                hactto
              </span>

              {/* 남은 혼(Hon) 충전 정보 위젯 */}
              {!isMobileOrTablet && (() => {
                const isSubscribed = subscription && subscription.status === 'ACTIVE';
                const isMonthly = isSubscribed && subscription.plan === 'MONTHLY';
                const isYearly = isSubscribed && subscription.plan === 'YEARLY';

                let widgetText = `${honBalance} HON`;
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
                    onClick={() => setShowPaymentModal(true)}
                    style={{
                      marginLeft: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: bgGlow,
                      border: `1px solid ${borderGlow}`,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = themeColor;
                      e.currentTarget.style.background = isMonthly
                        ? 'rgba(168, 85, 247, 0.1)'
                        : isYearly
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(0, 240, 255, 0.1)';
                      e.currentTarget.style.boxShadow = isMonthly
                        ? '0 0 10px rgba(168, 85, 247, 0.3)'
                        : isYearly
                        ? '0 0 10px rgba(234, 179, 8, 0.3)'
                        : '0 0 10px rgba(0, 240, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = borderGlow;
                      e.currentTarget.style.background = bgGlow;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="크레딧 충전 상점 열기"
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: themeColor,
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
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
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

          <div className="admin-tabs">
            <NavLink
              to="/home"
              onClick={(e) => handleTabClick(e, '/home')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              최근 당첨번호
            </NavLink>
            <NavLink
              to="/search"
              onClick={(e) => handleTabClick(e, '/search')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              당첨번호 조회
            </NavLink>
            <NavLink
              to="/stats"
              onClick={(e) => handleTabClick(e, '/stats')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              알고리즘 통계
            </NavLink>
            <NavLink
              to="/analysis-charts"
              onClick={(e) => handleTabClick(e, '/analysis-charts')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              당첨통계 차트
            </NavLink>
            <NavLink
              to="/generate"
              onClick={(e) => handleTabClick(e, '/generate')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              예측번호 분석기
            </NavLink>
            <NavLink
              to="/history"
              onClick={(e) => handleTabClick(e, '/history')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              내 당첨이력
            </NavLink>
            <NavLink
              to="/support"
              onClick={(e) => handleTabClick(e, '/support')}
              className={({ isActive }) =>
                `tab-btn ${isActive ? 'active-tab' : ''}`
              }
            >
              1:1 문의
            </NavLink>
          </div>

          {/* 모바일/태블릿용 가로형 구글 광고 지면 */}
          {!isYearlySubscribed && isMobileOrTablet && (
            <div className="google-ad-horizontal-wrapper">
              <AdSenseBanner
                slot="1234567890"
                format="horizontal"
                responsive="false"
                style={{ display: 'inline-block', width: '100%', height: '74px' }}
              />
            </div>
          )}

          <NoticeBanner />

          <div
            className="scroll-y-container"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '8px',
              marginRight: '-8px',
              minHeight: 0,
              marginBottom: '12px',
            }}
          >
            <Outlet />
          </div>

          <Alert alert={alert} />

          {/* Footer containing Privacy Policy and Terms of Service (Essential for AdSense Approval) */}
          <footer
            style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              flexWrap: 'wrap',
              flexShrink: 0,
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
            <span style={{ opacity: 0.2 }}>|</span>
            <span style={{ opacity: 0.5 }}>
              © {new Date().getFullYear()} hactto. All rights reserved.
            </span>
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
