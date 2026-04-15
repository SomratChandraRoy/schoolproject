import * as React from "react";

interface ManualInstallGuideProps {
  onClose: () => void;
}

const ManualInstallGuide: React.FC<ManualInstallGuideProps> = ({ onClose }) => {
  const [browser, setBrowser] = React.useState<string>("unknown");

  React.useEffect(() => {
    const userAgent = navigator.userAgent;
    if (/Firefox/.test(userAgent)) setBrowser("firefox");
    else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent))
      setBrowser("safari");
    else if (/Chrome|Chromium|Brave/.test(userAgent)) setBrowser("chrome");
    else if (/Edge|Edg/.test(userAgent)) setBrowser("edge");
    else setBrowser("unknown");
  }, []);

  const getInstructions = () => {
    switch (browser) {
      case "firefox":
        return {
          title: "Install in Firefox",
          steps: [
            "Click the three-line menu (☰) in the top right",
            'Look for "Install" or page icon in address bar',
            "Click it to install the app",
            'Or: Right-click on the page → "Install Page as App"',
          ],
          note: "Firefox has limited PWA support. The app will work but may not have all features.",
          icon: "🦊",
        };

      case "safari":
        return {
          title: "Install in Safari",
          steps: [
            "Tap the Share button (square with arrow)",
            'Scroll down and tap "Add to Home Screen"',
            "Edit the name if desired",
            'Tap "Add"',
          ],
          note: "Safari only supports PWA installation on iOS/iPadOS, not on macOS.",
          icon: "🧭",
        };

      case "chrome":
      case "edge":
      default:
        return {
          title: "Install in Chrome/Edge/Brave",
          steps: [
            "Look for the install icon (⊕) in the address bar",
            "Click it to install",
            'Or: Click the three-dot menu (⋮) → "Install SOPNA"',
            "The app will open in its own window",
          ],
          note: "You can also wait for the automatic install prompt.",
          icon: "🌐",
        };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{instructions.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {instructions.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Follow these steps to install SOPNA as an app
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm pt-0.5">
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> {instructions.note}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm">
            Benefits of Installing:
          </h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Works offline</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Faster loading</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Desktop/home screen icon</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Full-screen experience</span>
            </li>
          </ul>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
          Got it!
        </button>
      </div>
    </div>
  );
};

export default ManualInstallGuide;
