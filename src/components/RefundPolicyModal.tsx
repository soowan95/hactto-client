import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({
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

  return createPortal(
    <div
      className="admin-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1100 }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '90%',
          maxHeight: '85vh',
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
            hactto 결제 및 환불 규정
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
            hactto 서비스를 이용해 주셔서 감사합니다. hactto의 유료 충전 수단(혼
            단건 충전) 및 무제한 구독 서비스의 결제 취소 및 환불에 관한 세부
            규정은 다음과 같습니다.
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
            1. 혼(Hon) 단건 충전 환불 규정
          </h3>
          <p style={{ marginBottom: '10px' }}>
            구매한 혼(Hon)에 대해서는 환불 요청 시 아래와 같이 위약금 및
            사용분의 정가를 공제한 금액을 환불합니다.
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              <strong>위약금 공제</strong>: 결제 완료된 원래 충전 금액의{' '}
              <strong>10%</strong>를 위약금으로 공제합니다.
            </li>
            <li>
              <strong>사용분 공제</strong>: 사용한 혼의 개수당 정가인{' '}
              <strong>50원</strong>으로 계산하여 차감합니다. (할인 상품 구매
              시에도 동일하게 정가인 50원으로 일괄 적용됩니다.)
            </li>
            <li>
              <strong>환불 금액 산식</strong>:
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '12px',
                  borderRadius: '6px',
                  margin: '10px 0',
                  color: 'var(--primary-cyan)',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  wordBreak: 'keep-all',
                  whiteSpace: 'normal',
                  overflowX: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                환불 금액 = 결제 금액 - (결제 금액 × 10%) - (사용한 혼 개수 ×
                50원)
              </div>
            </li>
            <li>
              <strong>이벤트 혜택 제외</strong>: 가입 이벤트 등으로 무료 지급된
              50 HON은 환불 가능 잔액 산정 시 제외(보호)됩니다. 따라서 보유 중인
              HON 잔액이 50 HON 이하일 경우 환불 계산 결과와 관계없이 환불이
              불가능합니다.
            </li>
            <li>
              <strong>주의 사항</strong>: 위 산식에 따른 계산 결과 환불 잔액이
              0원 이하일 경우 환불 금액은 없는 것으로 처리되며 환불이
              불가능합니다.
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
            2. 무제한 구독권 환불 규정 (월간 및 연간)
          </h3>
          <p style={{ marginBottom: '10px' }}>
            정기 구독 상품(월간 무제한 구독, 연간 무제한 구독)은 구매 즉시
            무제한 분석 권한이 부여되고 시스템 자원이 할당되므로 중도 환불이
            불가능합니다.
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              marginBottom: '15px',
              listStyleType: 'disc',
            }}
          >
            <li>
              <strong>환불 불가 원칙</strong>: 구독권 결제 완료 후에는 환불
              서비스가 제공되지 않습니다.
            </li>
            <li>
              <strong>구독 취소(자동 결제 해지 예약)</strong>: 구독을 계속하고
              싶지 않은 경우, 상점 내 '구독 해지하기' 버튼을 통해 자동 결제를
              해지할 수 있습니다.
            </li>
            <li>
              <strong>잔여 기간 보장</strong>: 구독 해지(취소) 시에도 이미
              결제가 완료된 잔여 이용 기간 동안은 추가 결제 없이 무제한 분석
              서비스를 정상적으로 이용할 수 있으며, 만료일 이후에 자동 결제가
              중지됩니다.
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
            3. 환불 신청 절차
          </h3>
          <p style={{ marginBottom: '15px' }}>
            혼(Hon) 환불 요청은 상단 메뉴의 <strong>1:1 문의</strong> 탭을
            통하여 결제 주문 정보 및 환불 사유를 적어 제출해 주시면 확인 후
            신속하게 처리해 드립니다.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '15px',
            marginTop: '15px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="secondary-btn"
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
