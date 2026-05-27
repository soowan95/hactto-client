import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { API_BASE_URL } from "../../utils";
import { Alert } from "../../components/Alert";

export function AdminDashboard() {
  const {
    showAlert,
    alert,
    submitting,
    setSubmitting,
    loadAdminData,
    handleAdminLogout,
  } = useApp();

  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<
    "pending" | "allowed" | "masterKeys"
  >("pending");

  // Whitelist / Master key states loaded from API
  const [pendingIps, setPendingIps] = useState<string[]>([]);
  const [allowedIps, setAllowedIps] = useState<string[]>([]);
  const [masterKeys, setMasterKeys] = useState<string[]>([]);

  // Form inputs
  const [manualIp, setManualIp] = useState("");
  const [manualMk, setManualMk] = useState("");

  const key = sessionStorage.getItem("rmk");

  useEffect(() => {
    if (!key) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const data = await loadAdminData(key);
        setPendingIps(data.pendingIps);
        setAllowedIps(data.allowedIps);
        setMasterKeys(data.masterKeys);
      } catch {
        navigate("/");
      }
    };

    loadData();
  }, [key, navigate, loadAdminData]);

  // Reload data helper
  const reloadData = async () => {
    if (!key) {
      navigate("/");
      return;
    }
    try {
      const data = await loadAdminData(key);
      setPendingIps(data.pendingIps);
      setAllowedIps(data.allowedIps);
      setMasterKeys(data.masterKeys);
    } catch {
      navigate("/");
    }
  };

  // Logout handler
  const onLogout = () => {
    handleAdminLogout();
    navigate("/");
  };

  // Approve Pending IP
  const handleApproveIp = async (ip: string) => {
    if (!key) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/whitelist/approve?rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip }),
        },
      );

      if (!res.ok) throw new Error("IP 승인 실패");
      showAlert("success", `${ip} 접근 승인 완료`);
      reloadData();
    } catch (err) {
      console.error(err);
      showAlert("error", "IP 승인 중 문제가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reject Pending IP
  const handleRejectIp = async (ip: string) => {
    if (!key) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/whitelist/reject?rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip }),
        },
      );

      if (!res.ok) throw new Error("요청 반려 실패");
      showAlert("success", `${ip} 요청 반려 완료`);
      reloadData();
    } catch (err) {
      console.error(err);
      showAlert("error", "요청 반려 중 문제가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // Block Allowed IP
  const handleBlockIp = async (ip: string) => {
    if (!key) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/whitelist/ip/${ip}?rmk=${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("IP 제거 실패");
      showAlert("success", `${ip} 접근 권한 제거 완료`);
      reloadData();
    } catch (err) {
      console.error(err);
      showAlert("error", "IP 제거 중 문제가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // Manually Add IP
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !manualIp.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/whitelist/ip?rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: manualIp }),
        },
      );

      if (!res.ok) throw new Error("수동 등록 실패");
      showAlert("success", `${manualIp} 수동 등록 완료`);
      setManualIp("");
      reloadData();
    } catch (err) {
      console.error(err);
      showAlert(
        "error",
        "IP 수동 등록 중 문제가 발생했습니다. 올바른 IP 포맷인지 확인하세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Manually Add Master Key
  const handleManualAddMkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !manualMk.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/whitelist/mk?rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mk: manualMk }),
        },
      );

      if (!res.ok) throw new Error("Master key 등록 실패");
      showAlert("success", "새로운 Master key가 등록되었습니다.");
      setManualMk("");
      reloadData();
    } catch (err) {
      console.error(err);
      showAlert("error", "Master key 수동 등록 중 문제가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate and register Master Key automatically
  const handleGenerateAndAddMk = async () => {
    if (!key) return;
    try {
      setSubmitting(true);
      const gkRes = await fetch(`${API_BASE_URL}/gk`);
      if (!gkRes.ok) throw new Error("Master key 랜덤 생성에 실패했습니다.");
      const gkData = await gkRes.json();
      const newMk = (gkData.data || gkData) as string;

      if (!newMk) throw new Error("생성된 Master key를 읽을 수 없습니다.");

      const addRes = await fetch(
        `${API_BASE_URL}/admin/whitelist/mk?rmk=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mk: newMk }),
        },
      );

      if (!addRes.ok) throw new Error("Master key 자동 등록에 실패했습니다.");

      showAlert(
        "success",
        `랜덤 생성된 Master key(${newMk})가 성공적으로 등록되었습니다.`,
      );
      reloadData();
    } catch (err) {
      console.error(err);
      const error = err as Error;
      showAlert(
        "error",
        error.message || "Master key 자동 등록 중 문제가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Remove Master Key
  const handleRemoveMk = async (targetMk: string) => {
    if (!key) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/whitelist/mk/${encodeURIComponent(targetMk)}?rmk=${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("Master key 제거 실패");
      showAlert("success", "Master key가 제거되었습니다.");
      reloadData();
    } catch (err) {
      console.error(err);
      showAlert("error", "Master key 제거 중 문제가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!key) return null;

  return (
    <div
      className="access-container"
      style={{ maxWidth: "800px", width: "100%" }}
    >
      <div
        className="glass-card allowed-dashboard"
        style={{
          textAlign: "left",
          padding: "30px 40px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
        }}
      >
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <span
              className="logo-glow"
              style={{ fontSize: "1.8rem", cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              hactto admin
            </span>
            <h1
              className="access-title"
              style={{
                fontSize: "1.2rem",
                marginTop: "4px",
                color: "var(--primary-cyan)",
              }}
            >
              시스템 접근 권한 총괄 대시보드
            </h1>
          </div>
          <button
            className="btn-neon btn-outline"
            onClick={onLogout}
            style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
          >
            어드민 로그아웃
          </button>
        </div>

        {/* Tab Selection */}
        <div
          className="admin-tabs"
          style={{
            display: "flex",
            gap: "5px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            className={`tab-btn ${adminTab === "pending" ? "active-tab" : ""}`}
            onClick={() => setAdminTab("pending")}
          >
            승인 대기 목록 ({pendingIps.length})
          </button>
          <button
            className={`tab-btn ${adminTab === "allowed" ? "active-tab" : ""}`}
            onClick={() => setAdminTab("allowed")}
          >
            허용 IP 목록 ({allowedIps.length})
          </button>
          <button
            className={`tab-btn ${adminTab === "masterKeys" ? "active-tab" : ""}`}
            onClick={() => setAdminTab("masterKeys")}
          >
            Master key 관리 ({masterKeys.length})
          </button>
        </div>

        {/* Scrollable Content Wrapper */}
        <div
          className="scroll-y-container"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "8px",
            marginRight: "-8px",
            minHeight: 0,
            marginBottom: "12px",
          }}
        >
          {/* Tab Forms */}
          {adminTab === "allowed" && (
            <form
              onSubmit={handleManualAddSubmit}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "24px",
                alignItems: "flex-end",
                background: "rgba(255,255,255,0.02)",
                padding: "16px",
                borderRadius: "12px",
                border: "var(--border-glass)",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  className="form-label"
                  style={{ display: "block", marginBottom: "10px" }}
                >
                  신규 IP 수동 화이트리스트 등록
                </label>
                <input
                  type="text"
                  className="input-glow"
                  placeholder="예: 192.168.0.1"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <button
                className="btn-submit"
                type="submit"
                style={{ height: "42px", padding: "0 20px" }}
                disabled={submitting}
              >
                추가
              </button>
            </form>
          )}

          {adminTab === "masterKeys" && (
            <div style={{ marginBottom: "24px" }}>
              <form
                onSubmit={handleManualAddMkSubmit}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-end",
                  background: "rgba(255,255,255,0.02)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "var(--border-glass)",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    className="form-label"
                    style={{ display: "block", marginBottom: "10px" }}
                  >
                    Master key 수동 등록
                  </label>
                  <input
                    type="text"
                    className="input-glow"
                    placeholder="예: CustomMasterKey123"
                    value={manualMk}
                    onChange={(e) => setManualMk(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <button
                  className="btn-submit"
                  type="submit"
                  style={{ height: "42px", padding: "0 20px" }}
                  disabled={submitting}
                >
                  수동 등록
                </button>
              </form>
              <button
                className="btn-neon btn-outline"
                onClick={handleGenerateAndAddMk}
                disabled={submitting}
                style={{ fontSize: "0.88rem" }}
              >
                임의 Master key 생성 및 화이트리스트 등록
              </button>
            </div>
          )}

          {/* Tab Content Display */}
          <div style={{ minHeight: "180px" }}>
            {adminTab === "pending" ? (
              pendingIps.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-dim)",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  승인 대기 중인 IP가 없습니다.
                </p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>대기 신청 IP 주소</th>
                      <th style={{ textAlign: "right" }}>승인 조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingIps.map((ip) => (
                      <tr key={ip}>
                        <td
                          style={{
                            fontFamily: "monospace",
                            color: "#fbbf24",
                            fontWeight: "bold",
                          }}
                        >
                          {ip}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="btn-action-success"
                            onClick={() => handleApproveIp(ip)}
                            disabled={submitting}
                          >
                            승인
                          </button>
                          <button
                            className="btn-action-error"
                            onClick={() => handleRejectIp(ip)}
                            disabled={submitting}
                          >
                            반려
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : adminTab === "allowed" ? (
              allowedIps.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-dim)",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  등록된 허용 IP 주소가 없습니다.
                </p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>허용 IP 주소</th>
                      <th style={{ textAlign: "right" }}>관리 조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowedIps.map((ip) => (
                      <tr key={ip}>
                        <td
                          style={{
                            fontFamily: "monospace",
                            color: "var(--primary-cyan)",
                            fontWeight: "bold",
                          }}
                        >
                          {ip}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn-action-error"
                            onClick={() => handleBlockIp(ip)}
                            disabled={submitting}
                          >
                            접근 차단
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : adminTab === "masterKeys" ? (
              masterKeys.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-dim)",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  등록된 Master key가 없습니다.
                </p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Master key 값 (Allowed Master Keys)</th>
                      <th style={{ textAlign: "right" }}>관리 조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterKeys.map((mk) => (
                      <tr key={mk}>
                        <td
                          style={{
                            fontFamily: "monospace",
                            color: "var(--primary-purple)",
                            fontSize: "0.95rem",
                          }}
                        >
                          {mk}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn-action-error"
                            onClick={() => handleRemoveMk(mk)}
                            disabled={submitting}
                          >
                            키 제거
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : null}
          </div>
        </div>

        {/* Global Toast Alerts */}
        <Alert alert={alert} />
      </div>
    </div>
  );
}
export default AdminDashboard;
