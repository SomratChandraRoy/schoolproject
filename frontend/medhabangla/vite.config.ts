import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webmanifest,json,woff,woff2}",
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "document" ||
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "image" ||
              request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "app-shell-cache",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/models/"),
            handler: "CacheFirst",
            options: {
              cacheName: "offline-model-pack-cache",
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
            },
          },
          {
            urlPattern:
              /^https:\/\/(huggingface\.co|cdn-lfs\.huggingface\.co|cdn\.jsdelivr\.net)\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "transformers-remote-model-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  root: ".",
  base: "/",
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
