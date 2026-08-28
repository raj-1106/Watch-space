import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Why useRegisterSW (from virtual:pwa-register/react) instead of hand-rolling
 * the skipWaiting/controllerchange dance:
 *
 * A plain `window.location.reload()` after a new service worker installs is
 * NOT guaranteed to actually run the new code — the old worker can still be
 * "controlling" the page depending on browser timing, so the reload can
 * silently serve the same stale bundle again. Getting this right requires:
 *   1. telling the waiting worker to skipWaiting(),
 *   2. waiting for the `controllerchange` event (confirmation the new
 *      worker actually took over),
 *   3. THEN reloading.
 *
 * vite-plugin-pwa's hook already implements exactly that sequence
 * correctly — reimplementing it by hand here would just be re-introducing
 * the bug this component exists to avoid.
 *
 * registerType is set to "prompt" (not "autoUpdate") in vite.config.ts
 * specifically so this banner gets a chance to show before the app swaps
 * code out from under whatever the user is mid-way through doing (e.g.
 * mid-rating a title).
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // check for an updated worker every 60s while the tab is open —
      // otherwise updates are only detected on full page navigation
      registration &&
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
        rounded-full bg-velvet border border-gold/30 px-4 py-2.5 shadow-lg shadow-black/40"
    >
      <span className="font-mono text-xs text-cream">A new version is available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-midnight
          transition-colors hover:bg-gold/90"
      >
        Refresh
      </button>
      {/*
        No dismiss button, deliberately. Letting someone keep browsing on a
        stale bundle indefinitely — after we JUST finished tracking down and
        fixing an auth bug that depends on this exact codebase's current
        logic — is a worse default than a mildly persistent prompt. If you
        want a dismiss option later, it's a one-line addition, but it
        shouldn't be silent.
      */}
    </div>
  );
}
