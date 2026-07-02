import React, { useEffect } from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '90%',
          maxHeight: '80vh',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 30px 20px 30px',
          position: 'relative',
          animation: 'fadeIn 0.3s ease-out',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            className="logo-glow"
            style={{
              fontSize: '1.4rem',
              margin: 0,
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
            }}
          >
            개인정보처리방침
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dim)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="scroll-y-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px',
            fontSize: '0.9rem',
            lineHeight: '1.7',
            color: 'var(--text-dim)',
            textAlign: 'left',
          }}
        >
          <p style={{ marginBottom: '15px' }}>
            본 개인정보처리방침은 <strong>hactto</strong>(이하 '서비스')의
            개인정보 수집, 이용 및 보호에 관한 사항을 설명합니다. 서비스는
            이용자의 개인정보를 보호하고 관련 법령을 준수하기 위해 최선을 다하고
            있습니다.
          </p>

          <h3
            style={{
              fontSize: '1.1rem',
              color: '#ffffff',
              marginTop: '20px',
              marginBottom: '8px',
              fontWeight: '600',
            }}
          >
            1. 수집하는 개인정보 항목 및 수집 방법
          </h3>
          <p>
            서비스는 이용자가 대시보드에 접근하고 시스템을 이용할 때 아래와 같은
            정보를 수집할 수 있습니다.
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              <strong>자동 수집 항목:</strong> 접속 IP 주소, 쿠키, 브라우저
              종류, 운영체제(OS), 서비스 이용 기록, 국가 정보
            </li>
            <li>
              <strong>수집 방법:</strong> 웹사이트 접속 시 자동 로그 및 분석
              시스템을 통한 수집
            </li>
          </ul>

          <h3
            style={{
              fontSize: '1.1rem',
              color: '#ffffff',
              marginTop: '20px',
              marginBottom: '8px',
              fontWeight: '600',
            }}
          >
            2. 개인정보의 수집 및 이용 목적
          </h3>
          <p>수집된 정보는 다음 목적을 위해 활용됩니다.</p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              <strong>접근 제어 및 보안:</strong> IP 기반 접근 통제 및 관리자
              화이트리스트 등록 처리
            </li>
            <li>
              <strong>광고 게재 및 마케팅:</strong> 구글 애드센스(Google
              AdSense)를 통한 광고 노출 및 광고 효과 분석
            </li>
            <li>
              <strong>서비스 개선:</strong> 사용자 패턴 분석을 통한 대시보드
              시스템 최적화
            </li>
          </ul>

          <h3
            style={{
              fontSize: '1.1rem',
              color: '#ffffff',
              marginTop: '20px',
              marginBottom: '8px',
              fontWeight: '600',
            }}
          >
            3. 구글 애드센스(Google AdSense) 쿠키 및 광고 정책 고지
          </h3>
          <p style={{ marginBottom: '10px' }}>
            본 서비스는 제3자 광고 회사인 Google의 광고 서비스를 이용하고
            있습니다.
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              Google을 포함한 제3자 제공업체는 사용자의 이전 웹사이트 방문
              정보를 기반으로 광고를 게재하기 위해 쿠키를 사용합니다.
            </li>
            <li>
              Google의 광고 쿠키를 사용함으로써 Google 및 파트너 업체는 본
              사이트 및 다른 사이트 방문을 토대로 맞춤 광고를 제공할 수
              있습니다.
            </li>
            <li>
              이용자는{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--primary-cyan)',
                  textDecoration: 'underline',
                }}
              >
                Google 광고 설정
              </a>
              으로 이동하여 맞춤 광고 게재를 설정 해제할 수 있습니다.
            </li>
          </ul>

          <h3
            style={{
              fontSize: '1.1rem',
              color: '#ffffff',
              marginTop: '20px',
              marginBottom: '8px',
              fontWeight: '600',
            }}
          >
            4. 개인정보의 보유 및 이용 기간
          </h3>
          <p style={{ marginBottom: '15px' }}>
            이용자의 개인정보는 원칙적으로 수집 및 이용 목적이 달성되면 지체
            없이 파기합니다. 단, 보안 및 IP 차단 이력 관리를 위해 필요한 정보는
            관련 법령 및 서비스 내부 방침에 따라 일정 기간 보관될 수 있습니다.
          </p>

          <h3
            style={{
              fontSize: '1.1rem',
              color: '#ffffff',
              marginTop: '20px',
              marginBottom: '8px',
              fontWeight: '600',
            }}
          >
            5. 이용자의 권리 및 거부 권한
          </h3>
          <p style={{ marginBottom: '15px' }}>
            이용자는 언제든지 브라우저 설정을 통해 쿠키 수집을 거부할 수 있으며,
            이로 인해 대시보드 접근 및 결제 기능 등 일부 서비스 이용에 제한이
            발생할 수 있습니다.
          </p>

          <hr
            style={{
              border: '0',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              margin: '20px 0',
            }}
          />

          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              opacity: 0.6,
            }}
          >
            시행일자: 2026년 6월 30일
          </p>
        </div>
      </div>
    </div>
  );
};
