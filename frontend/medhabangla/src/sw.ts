/// <reference lib="webworker" />

// Define types for service worker events
interface ExtendableEvent extends Event {
  waitUntil(f: Promise<any>): void;
}

interface FetchEvent extends Event {
  readonly request: Request;
  respondWith(r: Response | Promise<Response>): void;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  readonly data: any;
}

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

// Cache name
const CACHE_NAME = "sopan-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/pages/Home.tsx",
  "/src/pages/Login.tsx",
  "/src/pages/Register.tsx",
  "/src/pages/Dashboard.tsx",
  "/src/pages/Quiz.tsx",
  "/src/pages/Books.tsx",
  "/src/pages/Games.tsx",
  "/src/pages/Profile.tsx",
  "/src/pages/Notes.tsx",
  "/src/pages/AdminDashboard.tsx",
];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event: FetchEvent) => {
  // For API requests, try network first, then cache
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          // Cache the response for offline use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((response) => {
            return (
              response ||
              new Response("Offline", {
                status: 503,
                statusText: "Service Unavailable",
              })
            );
          });
        }),
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Otherwise, fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();

        // Cache the response for offline use
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }),
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Handle background sync for saving notes
self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "save-note") {
    event.waitUntil(saveNoteInBackground());
  }
});

async function saveNoteInBackground() {
  // This would sync offline notes with the server when connection is restored
  console.log("Syncing offline notes with server");
  // Implementation would depend on your specific requirements
}
