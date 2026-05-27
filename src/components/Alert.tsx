import type { AlertState } from "../types";

interface AlertProps {
  alert: AlertState | null;
}

export function Alert({ alert }: AlertProps) {
  if (!alert) return null;

  return (
    <div className={`alert alert-${alert.type}`} style={{ marginTop: "20px" }}>
      <span>{alert.type === "success" ? "✓" : "⚠"}</span>
      <div>{alert.text}</div>
    </div>
  );
}
