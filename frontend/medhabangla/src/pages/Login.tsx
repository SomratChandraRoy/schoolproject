import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PremiumLoginModal from "../components/PremiumLoginModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check for error from callback
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const banReason = searchParams.get("ban_reason");
    const unauthorized = searchParams.get("unauthorized");

    // Show modal if unauthorized parameter is present
    if (unauthorized === "true") {
      setShowModal(true);
    }

    if (errorParam) {
      if (errorParam === "banned") {
        navigate(
          `/contact-admin?reason=${encodeURIComponent(banReason || "No reason provided")}`,
          { replace: true },
        );
        return;
      } else if (errorParam === "auth_failed") {
        setError("Authentication failed. Please try again.");
      } else if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
      } else {
        setError(`Authentication error: ${errorParam}`);
      }
    }
  }, [navigate, searchParams]);

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
    <>
      {/* Premium Login Modal */}
      <PremiumLoginModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          navigate("/", { replace: true });
        }}
        message="You need to sign in to access this feature"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          {/* Glass card container */}
          <div className="w-full max-w-md">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform transition-all hover:scale-[1.02] duration-300">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-75 blur-sm" />

              {/* Main glass card */}
              <div className="relative m-[2px] rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 animate-gradient" />

                <div className="relative p-8">
                  {/* Logo/Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Welcome to SOPNA
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                      Sign in with your Google account to continue
                    </p>
                  </div>

                  {error && (
                    <div
                      className={`mb-6 p-4 border rounded-xl backdrop-blur-sm ${
                        searchParams.get("error") === "banned"
                          ? "bg-red-100/80 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                          : "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800"
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
                              href="mailto:info@bipul.tech"
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
                      className="w-full py-4 px-6 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group">
                      <div className="flex items-center justify-center space-x-3">
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin h-6 w-6 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                              Connecting...
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 group-hover:scale-110 transition-transform"
                              viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                              Continue with Google
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      By signing in, you agree to our Terms of Service and
                      Privacy Policy
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
                          {import.meta.env.VITE_WORKOS_CLIENT_ID?.substring(
                            0,
                            20,
                          )}
                          ...
                        </p>
                        <p>
                          Redirect URI:{" "}
                          {import.meta.env.VITE_WORKOS_REDIRECT_URI}
                        </p>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes gradient {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 0.8;
            }
          }

          .animate-gradient {
            animation: gradient 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
};

export default Login;
