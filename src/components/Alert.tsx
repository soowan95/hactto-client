import { createPortal } from 'react-dom';
import type { AlertState } from '../types';

interface AlertProps {
  alert: AlertState | null;
}

export function Alert({ alert }: AlertProps) {
  if (!alert) return null;

  return createPortal(
    <div className={`alert alert-${alert.type}`}>
      <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
      <div>{alert.text}</div>
    </div>,
    document.body,
  );
}
