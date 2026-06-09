import { useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { API_BASE_URL } from "../utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { visitorId, showAlert } = useApp();
  const [purchasing, setPurchasing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePayment = async (amount: number, orderName: string) => {
    if (purchasing) return;
    try {
      setPurchasing(true);
      const orderId = `order-${crypto.randomUUID()}`;

      // 1. API에 결제 준비 요청
      const readyRes = await fetch(`${API_BASE_URL}/payments/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          amount,
          orderId,
          orderName,
        }),
      });

      if (!readyRes.ok) {
        throw new Error("결제 준비 작업에 실패했습니다.");
      }

      // 2. 포트원 SDK 결제창 열기
      const storeId = import.meta.env.VITE_PORTONE_STORE_ID || "store-61d5f308-410a-42c2-8419-58a435889e47";
      const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY || "channel-key-toss-test";

      if (!window.PortOne) {
        throw new Error("포트원 SDK가 로드되지 않았습니다.");
      }

      const response = await window.PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId: orderId,
        orderName,
        totalAmount: amount,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          fullName: "hactto 방문자",
        },
      });

      if (response.code) {
        throw new Error(`결제창 호출 오류: ${response.message}`);
      }

      // 3. API 결제 승인 요청
      const confirmRes = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentKey: response.paymentId || orderId,
          amount,
        }),
      });

      if (!confirmRes.ok) {
        throw new Error("결제 승인 및 혜택 지급 처리에 실패했습니다.");
      }

      showAlert("success", `${orderName} 상품의 결제가 정상 완료되었습니다!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showAlert("error", err.message || "결제 도중 오류가 발생했습니다.");
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
          width: "90%",
          maxWidth: "960px",
          padding: "35px",
          maxHeight: "85vh",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div>
            <h2 className="title-gradient" style={{ fontSize: "1.6rem", margin: 0 }}>
              hactto 충전 및 구독 상점
            </h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", margin: "5px 0 0 0" }}>
              혼(Hon)을 충전하거나 무제한 이용권을 구독하여 실시간 알고리즘 분석기를 제약 없이 이용해 보세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="secondary-btn"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* 3열 카드 그리드 레이아웃 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            marginTop: "10px",
          }}
        >
          {/* 1번째 열: 혼 단건 충전 카드 (내부에 가로로 긴 미니 카드 3개 포함) */}
          <div
            className="glass-card"
            style={{
              padding: "24px 20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: "450px",
              overflow: "visible",
              maxHeight: "none",
            }}
          >
            <h4 style={{ fontSize: "1.1rem", color: "var(--primary-cyan)", margin: "0 0 8px 0" }}>혼(Hon) 단건 충전</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", margin: "0 0 20px 0" }}>분석 1회 요청 시 1 HON이 차감됩니다.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {/* 1,000원 -> 30혼 가로 미니 카드 */}
              <div
                onClick={() => handlePayment(1000, "30 HON 충전")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-cyan)";
                  e.currentTarget.style.background = "rgba(0, 240, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff" }}>30 HON</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>+ 기본 예측 분석 30회</div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--primary-cyan)" }}>1,000원</div>
              </div>

              {/* 3,000원 -> 100혼 가로 미니 카드 */}
              <div
                onClick={() => handlePayment(3000, "100 HON 충전")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-cyan)";
                  e.currentTarget.style.background = "rgba(0, 240, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff" }}>100 HON</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>+ 기본 예측 분석 100회</div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--primary-cyan)" }}>3,000원</div>
              </div>

              {/* 5,000원 -> 200혼 가로 미니 카드 */}
              <div
                onClick={() => handlePayment(5000, "200 HON 충전")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-cyan)";
                  e.currentTarget.style.background = "rgba(0, 240, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff" }}>200 HON</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>+ 기본 예측 분석 200회</div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--primary-cyan)" }}>5,000원</div>
              </div>
            </div>
          </div>

          {/* 2번째 열: 월간 무제한 이용권 */}
          <div
            className="glass-card"
            style={{
              padding: "24px 20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: "450px",
              overflow: "visible",
              maxHeight: "none",
            }}
          >
            <h4 style={{ fontSize: "1.1rem", color: "var(--primary-purple)", margin: "0 0 8px 0" }}>월간 무제한 구독</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", margin: "0 0 20px 0" }}>
              번거로운 충전 없이 한 달 동안 무제한 분석이 가능합니다.
            </p>
            <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#ffffff", margin: "15px 0" }}>
              12,000 원 <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>/ 월</span>
            </div>
            
            <button
              onClick={() => handlePayment(12000, "월간 무제한 구독")}
              disabled={purchasing}
              className="action-btn"
              style={{
                width: "100%",
                marginTop: "auto",
                background: "linear-gradient(135deg, var(--primary-purple) 0%, #a855f7 100%)",
                border: "none",
              }}
            >
              정기 구독하기
            </button>
          </div>

          {/* 3번째 열: 연간 무제한 이용권 */}
          <div
            className="glass-card"
            style={{
              padding: "24px 20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: "450px",
              overflow: "visible",
              maxHeight: "none",
            }}
          >
            <h4 style={{ fontSize: "1.1rem", color: "var(--primary-purple)", margin: "0 0 8px 0" }}>연간 무제한 구독</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", margin: "0 0 20px 0" }}>
              1년 요금 일시 선결제로 30% 정가 절감 효과를 보실 수 있습니다.
            </p>
            <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#ffffff", margin: "15px 0" }}>
              100,000 원 <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>/ 년</span>
            </div>
            
            <button
              onClick={() => handlePayment(100000, "연간 무제한 구독")}
              disabled={purchasing}
              className="action-btn"
              style={{
                width: "100%",
                marginTop: "auto",
                background: "linear-gradient(135deg, var(--primary-purple) 0%, #a855f7 100%)",
                border: "none",
              }}
            >
              정기 구독하기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
