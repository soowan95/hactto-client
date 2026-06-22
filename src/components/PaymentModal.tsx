import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../utils';
import type { PaymentStatus } from '../types';
import PortOne from '@portone/browser-sdk/v2';
import { Alert } from './Alert';
import { RefundPolicyModal } from './RefundPolicyModal';
import { UpgradeConfirmModal } from './UpgradeConfirmModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { visitorId, showAlert, alert, subscription, checkIpStatus, paidHon } =
    useApp();
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: PaymentStatus;
    message?: string;
  }>({ status: 'READY' });
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [showUpgradeConfirmModal, setShowUpgradeConfirmModal] =
    useState<boolean>(false);

  const [hasActiveRefund, setHasActiveRefund] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && visitorId) {
      const checkRefundInquiries = async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/visitor/inquiries?type=REFUND`,
          );
          if (res.ok) {
            const result = await res.json();
            const refundList = result.data || [];
            // Check if there's any inquiry where status is PENDING or refundStatus is PROPOSED
            const active = refundList.some(
              (inq: { status: string; refundStatus?: string }) =>
                inq.status === 'PENDING' || inq.refundStatus === 'PROPOSED',
            );
            setHasActiveRefund(active);
          }
        } catch (err) {
          console.error('Failed to check refund inquiries:', err);
        }
      };
      checkRefundInquiries();
    }
  }, [isOpen, visitorId]);

  if (!isOpen) return null;

  const handleCancelSubscription = async () => {
    if (cancelling) return;
    if (
      !window.confirm(
        '정말로 구독을 해지하시겠습니까? 해지 시 다음 결제일부터 자동 결제가 정지됩니다.',
      )
    ) {
      return;
    }
    try {
      setCancelling(true);
      const res = await fetch(`${API_BASE_URL}/payments/subscription/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '구독 해지에 실패했습니다.');
      }
      showAlert(
        'success',
        '정기 구독 해지(예약)가 완료되었습니다. 남은 기간 동안은 정상 이용 가능합니다.',
      );
      await checkIpStatus();
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      showAlert('error', error.message || '구독 해지 중 오류가 발생했습니다.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async (
    amount: number,
    orderName: string,
    bypassConfirm = false,
  ) => {
    if (purchasing) return;

    // 월간 구독 -> 연간 구독 변경 시 확인 메세지 안내
    if (
      !bypassConfirm &&
      amount === 100000 &&
      subscription?.plan === 'MONTHLY' &&
      subscription.status === 'ACTIVE'
    ) {
      setShowUpgradeConfirmModal(true);
      return;
    }

    try {
      setPurchasing(true);
      const orderId = `order-${crypto.randomUUID()}`;

      // 1. API에 결제 준비 요청
      const readyRes = await fetch(`${API_BASE_URL}/payments/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          amount,
          orderId,
          orderName,
        }),
      });

      if (!readyRes.ok) {
        const errJson = await readyRes.json().catch(() => ({}));
        throw new Error(errJson.message || '결제 준비 작업에 실패했습니다.');
      }

      // 2. 포트원 SDK 결제창 또는 빌링키 발급창 열기
      const storeId =
        import.meta.env.VITE_PORTONE_STORE_ID ||
        'store-61d5f308-410a-42c2-8419-58a435889e47';

      const isSubscription = amount === 12000 || amount === 100000;
      setPaymentStatus({ status: 'PENDING' });

      let paymentKey = '';

      if (isSubscription) {
        const channelKey =
          import.meta.env.VITE_PORTONE_BILLING_CHANNEL_KEY ||
          'channel-key-toss-billing-test';

        const billingKeyRes = await PortOne.requestIssueBillingKey({
          storeId,
          channelKey,
          billingKeyMethod: 'CARD',
          issueName: orderName,
          customer: {
            fullName: 'hactto 방문자',
          },
        });

        if (!billingKeyRes) {
          throw new Error(`[PortOne] 빌링키 발급창 호출 오류`);
        }

        if (billingKeyRes.code !== undefined) {
          await fetch(`${API_BASE_URL}/payments/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              failReason: billingKeyRes.message || '빌링키 발급 실패',
            }),
          }).catch((e) => console.error('Failed to log payment failure:', e));

          setPaymentStatus({
            status: 'FAILED',
            message: billingKeyRes.message,
          });
          showAlert(
            'error',
            billingKeyRes.message || '빌링키 발급에 실패했습니다.',
          );
          return;
        }

        paymentKey = billingKeyRes.billingKey;
      } else {
        const channelKey =
          import.meta.env.VITE_PORTONE_CHANNEL_KEY || 'channel-key-toss-test';

        const payment = await PortOne.requestPayment({
          storeId,
          channelKey,
          paymentId: orderId,
          orderName,
          totalAmount: amount,
          currency: 'CURRENCY_KRW',
          payMethod: 'CARD',
          customer: {
            fullName: 'hactto 방문자',
          },
        });

        if (!payment) {
          throw new Error(`[PortOne] 결제창 호출 오류`);
        }

        if (payment.code !== undefined) {
          await fetch(`${API_BASE_URL}/payments/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              failReason: payment.message || '결제 실패',
            }),
          }).catch((e) => console.error('Failed to log payment failure:', e));

          setPaymentStatus({
            status: 'FAILED',
            message: payment.message,
          });
          showAlert('error', payment.message || '결제에 실패했습니다.');
          return;
        }

        paymentKey = payment.paymentToken || payment.paymentId || orderId;
      }

      // 3. API 결제 승인 요청
      const confirmRes = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentKey,
          amount,
        }),
      });

      if (confirmRes.ok) {
        const paymentComplete = await confirmRes.json();
        setPaymentStatus({
          status: paymentComplete.status as PaymentStatus,
        });
      } else {
        setPaymentStatus({
          status: 'FAILED',
          message: await confirmRes.text(),
        });
      }

      showAlert('success', `${orderName} 상품의 결제가 정상 완료되었습니다!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      showAlert('error', error.message || '결제 도중 오류가 발생했습니다.');
      setPaymentStatus({ status: 'FAILED', message: error.message });
    } finally {
      setPurchasing(false);
    }
  };

  return createPortal(
    <div
      className="admin-modal-overlay"
      style={{
        zIndex: 1000,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '90%',
          maxWidth: '960px',
          padding: '35px',
          maxHeight: '85vh',
          overflow: 'hidden',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {/* 결제 진행 중 오버레이 */}
        {paymentStatus.status === 'PENDING' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(10, 11, 16, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 100,
              borderRadius: 'inherit',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(0, 240, 255, 0.1)',
                borderTopColor: 'var(--primary-cyan)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '18px',
              }}
            />
            <p
              style={{
                color: '#ffffff',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                fontSize: '1.1rem',
              }}
            >
              결제 요청 확인 중...
            </p>
            <p
              style={{
                color: 'var(--text-dim)',
                fontSize: '0.85rem',
                margin: 0,
              }}
            >
              결제창에서 결제 완료 시 자동으로 화면이 전환됩니다.
            </p>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '25px',
          }}
        >
          <div>
            <h2
              className="title-gradient"
              style={{ fontSize: '1.6rem', margin: 0 }}
            >
              hactto 충전 및 구독 상점
            </h2>
            <p
              style={{
                color: 'var(--text-dim)',
                fontSize: '0.85rem',
                margin: '5px 0 0 0',
              }}
            >
              혼(Hon)을 충전하거나 무제한 이용권을 구독하여 실시간 알고리즘
              분석기를 제약 없이 이용해 보세요.
            </p>
            <p
              style={{
                color: '#ef4444',
                fontSize: '0.72rem',
                margin: '4px 0 0 0',
                opacity: 0.85,
              }}
            >
              ※ 모든 환불 및 취소 요청은{' '}
              <span
                onClick={() => setShowRefundModal(true)}
                style={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  color: 'var(--primary-cyan)',
                  fontWeight: '600',
                }}
              >
                hactto 환불 규정
              </span>
              에 따라 처리됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="secondary-btn"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {alert && (
          <div style={{ marginBottom: '20px' }}>
            <Alert alert={alert} />
          </div>
        )}

        {hasActiveRefund && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⚠️ 진행 중인 환불 문의 또는 최종 수락 대기 중인 환불 건이 있어 추가
            결제 및 구독 신청이 제한됩니다.
          </div>
        )}

        {subscription?.status === 'ACTIVE' && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              color: '#60a5fa',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ℹ️ 현재 {subscription.plan === 'YEARLY' ? '연간' : '월간'} 무제한
            구독이 활성화되어 있어 HON 추가 결제가 불가능합니다.
            {subscription.plan === 'YEARLY' &&
              ' (연간 구독 중에는 월간 구독 결제도 불가합니다)'}
          </div>
        )}

        {subscription?.status !== 'ACTIVE' && paidHon > 0 && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '8px',
              color: '#facc15',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            💡 보유하고 계신 충전/유료 HON({paidHon} HON)은 정기 구독을
            취소/만료하신 후에 언제든 다시 이어서 이용하실 수 있습니다.
          </div>
        )}

        {/* 3열 카드 그리드 레이아웃 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginTop: '10px',
          }}
        >
          {/* 1번째 열: 혼 단건 충전 카드 (내부에 가로로 긴 미니 카드 3개 포함) */}
          <div
            className="glass-card"
            style={{
              padding: '24px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '450px',
              overflow: 'visible',
              maxHeight: 'none',
            }}
          >
            <h4
              style={{
                fontSize: '1.1rem',
                color: 'var(--primary-cyan)',
                margin: '0 0 8px 0',
              }}
            >
              혼(Hon) 단건 충전
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
              }}
            >
              {/* 1,000원 -> 30혼 가로 미니 카드 */}
              <div
                onClick={() =>
                  !hasActiveRefund &&
                  subscription?.status !== 'ACTIVE' &&
                  handlePayment(1000, '30 HON 충전')
                }
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  cursor:
                    hasActiveRefund || subscription?.status === 'ACTIVE'
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  opacity:
                    hasActiveRefund || subscription?.status === 'ACTIVE'
                      ? 0.4
                      : 1,
                }}
                onMouseEnter={(e) => {
                  if (hasActiveRefund || subscription?.status === 'ACTIVE')
                    return;
                  e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (hasActiveRefund || subscription?.status === 'ACTIVE')
                    return;
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      color: '#ffffff',
                    }}
                  >
                    30 HON
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-dim)',
                      marginTop: '2px',
                    }}
                  >
                    1HON당 약 33.3원
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-cyan)',
                  }}
                >
                  1,000원
                </div>
              </div>

              {/* 3,000원 -> 100혼 가로 미니 카드 */}
              <div
                onClick={() =>
                  !hasActiveRefund &&
                  subscription?.status !== 'ACTIVE' &&
                  handlePayment(3000, '100 HON 충전')
                }
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  cursor:
                    hasActiveRefund || subscription?.status === 'ACTIVE'
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  opacity:
                    hasActiveRefund || subscription?.status === 'ACTIVE'
                      ? 0.4
                      : 1,
                }}
                onMouseEnter={(e) => {
                  if (hasActiveRefund || subscription?.status === 'ACTIVE')
                    return;
                  e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (hasActiveRefund || subscription?.status === 'ACTIVE')
                    return;
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      color: '#ffffff',
                    }}
                  >
                    100 HON
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-dim)',
                      marginTop: '2px',
                    }}
                  >
                    1HON당 30원 (추천)
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-cyan)',
                  }}
                >
                  3,000원
                </div>
              </div>

              {/* 5,000원 -> 200혼 가로 미니 카드 */}
              <div
                onClick={() =>
                  !hasActiveRefund &&
                  subscription?.status !== 'ACTIVE' &&
                  handlePayment(5000, '200 HON 충전')
                }
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  cursor:
                    hasActiveRefund || subscription?.status === 'ACTIVE'
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  opacity:
                    hasActiveRefund || subscription?.status === 'ACTIVE'
                      ? 0.4
                      : 1,
                }}
                onMouseEnter={(e) => {
                  if (hasActiveRefund || subscription?.status === 'ACTIVE')
                    return;
                  e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (hasActiveRefund || subscription?.status === 'ACTIVE')
                    return;
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      color: '#ffffff',
                    }}
                  >
                    200 HON
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-dim)',
                      marginTop: '2px',
                      fontWeight: '600',
                    }}
                  >
                    1HON당 25원 (최대 할인! 🔥)
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-cyan)',
                  }}
                >
                  5,000원
                </div>
              </div>
            </div>
          </div>

          {/* 2번째 열: 월간 무제한 이용권 */}
          <div
            className="glass-card"
            style={{
              padding: '24px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '450px',
              overflow: 'visible',
              maxHeight: 'none',
            }}
          >
            <h4
              style={{
                fontSize: '1.1rem',
                color: 'var(--primary-purple)',
                margin: '0 0 8px 0',
              }}
            >
              월간 무제한 구독
            </h4>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                margin: '0 0 14px 0',
              }}
            >
              번거로운 충전 없이 한 달 동안 무제한 분석이 가능합니다.
            </p>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '15px',
                textAlign: 'left',
              }}
            >
              <div
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <span style={{ color: 'var(--primary-purple)' }}>✓</span>
                <span>실시간 알고리즘 무제한 분석</span>
              </div>
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '15px 0',
              }}
            >
              12,000 원{' '}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                / 월
              </span>
            </div>

            {subscription?.plan === 'MONTHLY' &&
            subscription.status === 'ACTIVE' ? (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  padding: '14px 24px',
                  borderRadius: '50px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                구독 해지하기 ⚠️
              </button>
            ) : subscription?.plan === 'MONTHLY' &&
              subscription.status === 'CANCELLED' ? (
              <div
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-dim)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  lineHeight: '1.4',
                }}
              >
                <div>해지 예약 완료</div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    marginTop: '4px',
                    opacity: 0.8,
                  }}
                >
                  만료 예정일:{' '}
                  {subscription.endsAt
                    ? new Date(subscription.endsAt).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => handlePayment(12000, '월간 무제한 구독')}
                disabled={
                  purchasing ||
                  hasActiveRefund ||
                  (subscription?.status === 'ACTIVE' &&
                    subscription?.plan === 'YEARLY')
                }
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  background:
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'linear-gradient(135deg, var(--primary-purple) 0%, #a855f7 100%)',
                  color:
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                      ? 'var(--text-dim)'
                      : '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  padding: '14px 24px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor:
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                      ? 'none'
                      : '0 4px 20px rgba(168, 85, 247, 0.35)',
                  transition: 'all 0.2s ease-in-out',
                  opacity:
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                      ? 0.5
                      : 1,
                }}
                onMouseEnter={(e) => {
                  if (
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                  )
                    return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 30px rgba(168, 85, 247, 0.55)';
                }}
                onMouseLeave={(e) => {
                  if (
                    hasActiveRefund ||
                    (subscription?.status === 'ACTIVE' &&
                      subscription?.plan === 'YEARLY')
                  )
                    return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 20px rgba(168, 85, 247, 0.35)';
                }}
              >
                월간 무제한 시작하기 ⚡
              </button>
            )}
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginTop: '10px',
                textAlign: 'center',
                marginBottom: 0,
              }}
            >
              ※ 언제든 자유롭게 해지할 수 있어요
            </p>
          </div>

          {/* 3번째 열: 연간 무제한 이용권 */}
          <div
            className="glass-card"
            style={{
              position: 'relative',
              padding: '24px 20px',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              background: 'rgba(234, 179, 8, 0.015)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '450px',
              overflow: 'visible',
              maxHeight: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid #eab308',
                color: '#eab308',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                padding: '3px 8px',
                borderRadius: '20px',
                boxShadow: '0 0 10px rgba(234, 179, 8, 0.2)',
                letterSpacing: '0.5px',
              }}
            >
              BEST
            </div>

            <h4
              style={{
                fontSize: '1.1rem',
                color: '#eab308',
                margin: '0 0 8px 0',
              }}
            >
              연간 무제한 구독
            </h4>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                margin: '0 0 14px 0',
              }}
            >
              1년 요금 일시 선결제로 30% 정가 절감 효과를 보실 수 있습니다.
            </p>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '15px',
                textAlign: 'left',
              }}
            >
              <div
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <span style={{ color: '#eab308' }}>✓</span>
                <span>실시간 알고리즘 무제한 분석 (1년)</span>
              </div>
              <div
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <span style={{ color: '#eab308' }}>✓</span>
                <span style={{ fontWeight: '600' }}>광고 제거 ✨</span>
              </div>
            </div>
            <div
              style={{
                margin: '15px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '1.05rem',
                    textDecoration: 'line-through',
                    color: 'var(--text-dim)',
                    fontWeight: 'normal',
                  }}
                >
                  120,000 원
                </span>
                <span
                  style={{
                    color: '#eab308',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                  }}
                >
                  ➔
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                }}
              >
                <span>100,000 원</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  / 년
                </span>
              </div>
            </div>

            {subscription?.plan === 'YEARLY' &&
            subscription.status === 'ACTIVE' ? (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  padding: '14px 24px',
                  borderRadius: '50px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                구독 해지하기 ⚠️
              </button>
            ) : subscription?.plan === 'YEARLY' &&
              subscription.status === 'CANCELLED' ? (
              <div
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-dim)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  lineHeight: '1.4',
                }}
              >
                <div>해지 예약 완료</div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    marginTop: '4px',
                    opacity: 0.8,
                  }}
                >
                  만료 예정일:{' '}
                  {subscription.endsAt
                    ? new Date(subscription.endsAt).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => handlePayment(100000, '연간 무제한 구독')}
                disabled={purchasing || hasActiveRefund}
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  background: hasActiveRefund
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  color: hasActiveRefund ? 'var(--text-dim)' : '#090a0f',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  padding: '14px 24px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: hasActiveRefund ? 'not-allowed' : 'pointer',
                  boxShadow: hasActiveRefund
                    ? 'none'
                    : '0 4px 20px rgba(234, 179, 8, 0.35)',
                  transition: 'all 0.2s ease-in-out',
                  opacity: hasActiveRefund ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (hasActiveRefund) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 30px rgba(234, 179, 8, 0.55)';
                }}
                onMouseLeave={(e) => {
                  if (hasActiveRefund) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 20px rgba(234, 179, 8, 0.35)';
                }}
              >
                연간 패스로 30% 절약하기 🚀
              </button>
            )}
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginTop: '10px',
                textAlign: 'center',
                marginBottom: 0,
              }}
            >
              ※ 언제든 자유롭게 해지할 수 있어요
            </p>
          </div>
        </div>
        <RefundPolicyModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
        />
        <UpgradeConfirmModal
          isOpen={showUpgradeConfirmModal}
          onClose={() => setShowUpgradeConfirmModal(false)}
          onConfirm={() => {
            setShowUpgradeConfirmModal(false);
            handlePayment(100000, '연간 무제한 구독', true);
          }}
          subscriptionEndsAt={subscription?.endsAt}
        />
      </div>
    </div>,
    document.body,
  );
}
