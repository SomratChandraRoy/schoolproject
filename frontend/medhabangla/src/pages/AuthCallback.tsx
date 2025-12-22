import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const hasProcessedAuth = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls (React Strict Mode runs effects twice in development)
    if (hasProcessedAuth.current) {
      return;
    }

    const handleAuthCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Check for errors from WorkOS
        if (errorParam) {
          const errorMsg = errorDescription
            ? decodeURIComponent(errorDescription)
            : `Authentication error: ${errorParam}`;
          throw new Error(errorMsg);
        }

        if (!code) {
          throw new Error('No authorization code found');
        }

        // Mark as processing to prevent duplicate calls
        hasProcessedAuth.current = true;

        console.log('Exchanging authorization code with backend...');

        // Send the code to our backend to exchange for a token
        const response = await fetch('http://localhost:8000/api/accounts/workos-auth/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to authenticate with WorkOS');
        }

        const data = await response.json();

        console.log('Authentication successful, storing user data...');

        // Store the token in localStorage
        localStorage.setItem('token', data.token);

        // Store user data
        localStorage.setItem('user', JSON.stringify(data.user));

        // Store profile picture if available
        if (data.user.profile_picture) {
          localStorage.setItem('profilePicture', data.user.profile_picture);
        }

        // Set default class level if not present
        if (!data.user.class_level) {
          // Default to class 9
          localStorage.setItem('userClass', '9');
        } else {
          localStorage.setItem('userClass', data.user.class_level.toString());
        }

        console.log('Redirecting to dashboard...');

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');

        // Redirect to login page with error after 3 seconds
        setTimeout(() => {
          const errorMsg = error instanceof Error ? error.message : 'auth_failed';
          navigate(`/login?error=auth_failed&error_description=${encodeURIComponent(errorMsg)}`);
        }, 3000);
      }
    };

    handleAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run once on mount

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {error ? (
          <div>
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Authentication Failed</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login page...</p>

            {/* Troubleshooting tips */}
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                Troubleshooting Tips
              </summary>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                <p>• Check if WorkOS is configured correctly in the dashboard</p>
                <p>• Verify Google OAuth connection is set up and enabled</p>
                <p>• Ensure redirect URI matches in WorkOS dashboard</p>
                <p>• Check browser console for detailed error logs</p>
                <p>• Try clearing browser cache and cookies</p>
              </div>
            </details>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Authenticating with Google</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we sign you in...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;