/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

// Workbox's injectManifest build step replaces this with the real list of
// hashed build assets (JS/CSS/HTML/fonts). This is the ONLY thing this
// service worker caches — see the note in vite.config.ts for why /api/*
// is deliberately excluded.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// A new service worker installs in the background but won't take over
// (activate) until every open tab is closed, unless it's explicitly told
// to skip that wait. This message is sent by the app's update banner
// when the user clicks "Refresh" — see pwaUpdate.ts.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
