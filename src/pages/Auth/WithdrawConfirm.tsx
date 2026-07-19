import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { useAuth } from '../../context/AuthContext';

export const WithdrawConfirm = () => {
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

    fetch(`${API_BASE_URL}/auth/withdraw/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || '탈퇴 처리에 실패했습니다.');
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
      <div className="p-10 text-white flex justify-center">탈퇴 처리 중...</div>
    );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md border border-slate-700 text-center shadow-2xl">
        {error ? (
          <>
            <div className="text-red-400 text-lg font-bold mb-4">탈퇴 실패</div>
            <p className="text-slate-300 mb-6">{error}</p>
          </>
        ) : success ? (
          <>
            <div className="text-green-400 text-2xl font-bold mb-4">
              탈퇴 완료
            </div>
            <p className="text-slate-300 mb-4">
              계정이 성공적으로 탈퇴 처리되었습니다.
            </p>
            <div className="bg-slate-700 p-4 rounded text-sm text-slate-300 mb-6 text-left">
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  탈퇴한 날로부터 <strong>1년간</strong> 탈퇴 유예 기간이
                  주어집니다.
                </li>
                <li>
                  이메일 인증을 통해 1년 내에 언제든 계정을 복원할 수 있습니다.
                </li>
                <li>
                  1년이 경과하면 모든 데이터가 완전히 삭제되며 복원이
                  불가능합니다.
                </li>
              </ul>
            </div>
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
