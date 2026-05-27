import React from "react";

interface AdminLoginModalProps {
  isOpen: boolean;
  adminKey: string;
  setAdminKey: (val: string) => void;
  adminError: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminLoginModal({
  isOpen,
  adminKey,
  setAdminKey,
  adminError,
  onClose,
  onSubmit,
}: AdminLoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="glass-card admin-modal-content">
        <h2
          className="access-title"
          style={{ fontSize: "1.3rem", marginBottom: "8px" }}
        >
          관리자 키 인증
        </h2>
        <p
          className="access-desc"
          style={{ fontSize: "0.85rem", marginBottom: "20px" }}
        >
          이 화면은 인가된 관리자만 접근 가능합니다. 관리자 키를 입력하여
          주십시오.
        </p>

        {adminError && (
          <div
            className="alert alert-error"
            style={{
              fontSize: "0.85rem",
              padding: "8px 12px",
              marginTop: "0",
              marginBottom: "16px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "bold" }}>⚠</span>
            <div>{adminError}</div>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <input
            type="password"
            className="input-glow"
            style={{ width: "100%", marginBottom: "16px" }}
            placeholder="Redis Manager Key 입력"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              className="btn-submit"
              style={{ flex: 1, height: "42px" }}
            >
              인증하기
            </button>
            <button
              type="button"
              className="btn-neon btn-outline"
              style={{ flex: 1, padding: 0, height: "42px" }}
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
