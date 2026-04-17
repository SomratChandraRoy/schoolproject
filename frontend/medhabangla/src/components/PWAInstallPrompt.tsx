import * as React from "react";
import { autoInstallForInstalledPWA } from "../services/modelPrefetcher";
import "../styles/offline-ai-premium.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    console.log("[PWAInstallPrompt] Component mounted");

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("[PWAInstallPrompt] App already installed");
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWAInstallPrompt] beforeinstallprompt event received");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show install prompt after a short delay for better mobile conversion.
      setTimeout(() => {
        console.log("[PWAInstallPrompt] Showing install prompt after delay");
        setShowInstallPrompt(true);
      }, 8000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("[PWAInstallPrompt] App installed event received");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Start offline model pack installation in background.
      void autoInstallForInstalledPWA(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Show again after 7 days
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slideUp">
      <div className="offline-glass-card rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1">Install SOPNA PWA</h3>
            <p className="text-sm text-white/90 mb-4 leading-relaxed">
              Install now to unlock premium offline AI. After installation,
              your mobile will automatically start downloading the local model.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-cyan-100 transition-colors">
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 font-semibold rounded-lg transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white"
            aria-label="Close">
            <svg
              className="w-5 h-5"
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
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
