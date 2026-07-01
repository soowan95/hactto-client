import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onCancel();
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
    onCancel(); // Close after confirm
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      style={{
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        background: 'rgba(20, 20, 25, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#fff',
        boxShadow:
          '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 240, 255, 0.1)',
        maxWidth: '400px',
        width: '90%',
        margin: 'auto',
      }}
      className="confirm-dialog"
    >
      <form method="dialog" onSubmit={handleConfirm}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <p
            style={{
              fontSize: '1.05rem',
              margin: '0 0 16px 0',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')
              }
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                background: 'var(--primary-cyan)',
                color: '#000',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow =
                  '0 4px 20px rgba(0, 240, 255, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 0 15px rgba(0, 240, 255, 0.3)';
              }}
            >
              확인
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
