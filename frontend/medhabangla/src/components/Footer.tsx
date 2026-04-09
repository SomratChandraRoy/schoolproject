import * as React from "react";
import { useDarkMode } from "../contexts/DarkModeContext";

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2"></path>
    <path d="M12 20v2"></path>
    <path d="m4.93 4.93 1.41 1.41"></path>
    <path d="m17.66 17.66 1.41 1.41"></path>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="m6.34 17.66-1.41 1.41"></path>
    <path d="m19.07 4.93-1.41 1.41"></path>
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
  </svg>
);

const MonitorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"></rect>
    <line x1="8" x2="16" y1="21" y2="21"></line>
    <line x1="12" x2="12" y1="17" y2="21"></line>
  </svg>
);

const Footer: React.FC = () => {
  const { theme, setTheme } = useDarkMode();

  return (
    <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 px-4 mt-auto z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} MedhaBangla. All rights reserved.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            Theme:
          </span>

          <button
            onClick={() => setTheme("light")}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${
              theme === "light"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
            title="Light theme"
            aria-label="Light theme">
            <SunIcon />
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${
              theme === "dark"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
            title="Dark theme"
            aria-label="Dark theme">
            <MoonIcon />
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${
              theme === "system"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
            title="System theme"
            aria-label="System theme">
            <MonitorIcon />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
