import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { useAuth } from '../../context/AuthContext';

export const Restore = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('유효하지 않은 접근입니다.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/restore/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || '복원 처리에 실패했습니다.');
        }
        setSuccess(true);
        logout(); // ensure clean state
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, logout]);

  if (loading)
    return (
      <div className="p-10 text-white flex justify-center">복원 처리 중...</div>
    );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md border border-slate-700 text-center shadow-2xl">
        {error ? (
          <>
            <div className="text-red-400 text-lg font-bold mb-4">복원 실패</div>
            <p className="text-slate-300 mb-6">{error}</p>
          </>
        ) : success ? (
          <>
            <div className="text-green-400 text-2xl font-bold mb-4">
              복원 성공!
            </div>
            <p className="text-slate-300 mb-6">
              계정이 성공적으로 복원되었습니다. 이제 다시 로그인하여 서비스를
              이용하실 수 있습니다.
            </p>
          </>
        ) : null}

        <button
          onClick={() => navigate('/home')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};
