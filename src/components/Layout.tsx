import { useState } from 'react';
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '24px',
        width: '100%',
        maxWidth: '1500px',
        margin: '0 auto',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* 좌측 구글 광고 지면 */}
      {!isYearlySubscribed && (
        <div
          className="google-ad-sidebar left-ad"
          style={{
            width: '160px',
            minWidth: '160px',
            height: '600px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px',
            color: 'var(--text-dim)',
            fontSize: '0.8rem',
            textAlign: 'center',
            marginTop: '50px',
            position: 'sticky',
            top: '20px',
            boxSizing: 'border-box',
          }}
        >
          <AdSenseBanner slot="1234567890" format="vertical" />
        </div>
      )}

      <div
        className="access-container"
        style={{ maxWidth: '1080px', width: '100%', flexShrink: 1 }}
      >
        <div
          className="glass-card dashboard-container"
          style={{ textAlign: 'left', padding: '30px 40px' }}
        >
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
              <div
                onClick={() => setShowPaymentModal(true)}
                style={{
                  marginLeft: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                  e.currentTarget.style.boxShadow =
                    '0 0 10px rgba(0, 240, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="크레딧 충전 상점 열기"
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: 'var(--primary-cyan)',
                  }}
                >
                  {subscription && subscription.status === 'ACTIVE'
                    ? 'UNLIMITED'
                    : `${honBalance} HON`}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'var(--primary-cyan)',
                    color: '#0a0b10',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 'bold',
                  }}
                >
                  충전
                </span>
              </div>
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

          <div
            className="admin-tabs"
            style={{
              display: 'flex',
              gap: '5px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
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
      </div>

      {/* 우측 구글 광고 지면 */}
      {!isYearlySubscribed && (
        <div
          className="google-ad-sidebar right-ad"
          style={{
            width: '160px',
            minWidth: '160px',
            height: '600px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px',
            color: 'var(--text-dim)',
            fontSize: '0.8rem',
            textAlign: 'center',
            marginTop: '50px',
            position: 'sticky',
            top: '20px',
            boxSizing: 'border-box',
          }}
        >
          <AdSenseBanner slot="0987654321" format="vertical" />
        </div>
      )}
    </div>
  );
}
