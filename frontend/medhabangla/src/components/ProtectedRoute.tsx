import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getBanReason, isUserBanned } from "../utils/roleUtils";

interface ProtectedRouteProps {
  isAllowed?: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAllowed = true,
  redirectPath = "/login",
  children,
}) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token) {
    return <Navigate to="/login?unauthorized=true" replace />;
  }

  // Check if user is banned
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (isUserBanned(user)) {
        const banReason = encodeURIComponent(getBanReason(user));
        return <Navigate to={`/contact-admin?reason=${banReason}`} replace />;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
