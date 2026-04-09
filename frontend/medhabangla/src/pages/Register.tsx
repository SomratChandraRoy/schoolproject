import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    try {
      // Get authorization URL from backend so WorkOS parameters remain centralized
      const response = await fetch(`${API_BASE_URL}/api/accounts/workos-auth-url/`);

      if (!response.ok) {
        throw new Error('Failed to get authorization URL from server');
      }

      const data = await response.json();

      if (!data.authorization_url) {
        throw new Error('No authorization URL received from server');
      }
      
      // Redirect user to the authorization URL
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Google signup error:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Create Account</h1>
              <p className="text-gray-600 dark:text-gray-300">Join MedhaBangla to start your learning journey</p>
            </div>

            <div className="mt-8">
              <button 
                onClick={handleGoogleSignup}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                <span className="ml-2">Sign up with Google</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;