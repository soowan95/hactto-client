import { useApp } from "../context/AppContext";

interface IpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IpRequestModal({ isOpen, onClose }: IpRequestModalProps) {
  const { clientIp, pending, submitting, handleRequestAccess } = useApp();

  if (!isOpen) return null;

  const onRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRequestAccess();
  };

  return (
    <div className="admin-modal-overlay">
      <div
        className="glass-card admin-modal-content"
        style={{ maxWidth: "440px" }}
      >
        {/* Status Icon */}
        <div
          className="status-icon"
          style={{
            background: pending
              ? "rgba(245, 158, 11, 0.1)"
              : "rgba(0, 240, 255, 0.1)",
            border: pending
              ? "1px solid #f59e0b"
              : "1px solid var(--primary-cyan)",
            color: pending ? "#f59e0b" : "var(--primary-cyan)",
            marginBottom: "20px",
          }}
        >
          {pending ? (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ) : (
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        <h2
          className="access-title"
          style={{ fontSize: "1.35rem", marginBottom: "8px" }}
        >
          {pending ? "IP 승인 대기 중" : "접근 권한 제한 안내"}
        </h2>

        <p
          className="access-desc"
          style={{
            fontSize: "0.88rem",
            marginBottom: "20px",
            lineHeight: "1.6",
          }}
        >
          {pending
            ? "귀하의 IP 접근 요청이 현재 관리자 승인 대기열에 등록되어 있습니다. 승인이 완료되면 모든 기능을 이용하실 수 있습니다."
            : "이 기능은 인가된 IP 주소에서만 접근할 수 있습니다. 아래 버튼을 눌러 관리자에게 IP 승인을 요청해 주세요."}
        </p>

        {/* IP Info Block */}
        <div
          className="ip-info"
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <span>접속 IP: </span>
          <span
            className="ip-value"
            style={{
              color: pending ? "#f59e0b" : "var(--primary-cyan)",
              marginLeft: "6px",
            }}
          >
            {clientIp}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          {!pending && (
            <button
              onClick={onRequestSubmit}
              disabled={submitting}
              className="btn-submit"
              style={{
                flex: 1,
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, var(--primary-cyan) 0%, #00b0ff 100%)",
                color: "#030712",
                boxShadow: "0 4px 15px var(--primary-cyan-glow)",
              }}
            >
              {submitting ? "요청 중..." : "승인 요청하기"}
            </button>
          )}
          <button
            type="button"
            className="btn-neon btn-outline"
            style={{
              flex: 1,
              padding: 0,
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: 0,
            }}
            onClick={onClose}
          >
            {pending ? "확인" : "취소"}
          </button>
        </div>
      </div>
    </div>
  );
}
