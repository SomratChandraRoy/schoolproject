import * as React from "react";
import { autoInstallForInstalledPWA } from "../services/modelPrefetcher";
import "../styles/offline-ai-premium.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISS_KEY = "pwa-install-dismissed-at";
const INSTALL_DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const INSTALL_PROMPT_DELAY_MS = 6000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

const wasDismissedRecently = () => {
  const stored = localStorage.getItem(INSTALL_DISMISS_KEY);
  if (!stored) {
    return false;
  }

  const dismissedAt = Number.parseInt(stored, 10);
  if (!Number.isFinite(dismissedAt)) {
    return false;
  }

  return Date.now() - dismissedAt < INSTALL_DISMISS_WINDOW_MS;
};

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    console.log("[PWAInstallPrompt] Component mounted");

    // Check if already installed
    if (isStandalone()) {
      console.log("[PWAInstallPrompt] App already installed");
      setIsInstalled(true);
      return;
    }

    if (wasDismissedRecently()) {
      console.log("[PWAInstallPrompt] Prompt dismissed recently, skipping");
      return;
    }

    let promptTimer: number | null = null;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWAInstallPrompt] beforeinstallprompt event received");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (promptTimer !== null) {
        window.clearTimeout(promptTimer);
      }

      // Show install prompt after a short delay for better mobile conversion.
      promptTimer = window.setTimeout(() => {
        console.log("[PWAInstallPrompt] Showing install prompt after delay");
        setShowInstallPrompt(true);
      }, INSTALL_PROMPT_DELAY_MS);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("[PWAInstallPrompt] App installed event received");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem(INSTALL_DISMISS_KEY);
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
      if (promptTimer !== null) {
        window.clearTimeout(promptTimer);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === "dismissed") {
        localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
      }
    } finally {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Show again after 7 days
    localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-shell" role="dialog" aria-live="polite">
      <div className="pwa-install-aura pwa-install-aura-cyan" />
      <div className="pwa-install-aura pwa-install-aura-pink" />
      <div className="pwa-install-popup offline-glass-card">
        <button
          onClick={handleDismiss}
          className="pwa-install-close"
          aria-label="Close install prompt">
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

        <p className="pwa-install-tag">Premium Offline Ready</p>

        <div className="pwa-install-main">
          <div className="pwa-install-icon-wrap">
            <div className="pwa-install-icon">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2zm5 4v5m0 0l-2-2m2 2l2-2"
                />
              </svg>
            </div>
          </div>

          <div className="pwa-install-copy">
            <h3 className="pwa-install-title">Install SOPNA App</h3>
            <p className="pwa-install-description">
              Install once, then your phone auto-downloads the offline AI model
              so answers keep working even with unstable internet.
            </p>

            <div className="pwa-install-points" aria-hidden="true">
              <span>Faster startup</span>
              <span>Offline AI chat</span>
              <span>Premium mobile mode</span>
            </div>

            <div className="pwa-install-actions">
              <button
                onClick={handleInstallClick}
                className="pwa-install-primary">
                Install and Continue
              </button>
              <button
                onClick={handleDismiss}
                className="pwa-install-secondary">
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
