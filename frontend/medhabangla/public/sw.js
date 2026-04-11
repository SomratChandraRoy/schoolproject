// Service Worker for MedhaBangla PWA
const CACHE_NAME = "medhabangla-v1";
const RUNTIME_CACHE = "medhabangla-runtime-v1";
const MODEL_CACHE_NAME = "medhabangla-ai-models-v1";

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

// Model files to cache during installation
const ESSENTIAL_MODELS = ["/models/knowledge-base-v1.json"];

// Install event - cache essential assets and models
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    (async () => {
      // Cache app shell
      const cache = await caches.open(CACHE_NAME);
      console.log("[SW] Precaching app shell");
      await cache.addAll(PRECACHE_ASSETS);

      // Cache essential models in background
      console.log("[SW] Starting model cache...");
      cacheEssentialModels();

      return self.skipWaiting();
    })(),
  );
});

/**
 * Cache essential models for offline AI
 */
async function cacheEssentialModels() {
  try {
    const modelCache = await caches.open(MODEL_CACHE_NAME);

    for (const modelUrl of ESSENTIAL_MODELS) {
      try {
        console.log("[SW] Caching model:", modelUrl);
        await modelCache.add(modelUrl);
      } catch (error) {
        console.warn("[SW] Failed to cache model:", modelUrl, error);
        // Continue with next model if one fails
      }
    }

    console.log("[SW] ✅ Model caching complete");
  } catch (error) {
    console.error("[SW] Model cache error:", error);
  }
}

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Keep current caches, delete old versions
              return (
                cacheName !== CACHE_NAME &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== MODEL_CACHE_NAME &&
                !cacheName.includes("medhabangla")
              );
            })
            .map((cacheName) => {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Model files - cache first, network fallback for offline AI
  if (url.pathname.startsWith("/models/")) {
    event.respondWith(
      caches
        .match(request, { cacheName: MODEL_CACHE_NAME })
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving model from cache:", url.pathname);
            return cachedResponse;
          }

          // Try to fetch from network and cache it
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(MODEL_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });

              return response;
            })
            .catch(() => {
              // If offline and model not cached, return error response
              return new Response("Model not available offline", {
                status: 503,
              });
            });
        }),
    );
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
        }),
    );
    return;
  }

  // For navigation requests, use network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html");
      }),
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    }),
  );
});

// Background sync for notes
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "sync-notes") {
    event.waitUntil(syncNotes());
  }
});

// Sync notes with backend
async function syncNotes() {
  try {
    console.log("[SW] Syncing notes with backend...");
    // This will be handled by the app when it comes online
    // The service worker just ensures the sync happens
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_NOTES",
      });
    });
  } catch (error) {
    console.error("[SW] Error syncing notes:", error);
  }
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      }),
    );
  }

  // Download and cache models
  if (event.data && event.data.type === "DOWNLOAD_MODELS") {
    console.log("[SW] Model download requested:", event.data.models);
    event.waitUntil(downloadModels(event.data.models));
  }

  // Get cache size
  if (event.data && event.data.type === "GET_CACHE_SIZE") {
    event.waitUntil(
      (async () => {
        const size = await getCacheSize();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cacheSize: size });
        }
      })(),
    );
  }

  // Get installed models
  if (event.data && event.data.type === "GET_INSTALLED_MODELS") {
    event.waitUntil(
      (async () => {
        const models = await getInstalledModels();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ models });
        }
      })(),
    );
  }
});

/**
 * Download and cache models
 */
async function downloadModels(modelUrls) {
  try {
    const modelCache = await caches.open(MODEL_CACHE_NAME);
    const results = {
      success: [],
      failed: [],
    };

    for (const url of modelUrls) {
      try {
        console.log("[SW] Downloading model:", url);
        await modelCache.add(url);
        results.success.push(url);
      } catch (error) {
        console.error("[SW] Failed to download model:", url, error);
        results.failed.push(url);
      }
    }

    console.log("[SW] Download complete:", results);
    return results;
  } catch (error) {
    console.error("[SW] Download error:", error);
  }
}

/**
 * Get total cache size
 */
async function getCacheSize() {
  try {
    let totalSize = 0;
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            totalSize += parseInt(contentLength, 10);
          }
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error("[SW] Error calculating cache size:", error);
    return 0;
  }
}

/**
 * Get installed models from cache
 */
async function getInstalledModels() {
  try {
    const modelCache = await caches.open(MODEL_CACHE_NAME);
    const requests = await modelCache.keys();

    return requests
      .map((req) => req.url)
      .filter((url) => url.includes("/models/"));
  } catch (error) {
    console.error("[SW] Error getting installed models:", error);
    return [];
  }
}

// Push notification support (for future use)
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  const options = {
    body: event.data ? event.data.text() : "New notification from MedhaBangla",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification("MedhaBangla", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});

console.log("[SW] Service worker loaded");
