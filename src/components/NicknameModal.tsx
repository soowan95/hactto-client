/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils';
import { useApp } from '../context/AppContext';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NicknameModal({ isOpen, onClose }: NicknameModalProps) {
  const { visitorId, setNickname } = useApp();
  const [nicknameInput, setNicknameInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNicknameInput('');
      setErrorMsg('');
      setIsAvailable(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!nicknameInput) {
      setIsAvailable(null);
      setErrorMsg('');
      return;
    }

    if (nicknameInput.trim().length < 2 || nicknameInput.trim().length > 20) {
      setErrorMsg('닉네임은 2자 이상 20자 이하로 입력해주세요.');
      setIsAvailable(false);
      return;
    }

    const checkDuplicate = async () => {
      setIsChecking(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/visitor/check-nickname?nickname=${encodeURIComponent(nicknameInput)}`,
        );
        const data = await res.json();
        // check-nickname returns { exists: boolean } or { data: { exists: boolean } }
        const exists =
          data.exists !== undefined ? data.exists : data.data?.exists;
        if (exists) {
          setErrorMsg('이미 사용 중인 닉네임입니다.');
          setIsAvailable(false);
        } else {
          setErrorMsg('');
          setIsAvailable(true);
        }
      } catch {
        setErrorMsg('중복 확인에 실패했습니다.');
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timer);
  }, [nicknameInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || isSubmitting) return;
    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/visitor/nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-id': visitorId,
        },
        body: JSON.stringify({ nickname: nicknameInput }),
      });
      const data = await res.json();
      if (
        res.ok ||
        data.success ||
        data.statusCode === 200 ||
        data.statusCode === 201
      ) {
        setNickname(nicknameInput);
        onClose();
      } else {
        setErrorMsg(data.message || '닉네임 설정에 실패했습니다.');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '400px',
          maxWidth: '90%',
          padding: '24px',
          background: 'var(--bg-main)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary-cyan)' }}>
          닉네임 설정
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            marginBottom: '20px',
          }}
        >
          게시판에서 사용할 닉네임을 설정합니다.
          <br />
          <strong style={{ color: '#ff4b4b' }}>
            최초 1회만 설정 가능하며, 이후 변경할 수 없으므로 신중하게
            결정해주세요.
          </strong>
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="닉네임 입력 (2~20자)"
              className="input-glow"
              maxLength={20}
            />
            {errorMsg && (
              <div
                style={{
                  color: '#ff4b4b',
                  fontSize: '0.75rem',
                  marginTop: '6px',
                }}
              >
                {errorMsg}
              </div>
            )}
            {isAvailable && (
              <div
                style={{
                  color: '#00f0ff',
                  fontSize: '0.75rem',
                  marginTop: '6px',
                }}
              >
                사용 가능한 닉네임입니다! ✨
              </div>
            )}
            {isChecking && (
              <div
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  marginTop: '6px',
                }}
              >
                중복 확인 중...
              </div>
            )}
            <p
              style={{
                color: 'var(--danger-color, #ef5350)',
                fontSize: '0.75rem',
                marginTop: '8px',
              }}
            >
              ※ 욕설 및 은어 사용 시 사전 고지 없이 사이트 이용이 제한될 수
              있습니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
              disabled={!isAvailable || isSubmitting}
              style={{
                flex: 1,
                padding: '10px',
                background:
                  !isAvailable || isSubmitting
                    ? 'rgba(255,255,255,0.1)'
                    : 'var(--primary-cyan)',
                color:
                  !isAvailable || isSubmitting ? 'var(--text-dim)' : '#0f111a',
                border: 'none',
                borderRadius: '6px',
                cursor:
                  !isAvailable || isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {isSubmitting ? '설정 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>

      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              padding: '24px',
              maxWidth: '360px',
              width: '100%',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,165,0,0.3)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              animation: 'zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              textAlign: 'center',
            }}
          >
            <h4
              style={{
                margin: '0 0 16px 0',
                color: 'var(--text-main)',
                fontSize: '1.1rem',
              }}
            >
              <span style={{ color: 'var(--primary-cyan)' }}>
                "{nicknameInput}"
              </span>
              (으)로
              <br />
              닉네임을 설정하시겠습니까?
            </h4>
            <div
              style={{
                background: 'rgba(255,165,0,0.1)',
                border: '1px solid rgba(255,165,0,0.2)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#ffb020',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span style={{ lineHeight: '1.4' }}>
                  주의: 한 번 설정하면 이후 영구적으로 변경할 수 없습니다.
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
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
                type="button"
                onClick={executeSubmit}
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
                설정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
