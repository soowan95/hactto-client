/* eslint-disable */
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { API_BASE_URL } from '../utils';
import { Alert } from './Alert';
import type { AlertState } from '../types';

export const AdminPolicyManagement: React.FC = () => {
  const [policyType, setPolicyType] = useState('privacy');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('new');

  const showAlert = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setAlert({ text: message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/policy/${policyType}`);
      if (res.ok) {
        const data = await res.json();
        const resData = data.data;
        if (resData?.versions) {
          setVersions(resData.versions);
        } else {
          setVersions([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    handleReset();
  }, [policyType]);

  const loadVersion = async (id: string) => {
    setSelectedVersionId(id);
    if (id === 'new') {
      handleReset();
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/policy/${policyType}/${id}`);
      if (res.ok) {
        const data = await res.json();
        const policy = data.data;
        if (policy) {
          setVersion(policy.version || '');
          setContent(policy.content || '');
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('내용을 불러오는데 실패했습니다.', 'error');
    }
  };

  const handleReset = () => {
    setSelectedVersionId('new');
    setVersion('');
    setContent('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) return showAlert('내용을 입력하세요.', 'error');

    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const mk = sessionStorage.getItem('mk') || '';

    try {
      const isNew = selectedVersionId === 'new';
      const url = isNew
        ? `${API_BASE_URL}/policy/${policyType}?mk=${encodeURIComponent(mk)}`
        : `${API_BASE_URL}/policy/${policyType}/${selectedVersionId}?mk=${encodeURIComponent(mk)}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          version,
          content,
        }),
      });

      if (res.ok) {
        showAlert(
          isNew ? '성공적으로 저장되었습니다.' : '성공적으로 수정되었습니다.',
          'success',
        );
        handleReset();
        fetchHistory();
      } else {
        showAlert('저장에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async () => {
    if (selectedVersionId === 'new') return;
    if (!confirm('정말로 이 정책 버전을 삭제하시겠습니까?')) return;

    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const mk = sessionStorage.getItem('mk') || '';

    try {
      const res = await fetch(
        `${API_BASE_URL}/policy/${policyType}/${selectedVersionId}?mk=${encodeURIComponent(mk)}`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (res.ok) {
        showAlert('성공적으로 삭제되었습니다.', 'success');
        handleReset();
        fetchHistory();
      } else {
        showAlert('삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div
      style={{
        color: 'var(--text-main)',
        padding: '20px',
        position: 'relative',
      }}
    >
      <Alert alert={alert} />
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-cyan)' }}>
        약관 및 정책 관리
      </h3>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
        <div>
          <label style={{ marginRight: '10px' }}>정책 종류:</label>
          <select
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            <option value="privacy">개인정보처리방침</option>
            <option value="terms">이용약관</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '10px' }}>버전 선택:</label>
          <select
            value={selectedVersionId}
            onChange={(e) => loadVersion(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            <option value="new">-- 새 버전 작성 --</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id.toString()}>
                {v.version || `버전 ${v.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '10px' }}>버전 명 (선택):</label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="예: v1.1 또는 2026.07.15 시행"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            padding: '8px',
            borderRadius: '4px',
            width: '250px',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          본문 (HTML 지원):
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            height: '400px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            padding: '12px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            lineHeight: '1.5',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSubmit}
          style={{
            background: 'var(--primary-cyan)',
            color: '#000',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {selectedVersionId === 'new' ? '새 버전 등록' : '수정'}
        </button>

        {selectedVersionId !== 'new' && (
          <button
            onClick={handleDelete}
            style={{
              background: '#ff4b4b',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            삭제
          </button>
        )}
      </div>

      <div style={{ marginTop: '40px' }}>
        <h4>미리보기 (XSS 방어 적용)</h4>
        <div
          style={{
            marginTop: '10px',
            padding: '20px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            minHeight: '100px',
            maxHeight: '600px',
            overflowY: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </div>
    </div>
  );
};
