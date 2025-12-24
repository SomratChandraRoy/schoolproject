import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  isAllowed?: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAllowed = true,
  redirectPath = '/login',
  children,
}) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is banned
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.is_banned) {
        // Clear storage and redirect to login with ban message
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('profilePicture');
        localStorage.removeItem('userClass');

        const banReason = encodeURIComponent(user.ban_reason || 'No reason provided');
        return <Navigate to={`/login?error=banned&ban_reason=${banReason}`} replace />;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
