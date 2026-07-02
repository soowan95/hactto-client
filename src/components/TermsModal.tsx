import React, { useEffect } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
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
            서비스 이용약관
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
            본 약관은 <strong>hactto</strong>(이하 '서비스')가 제공하는 대시보드
            및 IP 기반 제어 시스템의 이용 조건과 절차, 서비스와 이용자 간의 권리
            및 의무 사항을 규정합니다.
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
            1. 약관의 효력 및 변경
          </h3>
          <p style={{ marginBottom: '15px' }}>
            본 약관은 서비스 웹사이트 내에 게시함으로써 효력이 발생합니다.
            서비스는 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수
            있으며, 변경된 약관은 공지사항을 통해 공지됩니다.
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
            2. 서비스 제공 및 이용 제한
          </h3>
          <p style={{ marginBottom: '10px' }}>
            본 서비스는 IP 주소 판별 및 화이트리스트 접근 권한 관리 기능을
            제공합니다.
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              대한민국 외 국가 등 허용되지 않은 비정상적 경로를 통한 접근 시
              서비스 이용이 영구 제한(차단)될 수 있습니다.
            </li>
            <li>
              이용자는 마스터 키 및 세션 정보를 타인에게 양도하거나 부정하게
              사용할 수 없습니다.
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
            3. 결제 및 환불 규정
          </h3>
          <p style={{ marginBottom: '10px' }}>
            서비스 내 충전 수단(HON 크레딧 등) 및 구독 모델의 결제는 PortOne
            브라우저 SDK를 통해 처리됩니다.
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              충전 및 결제 완료된 유료 서비스 항목의 환불 처리는 내부 환불 규정
              및 관계 법령에 따릅니다.
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
            4. 제3자 광고 게재 및 면책 사항
          </h3>
          <p style={{ marginBottom: '15px' }}>
            서비스는 이용자에게 무료 서비스를 원활하게 제공하기 위해 구글
            애드센스 광고를 지면에 배치합니다. 광고 노출 및 광고 클릭으로
            발생하는 제3자 링크 이동 및 거래 행위는 전적으로 해당 광고주와
            이용자 간의 책임이며, 서비스는 이에 관여하거나 책임을 지지 않습니다.
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
            5. 면책조항
          </h3>
          <p style={{ marginBottom: '15px' }}>
            서비스는 천재지변, 서버 점검, 네트워크 장애 등 불가항력적인 상황으로
            인해 일시적으로 서비스를 중단할 수 있으며, 이로 인해 발생한 손실에
            대해 책임을 지지 않습니다.
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
