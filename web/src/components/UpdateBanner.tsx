import { useEffect, useState } from "react";
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
 * UPDATED: this now auto-applies the update the instant it's detected,
 * rather than waiting for a manual "Refresh" click. That's a deliberate
 * trade-off, not a default worth forgetting about: it means a new deploy
 * can reload the page out from under someone mid-drag on the
 * ReelRatingPicker, or mid-typing a comment once that feature ships. If
 * that turns out to be annoying in practice, the fix is reverting to the
 * button-click version, not patching around this one — auto-apply and
 * "never interrupt the user" are genuinely in tension, not a bug to fix.
 */
export function UpdateBanner() {
  const [updating, setUpdating] = useState(false);

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

  useEffect(() => {
    if (needRefresh) {
      setUpdating(true);
      updateServiceWorker(true); // skipWaiting + wait for controllerchange + reload, per the note above
    }
  }, [needRefresh, updateServiceWorker]);

  if (!updating) return null;

  // brief, non-interactive: there's nothing to click, the reload is already happening
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
        rounded-full bg-velvet border border-gold/30 px-4 py-2.5 shadow-lg shadow-black/40"
    >
      <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
      <span className="font-mono text-xs text-cream">Updating…</span>
    </div>
  );
}
