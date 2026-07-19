/* eslint-disable */
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { API_BASE_URL } from '../utils';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [content, setContent] = useState<string>('불러오는 중...');

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE_URL}/policy/privacy`)
        .then((res) => res.json())
        .then((data) => {
          const resData = data.data;
          setVersions(resData?.versions || []);
          if (resData?.latest) {
            setContent(resData.latest.content);
            setSelectedVersionId(resData.latest.id.toString());
          } else {
            setContent('등록된 내용이 없습니다.');
          }
        })
        .catch(() => setContent('불러오기 실패'));
    }
  }, [isOpen]);

  const handleVersionChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value;
    setSelectedVersionId(id);
    try {
      setContent('불러오는 중...');
      const res = await fetch(`${API_BASE_URL}/policy/privacy/${id}`);
      const data = await res.json();
      setContent(data.data?.content || '내용이 없습니다.');
    } catch (err) {
      setContent('불러오기 실패');
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
            {versions.length > 0 && (
              <select
                value={selectedVersionId}
                onChange={handleVersionChange}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version
                      ? v.version
                      : `v${v.id} (${new Date(v.createdAt).toLocaleDateString()})`}
                  </option>
                ))}
              </select>
            )}
          </div>
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
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />

        {/* Footer */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="action-btn"
            style={{
              padding: '8px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
