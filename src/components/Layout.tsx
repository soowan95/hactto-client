import type { MouseEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Alert } from "./Alert";
import { UnsavedChangesModal } from "./UnsavedChangesModal";

export function Layout() {
  const {
    alert,
    hasUnsavedWeights,
    showUnsavedModal,
    setShowUnsavedModal,
    setUnsavedActionTarget,
    setShowAdminModal,
  } = useApp();

  const navigate = useNavigate();

  const hasAdminAccess = !!(
    localStorage.getItem("mk") || sessionStorage.getItem("mk")
  );

  const handleTabClick = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path === "/system" && !hasAdminAccess) {
      e.preventDefault();
      setShowAdminModal(true);
      return;
    }

    if (hasUnsavedWeights) {
      e.preventDefault();
      setUnsavedActionTarget(() => () => {
        navigate(path);
      });
      setShowUnsavedModal(true);
    }
  };

  return (
    <div
      className="access-container"
      style={{ maxWidth: "1080px", width: "100%" }}
    >
      <div
        className="glass-card dashboard-container"
        style={{ textAlign: "left", padding: "30px 40px" }}
      >
        <div
          className="admin-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "16px",
          }}
        >
          <div>
            <span
              className="logo-glow"
              style={{ fontSize: "1.8rem", cursor: "pointer" }}
              onClick={() => navigate("/home")}
            >
              hactto
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                background: "rgba(0, 240, 255, 0.1)",
                color: "var(--primary-cyan)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                marginLeft: "12px",
              }}
            >
              대시보드
            </span>
          </div>

          <div
            style={{ display: "flex", gap: "15px", alignItems: "center" }}
          ></div>
        </div>

        <div
          className="admin-tabs"
          style={{
            display: "flex",
            gap: "5px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <NavLink
            to="/home"
            onClick={(e) => handleTabClick(e, "/home")}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            최근 당첨번호
          </NavLink>
          <NavLink
            to="/search"
            onClick={(e) => handleTabClick(e, "/search")}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            당첨번호 조회
          </NavLink>
          <NavLink
            to="/stats"
            onClick={(e) => handleTabClick(e, "/stats")}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            알고리즘 통계
          </NavLink>
          <NavLink
            to="/analysis-charts"
            onClick={(e) => handleTabClick(e, "/analysis-charts")}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            당첨통계 차트
          </NavLink>
          <NavLink
            to="/generate"
            onClick={(e) => handleTabClick(e, "/generate")}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            예측번호 분석기
          </NavLink>
          <NavLink
            to="/history"
            onClick={(e) => handleTabClick(e, "/history")}
            className={({ isActive }) =>
              `tab-btn ${isActive ? "active-tab" : ""}`
            }
          >
            내 당첨이력
          </NavLink>
        </div>

        <div
          className="scroll-y-container"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "8px",
            marginRight: "-8px",
            minHeight: 0,
            marginBottom: "12px",
          }}
        >
          <Outlet />
        </div>

        <Alert alert={alert} />
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
      />
    </div>
  );
}
