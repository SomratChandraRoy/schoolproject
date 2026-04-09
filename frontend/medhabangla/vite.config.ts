import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // Don't inject registration code
      manifest: false, // Use our custom manifest.webmanifest
      workbox: {
        // Disable workbox - we use custom sw.js by providing dummy config
        globPatterns: [],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Disable in dev mode
      },
    }),
  ],
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
