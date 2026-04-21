import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon-32.png", "icons/apple-touch-icon.png", "icons/icon.svg"],
      manifest: {
        name: "Daily Expense Manager",
        short_name: "Expenses",
        description: "Track your daily expenses, budgets and reports in INR",
        theme_color: "#4f46e5",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Network-first for API calls, cache-first for assets
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:8000\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode so you can test it
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
