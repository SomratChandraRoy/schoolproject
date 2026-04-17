/**
 * Offline AI Chat Page
 * Requires installed PWA for local model download and usage.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import OfflineAIChat from "../components/OfflineAIChat";
import {
  autoInstallForInstalledPWA,
  downloadEssentialModels,
  getInstallationStatus,
  isPwaInstalled,
  modelPrefetcher,
} from "../services/modelPrefetcher";
import "../styles/offline-ai-premium.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallationStatus {
  isInstalled: boolean;
  installedModels: string[];
  missingModels: string[];
  cacheSize: number;
  totalSize: number;
  requiresPwaInstall: boolean;
}

interface DownloadProgressState {
  modelName: string;
  percentage: number;
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
}

export const OfflineAIPage: React.FC = () => {
  const [status, setStatus] = useState<InstallationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isInstalledPwa, setIsInstalledPwa] = useState(isPwaInstalled());
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgressState | null>(null);
  const [installNote, setInstallNote] = useState("");

  const autoStartedRef = useRef(false);

  const refreshStatus = async () => {
    try {
      const installStatus = await getInstallationStatus();
      setStatus(installStatus);
      setIsInstalledPwa(isPwaInstalled());
    } catch (error) {
      console.error("[OfflineAIPage] Error loading status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = modelPrefetcher.onProgressUpdate((progress) => {
      setDownloadProgress({
        modelName: progress.modelName,
        percentage: progress.percentage,
        status: progress.status,
        error: progress.error,
      });

      if (progress.status === "completed") {
        void refreshStatus();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalledPwa(true);
      setDeferredPrompt(null);
      setInstallNote("PWA installed. Offline model download has started.");
      void autoInstallForInstalledPWA(true).then(() => {
        void refreshStatus();
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isInstalledPwa) {
      return;
    }

    if (!status || status.isInstalled || autoStartedRef.current) {
      return;
    }

    autoStartedRef.current = true;
    setInstallNote("Downloading offline model pack in background...");

    void downloadEssentialModels()
      .then((result) => {
        if (result.failed.length > 0) {
          setInstallNote(
            `Some model downloads failed: ${result.failed.join(", ")}. Open settings and retry.`,
          );
        } else {
          setInstallNote("Offline model download completed.");
        }
      })
      .finally(() => {
        void refreshStatus();
      });
  }, [isInstalledPwa, status]);

  const canUseOfflineAI = isInstalledPwa;

  const storageLabel = useMemo(() => {
    if (!status) return "0 MB";
    return `${status.cacheSize} MB`;
  }, [status]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "dismissed") {
        setInstallNote("Install prompt dismissed. You can try again anytime.");
      }
      return;
    }

    setInstallNote(
      "On iPhone: Share -> Add to Home Screen. On Android: browser menu -> Install app.",
    );
  };

  const handleClearCache = async () => {
    if (
      !window.confirm(
        "Clear all downloaded offline models and cache? You will need to download again.",
      )
    ) {
      return;
    }

    const success = await modelPrefetcher.clearCache();
    if (success) {
      setInstallNote("Offline model cache cleared.");
      autoStartedRef.current = false;
      await refreshStatus();
    }
  };

  const installGate = (
    <div className="offline-premium-shell">
      <div className="offline-bg-orb offline-bg-orb-a" />
      <div className="offline-bg-orb offline-bg-orb-b" />
      <div className="offline-bg-orb offline-bg-orb-c" />

      <div className="offline-center-wrap">
        <section className="offline-glass-card offline-install-card">
          <p className="offline-eyebrow">Offline Premium AI</p>
          <h1 className="offline-title">Install PWA To Unlock Local 3GB AI</h1>
          <p className="offline-subtitle">
            Offline AI model download starts only after app installation. This
            protects mobile storage and enables reliable local Q&A.
          </p>

          <div className="offline-feature-grid">
            <div className="offline-feature-tile">
              <h3>Mobile-First Local Model</h3>
              <p>Largest reliable model path for around 3GB RAM devices.</p>
            </div>
            <div className="offline-feature-tile">
              <h3>Auto Download After Install</h3>
              <p>Model warm-up starts automatically when PWA is installed.</p>
            </div>
            <div className="offline-feature-tile">
              <h3>Glassy Premium UX</h3>
              <p>Emotion-driven interface tuned for full mobile screens.</p>
            </div>
          </div>

          <div className="offline-cta-row">
            <button
              type="button"
              onClick={() => void handleInstallClick()}
              className="offline-primary-btn">
              Install PWA Now
            </button>
            <a className="offline-secondary-link" href="/dashboard">
              Back To Dashboard
            </a>
          </div>

          {!!installNote && <p className="offline-install-note">{installNote}</p>}
        </section>
      </div>
    </div>
  );

  if (!canUseOfflineAI) {
    return installGate;
  }

  return (
    <div className="offline-page-wrapper">
      <OfflineAIChat />

      {showSettings && (
        <div className="offline-modal-overlay">
          <div className="offline-modal-panel">
            <div className="offline-modal-header">
              <h2>Offline AI Settings</h2>
              <button type="button" onClick={() => setShowSettings(false)}>
                Close
              </button>
            </div>

            <div className="offline-modal-body">
              <div className="offline-settings-card">
                <p className="label">Model Status</p>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <>
                    <p>
                      Core Model: {status?.isInstalled ? "Installed" : "Missing"}
                    </p>
                    <p>Storage Used: {storageLabel}</p>
                    <p>Expected Total: {status?.totalSize || 0} MB</p>
                    <p>
                      Installed Packs: {status?.installedModels.length || 0}
                    </p>
                  </>
                )}
              </div>

              {downloadProgress && (
                <div className="offline-settings-card">
                  <p className="label">Current Download</p>
                  <p>{downloadProgress.modelName}</p>
                  <p>{downloadProgress.status}</p>
                  <p>{downloadProgress.percentage}%</p>
                  {!!downloadProgress.error && (
                    <p className="offline-error">{downloadProgress.error}</p>
                  )}
                </div>
              )}

              {!!installNote && <p className="offline-install-note">{installNote}</p>}

              <div className="offline-settings-actions">
                <button type="button" onClick={() => void refreshStatus()}>
                  Refresh Status
                </button>
                <button type="button" onClick={() => void handleClearCache()}>
                  Clear Model Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="offline-settings-fab"
        onClick={() => setShowSettings(true)}>
        Settings
      </button>
    </div>
  );
};

export default OfflineAIPage;
