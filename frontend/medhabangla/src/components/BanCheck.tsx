import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBanReason, isUserBanned } from "../utils/roleUtils";

const BanCheck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    void checkBanStatus();
  }, [location.pathname]);

  const checkBanStatus = async () => {
    try {
      // Avoid redirect loops on the dedicated support page.
      if (location.pathname === "/contact-admin") {
        return;
      }

      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userStr || !token) {
        return;
      }

      const user = JSON.parse(userStr);

      // Quick local check first to avoid flashing restricted pages.
      if (isUserBanned(user)) {
        handleBannedUser(getBanReason(user));
        return;
      }

      // Verify with backend (in case ban status changed)
      try {
        const response = await fetch("/api/accounts/profile/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();

          // Update local storage with latest data
          localStorage.setItem("user", JSON.stringify(userData));

          if (isUserBanned(userData)) {
            handleBannedUser(getBanReason(userData));
            return;
          }
        } else if (response.status === 403) {
          // User might be banned
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error === "banned") {
            handleBannedUser(errorData.ban_reason || "No reason provided");
            return;
          }
        }
      } catch (error) {
        console.error("[BanCheck] Error verifying ban status:", error);
        // Continue anyway, don't block user on network error
      }
    } catch (error) {
      console.error("[BanCheck] Error checking ban status:", error);
    }
  };

  const handleBannedUser = (banReason: string) => {
    navigate(`/contact-admin?reason=${encodeURIComponent(banReason)}`, {
      replace: true,
    });
  };

  // Don't render anything, this is just a check component
  return null;
};

export default BanCheck;
