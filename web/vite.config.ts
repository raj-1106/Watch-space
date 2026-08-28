import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest, not the default generateSW: we're supplying our own
      // service worker (src/service-worker.ts) so we control exactly what
      // gets cached, rather than accepting the plugin's automatic runtime
      // caching of any matched request.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectManifest: {
        // only the built app shell — JS/CSS/HTML/fonts — gets precached.
        // Deliberately NOT including any API caching rule here.
        //
        // This app's /api/* responses carry per-user, per-space watched
        // status and ratings behind auth. A service worker cache is a
        // separate store from your access-token memory or the
        // refresh_token cookie — clearing those on logout does NOT clear
        // anything Workbox has cached. On top of that, this codebase
        // already spent real effort chasing a cross-site cookie bug where
        // stale/incorrect auth state silently rendered as an empty space
        // (see SpaceDetailPage's isError handling). Adding an API cache
        // on top of that recently-stabilized auth flow — where one
        // person's cached space data could theoretically surface on a
        // shared or handed-off device — isn't a trade worth making for
        // offline API reads nobody asked for. If genuine offline access to
        // the watchlist becomes a real requirement, that should be a
        // deliberate, separate feature (see the PWA plan's "Phase 2"),
        // not a side effect of adding installability.
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
      registerType: "prompt", // NOT autoUpdate — see pwaUpdate.ts for why
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
    }),
  ],
})
