import { Navigate } from "react-router-dom";
import { getSessionItem, normalizeRole, VALID_ROLES } from "./session";

export default function ProtectedRoute({ children }) {
  const token = getSessionItem("accessToken") || getSessionItem("token");
  const role = normalizeRole(getSessionItem("role"), "");

  if (!token || !VALID_ROLES.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
