import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAuthModal({ isOpen, onClose }: AdminAuthModalProps) {
  const {
    adminKey,
    setAdminKey,
    adminError,
    setAdminError,
    loadAdminData,
    showAlert,
    isAdminMode,
  } = useApp();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAdminKey('');
      setAdminError('');
      // focus input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen, setAdminKey, setAdminError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAdminError('관리자 키를 입력하세요.');
      return;
    }
    try {
      await loadAdminData(adminKey);
      showAlert('success', '관리자 인증에 성공했습니다.');
      onClose();
    } catch {
      // error is handled by AppContext / loadAdminData
    }
  };

  if (!isOpen) return null;
  if (isAdminMode) {
    onClose();
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '360px',
          padding: '24px',
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: 0,
            color: 'var(--primary-cyan)',
            fontSize: '1.2rem',
          }}
        >
          관리자 인증
        </h3>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          OTP (관리자 키)를 입력해주세요.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <input
              ref={inputRef}
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin Key"
              className="input-glow"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            {adminError && (
              <div
                style={{
                  color: '#ff4b4b',
                  fontSize: '0.75rem',
                  marginTop: '6px',
                }}
              >
                {adminError}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-dim)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--primary-cyan)',
                color: '#0f111a',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              인증
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
