import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg"],
      manifest: {
        name: "Sofa Syndicate",
        short_name: "Sofa Syndicate",
        description: "A shared watchlist and rating tracker for the people you watch with.",
        theme_color: "#10131C",
        background_color: "#10131C",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tmdb-posters",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // {
          //   // your API now lives behind the same-origin /api proxy — cache it as a network-first fallback only
          //   urlPattern: /\/api\/.*/i,
          //   handler: "NetworkFirst",
          //   options: { cacheName: "api-cache", networkTimeoutSeconds: 5 },
          // },
        ],
      },
    }),
  ],
})
