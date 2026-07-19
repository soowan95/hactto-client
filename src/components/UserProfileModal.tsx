import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../utils';
import { authFetch } from '../context/AuthContext';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

interface UserProfile {
  nickname: string;
  avatarUrl: string | null;
  winningStats: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/user/profile/${userId}`);
        const data = await res.json();
        if (data.statusCode === 200 || data.data) {
          setProfile(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
          color: 'var(--text-main)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
        >
          &times;
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            로딩 중...
          </div>
        ) : profile ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: profile.avatarUrl
                  ? `url(${profile.avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              {!profile.avatarUrl && profile.nickname.substring(0, 1)}
            </div>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.2rem' }}>
              {profile.nickname}님의 정보
            </h2>

            <div
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '1rem',
                  color: 'var(--primary-cyan)',
                }}
              >
                당첨 기록
              </h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div
                    key={rank}
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{rank}등 당첨</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {
                        profile.winningStats[
                          rank as keyof UserProfile['winningStats']
                        ]
                      }
                      회
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            유저 정보를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
