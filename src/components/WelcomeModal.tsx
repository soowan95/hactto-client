import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils';
import { useApp } from '../context/AppContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [step, setStep] = useState(1);
  const [showHonTooltip, setShowHonTooltip] = useState(false);
  const { checkIpStatus } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConsentSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/visitor/register`, {
        method: 'POST',
      });
      // 중복 등록 등으로 API가 에러를 반환하더라도 클라이언트 단에서는 동의 상태를 로컬 저장소에 저장하여 모달 루프를 방지합니다.
      localStorage.setItem('hactto_welcome_consented', 'true');
      onClose();

      // 첫 방문 HON 충전이 반영되도록 IP/HON 상태를 즉시 갱신합니다.
      await checkIpStatus(true);

      if (!res.ok) {
        console.warn('Visitor registration status warning:', res.status);
      }
    } catch (err) {
      console.error('Error registering visitor:', err);
      // 에러 발생 시에도 유저가 서비스를 이용할 수 있도록 동의 처리 후 닫습니다.
      localStorage.setItem('hactto_welcome_consented', 'true');
      onClose();
      await checkIpStatus(true);
    }
  };

  return (
    <div
      className="admin-modal-overlay"
      style={{
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        background: 'rgba(3, 7, 18, 0.85)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '520px',
          width: '90%',
          padding: '32px 40px',
          position: 'relative',
          animation: 'fadeIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Step Indicator Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background:
                  s === step
                    ? 'var(--primary-cyan)'
                    : 'rgba(255, 255, 255, 0.15)',
                boxShadow: s === step ? '0 0 8px var(--primary-cyan)' : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Modal Body Content */}
        <div
          style={{
            flex: 1,
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div
                style={{
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.15)',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-cyan)',
                  fontSize: '1.8rem',
                  margin: '0 auto 16px',
                }}
              >
                👋
              </div>
              <h2
                className="access-title"
                style={{
                  fontSize: '1.35rem',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                hactto 방문을 환영합니다!
              </h2>
              <p
                className="access-desc"
                style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                차세대 로또 분석 플랫폼{' '}
                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                  hactto
                </span>
                에 오신 것을 환영합니다.
                <br />
                <br />
                저희는 고도화된 통계 알고리즘에 기초하여
                <br />
                로또 번호 데이터 트렌드를 정교하게 분석합니다.
                <br />
                <br />
                <span
                  style={{ color: 'var(--primary-purple)', fontWeight: 'bold' }}
                >
                  ⚠️ 주의사항
                </span>
                <br />
                추천되는 번호는 특정 알고리즘에 기초하여 도출된 통계적 추천
                번호일 뿐이며,{' '}
                <strong
                  style={{ color: '#ffffff', textDecoration: 'underline' }}
                >
                  실제 로또 당첨 결과와는 완전히 무관
                </strong>
                합니다.
              </p>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div
                style={{
                  background: 'rgba(189, 0, 255, 0.05)',
                  border: '1px solid rgba(189, 0, 255, 0.15)',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-purple)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '0 auto 16px',
                  boxShadow: '0 0 10px rgba(189, 0, 255, 0.2)',
                }}
              >
                ?
              </div>
              <h2
                className="access-title"
                style={{
                  fontSize: '1.35rem',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                로또 분석 용어 사전 가이드
              </h2>
              <p
                className="access-desc"
                style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                대시보드 우측 상단을 보시면 작은 물음표(
                <span
                  style={{
                    display: 'inline-flex',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    margin: '0 4px',
                  }}
                >
                  ?
                </span>
                ) 버튼이 있습니다.
                <br />
                <br />
                해당 버튼을 클릭하면 분석에서 활발히 사용되는{' '}
                <span
                  style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}
                >
                  총합, AC값, 저고 비율, 동끝수, 소수
                </span>{' '}
                등 다양한 통계 지표와 개념에 대한 상세한 해설을 언제든지
                읽어보실 수 있습니다.
              </p>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div
                style={{
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.15)',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-cyan)',
                  fontSize: '1.5rem',
                  margin: '0 auto 16px',
                }}
              >
                🔮
              </div>
              <h2
                className="access-title"
                style={{
                  fontSize: '1.35rem',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                예측 번호 생성 가이드
              </h2>
              <div
                className="access-desc"
                style={{
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                }}
              >
                <ol
                  style={{
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <li>
                    <strong style={{ color: '#ffffff' }}>가중치 설정 ⚙️</strong>
                    <br />
                    예측번호 분석기 메뉴에서 각 통계 규칙별로
                    <br />
                    본인이 중요하게 생각하는 가중치를 미세 조절합니다.
                  </li>
                  <li>
                    <strong style={{ color: '#ffffff' }}>
                      추천 번호 생성 🔮
                    </strong>
                    <br />
                    가중치가 설정되면 분석 시스템이 자동으로
                    <br />
                    최적의 예측 번호 조합들을 실시간 계산하여 출력해 줍니다.
                  </li>
                  <li>
                    <strong style={{ color: '#ffffff' }}>
                      내 당첨 이력 기록 📂
                    </strong>
                    <br />
                    추천받은 시뮬레이션 조합들의 과거 당첨 여부를 조회하고,
                    <br />내 당첨 이력 탭에 저장해 보관할 수 있습니다.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div
                style={{
                  background: 'rgba(56, 142, 60, 0.08)',
                  border: '1px solid #388e3c',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#66bb6a',
                  fontSize: '1.6rem',
                  margin: '0 auto 16px',
                }}
              >
                🔒
              </div>
              <h2
                className="access-title"
                style={{
                  fontSize: '1.35rem',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                개인정보 안내 및 동의
              </h2>
              <p
                className="access-desc"
                style={{
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                • 저희 서비스는 이용자분들의 개인정보 보호를 최우선으로 여기며,
                <br />
                로그인 없이 IP 주소 기반의 <strong>식별자(Visitor ID)</strong>
                만을 이용해 안전하게 운영됩니다.
                <br />
                <br />
                • 이사, 브라우저 캐시 초기화, 인터넷 변경 등으로 인해
                <br />
                <strong>
                  접속 IP 및 기기가 바뀔 경우 기존에 설정했던 가중치와 분석 이력
                  데이터 및<br />
                  <span
                    onMouseEnter={() => setShowHonTooltip(true)}
                    onMouseLeave={() => setShowHonTooltip(false)}
                    style={{
                      position: 'relative',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dashed',
                      textUnderlineOffset: '4px',
                      cursor: 'help',
                      color: 'var(--primary-cyan)',
                      fontWeight: 'bold',
                      display: 'inline-block',
                    }}
                  >
                    혼(HON)
                    {showHonTooltip && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '125%',
                          left: '0%',
                          backgroundColor: 'rgba(3, 7, 18, 0.95)',
                          color: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 'normal',
                          whiteSpace: 'nowrap',
                          border: '1px solid rgba(0, 240, 255, 0.3)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                          zIndex: 1100,
                          animation: 'fadeIn 0.15s ease-out',
                          pointerEvents: 'none',
                        }}
                      >
                        예측 번호 생성 및 분석을 위해 사용되는 hactto 의 토큰
                      </span>
                    )}
                  </span>{' '}
                  이 <span style={{ color: 'red' }}>유실</span>
                </strong>
                될 수 있습니다.
                <br />
                <br />
                <span
                  style={{
                    display: 'inline-flex',
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '0.5rem',
                    fontWeight: 'bold',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'yellow',
                    margin: '0 4px',
                  }}
                >
                  !
                </span>{' '}
                현재 백업 서비스 및 추가 IP 연동 기술에 대한 기능 도입을
                긍정적으로 검토 중에 있습니다.
                <br />
                <br />
                <span style={{ color: '#ffffff' }}>
                  위 안내 사항을 모두 읽었으며 이에 동의하고 hactto를
                  시작하시겠습니까?
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            width: '100%',
            marginTop: '8px',
          }}
        >
          {step > 1 && (
            <button
              type="button"
              className="btn-neon btn-outline"
              style={{
                flex: 1,
                padding: 0,
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
              }}
              onClick={handleBack}
            >
              이전으로
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              className="btn-submit"
              style={{
                flex: 1,
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(135deg, var(--primary-cyan) 0%, #0891b2 100%)',
                color: '#030712',
                boxShadow: '0 4px 15px rgba(0, 240, 255, 0.25)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={handleNext}
            >
              다음으로
            </button>
          ) : (
            <button
              type="button"
              className="btn-submit"
              style={{
                flex: 1,
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={handleConsentSubmit}
            >
              동의하고 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
