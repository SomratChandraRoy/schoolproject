import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BanCheck: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkBanStatus();
    }, [location.pathname]);

    const checkBanStatus = async () => {
        try {
            // Skip check on login and home pages
            if (location.pathname === '/login' || location.pathname === '/' || location.pathname === '/register') {
                setChecking(false);
                return;
            }

            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!userStr || !token) {
                setChecking(false);
                return;
            }

            const user = JSON.parse(userStr);

            // Check if user is banned (from stored user data)
            if (user.is_banned) {
                console.log('[BanCheck] User is banned, redirecting to login');
                handleBannedUser(user.ban_reason || 'No reason provided');
                return;
            }

            // Verify with backend (in case ban status changed)
            try {
                const response = await fetch('/api/accounts/profile/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();

                    // Update local storage with latest data
                    localStorage.setItem('user', JSON.stringify(userData));

                    // Check if user is now banned
                    if (userData.is_banned) {
                        console.log('[BanCheck] User banned (verified from backend)');
                        handleBannedUser(userData.ban_reason || 'No reason provided');
                        return;
                    }
                } else if (response.status === 403) {
                    // User might be banned
                    const errorData = await response.json().catch(() => ({}));
                    if (errorData.error === 'banned') {
                        handleBannedUser(errorData.ban_reason || 'No reason provided');
                        return;
                    }
                }
            } catch (error) {
                console.error('[BanCheck] Error verifying ban status:', error);
                // Continue anyway, don't block user on network error
            }

            setChecking(false);
        } catch (error) {
            console.error('[BanCheck] Error checking ban status:', error);
            setChecking(false);
        }
    };

    const handleBannedUser = (banReason: string) => {
        // Clear user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('profilePicture');
        localStorage.removeItem('userClass');

        // Redirect to login with ban message
        navigate(`/login?error=banned&ban_reason=${encodeURIComponent(banReason)}`);
    };

    // Don't render anything, this is just a check component
    return null;
};

export default BanCheck;
