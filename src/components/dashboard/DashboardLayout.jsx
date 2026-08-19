import { useNavigate } from "react-router-dom";
import { clearUserSession } from "../../auth/session";
import { LogoutConfirmModal } from "./dashboardPrimitives";
import NoticesBanner from "./NoticesBanner";

export default function DashboardLayout({
  children,
  sidebar,
  appInfo,
  showLogoutModal,
  onCancelLogout,
  onAfterLogout,
  containerStyle,
  mainStyle,
}) {
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    onCancelLogout?.();
    sessionStorage.removeItem("user");
    clearUserSession();
    if (onAfterLogout) {
      onAfterLogout();
      return;
    }
    navigate("/login", { replace: true });
  };

  return (
    <div style={containerStyle}>
      {sidebar}
      <main style={mainStyle}>
        <NoticesBanner />
        {children}
      </main>

      {showLogoutModal && (
        <LogoutConfirmModal
          onCancel={onCancelLogout}
          onConfirm={handleConfirmLogout}
          portalName={appInfo.PORTAL_NAME}
        />
      )}
    </div>
  );
}
