// Service Worker Registration Utility

export function registerServiceWorker() {
  if (import.meta.env.DEV) {
    console.log("Skipping service worker registration in development mode");
    return;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  if (confirm("New version available! Reload to update?")) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });

      // Handle controller change
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_NOTES") {
          // Trigger notes sync
          window.dispatchEvent(new CustomEvent("sync-notes"));
        }
      });
    });
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return Notification.permission === "granted";
}

// Show notification
export function showNotification(title: string, options?: NotificationOptions) {
  if ("Notification" in window && Notification.permission === "granted") {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: "/icon-192.png",
        ...options,
      });
    }
  }
}

// Register background sync
export async function registerBackgroundSync(tag: string) {
  if (
    "serviceWorker" in navigator &&
    "sync" in ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log("Background sync registered:", tag);
    } catch (error) {
      console.error("Background sync registration failed:", error);
    }
  }
}

// Check if app is installed
export function isAppInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Get storage estimate
export async function getStorageEstimate() {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    return await navigator.storage.estimate();
  }
  return null;
}

// Request persistent storage
export async function requestPersistentStorage() {
  if ("storage" in navigator && "persist" in navigator.storage) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      return await navigator.storage.persist();
    }
    return true;
  }
  return false;
}
