import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for error from callback
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const banReason = searchParams.get("ban_reason");

    if (errorParam) {
      if (errorParam === "banned") {
        setError(
          `You are banned. Contact our team.\n\nReason: ${banReason || "No reason provided"}`,
        );
      } else if (errorParam === "auth_failed") {
        setError("Authentication failed. Please try again.");
      } else if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
      } else {
        setError(`Authentication error: ${errorParam}`);
      }
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      // Get authorization URL from backend
      const response = await fetch(
        `${API_BASE_URL}/api/accounts/workos-auth-url/`,
      );

      if (!response.ok) {
        throw new Error("Failed to get authorization URL from server");
      }

      const data = await response.json();

      if (!data.authorization_url) {
        throw new Error("No authorization URL received from server");
      }

      console.log("Redirecting to:", data.authorization_url);

      // Redirect user to the authorization URL
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Google login error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to initiate Google login. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Welcome to SOPAN
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in with your Google account to continue
              </p>
            </div>

            {error && (
              <div
                className={`mb-6 p-4 border rounded-lg ${
                  searchParams.get("error") === "banned"
                    ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}>
                {searchParams.get("error") === "banned" ? (
                  <div className="text-center">
                    <div className="text-5xl mb-4">🚫</div>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                      Account Banned
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">
                      {error}
                    </p>
                    <div className="mt-4 pt-4 border-t border-red-300 dark:border-red-700">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                        Need help? Contact our support team:
                      </p>
                      <a
                        href="mailto:support@sopan.com"
                        className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                        📧 Contact Support
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                      Authentication Error
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                    <details className="mt-2">
                      <summary className="text-xs text-red-500 cursor-pointer hover:text-red-600">
                        Troubleshooting
                      </summary>
                      <div className="mt-2 text-xs text-red-500 space-y-1">
                        <p>
                          • Check if WorkOS is configured correctly in the
                          dashboard
                        </p>
                        <p>• Verify Google OAuth connection is set up</p>
                        <p>
                          • Ensure redirect URI matches:{" "}
                          {import.meta.env.VITE_WORKOS_REDIRECT_URI}
                        </p>
                        <p>• Check browser console for more details</p>
                      </div>
                    </details>
                  </>
                )}
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    <span className="ml-3">Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>

            {/* Debug info in development */}
            {import.meta.env.DEV && (
              <details className="mt-6 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Debug Info
                </summary>
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <p>
                    Client ID:{" "}
                    {import.meta.env.VITE_WORKOS_CLIENT_ID?.substring(0, 20)}...
                  </p>
                  <p>
                    Redirect URI: {import.meta.env.VITE_WORKOS_REDIRECT_URI}
                  </p>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
