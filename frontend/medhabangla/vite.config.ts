import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawProxyTarget =
    env.VITE_DEV_API_PROXY_TARGET ||
    env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  let proxyTarget = "http://127.0.0.1:8000";
  try {
    const parsed = new URL(rawProxyTarget);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
    }
    proxyTarget = parsed.toString().replace(/\/$/, "");
  } catch {
    proxyTarget = "http://127.0.0.1:8000";
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        manifest: false,
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [
            /^\/admin(?:\/.*)?$/,
            /^\/api(?:\/.*)?$/,
            /^\/ws(?:\/.*)?$/,
            /^\/static(?:\/.*)?$/,
            /^\/media(?:\/.*)?$/,
          ],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,webmanifest,json,woff,woff2}",
          ],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) => {
                const backendPrefixes = [
                  "/admin",
                  "/api",
                  "/ws",
                  "/static",
                  "/media",
                ];
                if (
                  backendPrefixes.some(
                    (prefix) =>
                      url.pathname === prefix ||
                      url.pathname.startsWith(`${prefix}/`),
                  )
                ) {
                  return false;
                }

                return (
                  request.destination === "script" ||
                  request.destination === "style" ||
                  request.destination === "image" ||
                  request.destination === "font"
                );
              },
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
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
