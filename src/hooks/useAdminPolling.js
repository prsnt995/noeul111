import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Poll an admin endpoint while the tab is visible.
 *
 * Admin screens used to fetch exactly once on mount (dashboard) or only when a
 * filter changed (orders), so a customer payment never appeared until the
 * browser was reloaded. Realtime/SSE is heavier to run on serverless, so a
 * 15-second poll plus focus/visibility wake-ups is the supported model.
 *
 * The caller owns data application (and stale-response guarding) inside `load`;
 * this hook only schedules it and tracks the last successful run.
 */
export function useAdminPolling({ load, intervalMs = 15000, enabled = true, onError } = {}) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const alive = useRef(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const run = useCallback(async (opts = {}) => {
    try {
      await loadRef.current?.(opts);
      if (alive.current) setLastUpdated(new Date());
    } catch (err) {
      if (alive.current) onErrorRef.current?.(err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const hidden = () => typeof document !== 'undefined' && document.hidden;
    const tick = () => { if (!hidden()) run({ quiet: true }); };
    const timer = setInterval(tick, intervalMs);
    // Coming back to the tab is the one moment a stale screen is most visible.
    const wake = () => { if (!hidden()) run({ quiet: true }); };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, [enabled, intervalMs, run]);

  return { refresh: () => run({ quiet: false }), lastUpdated };
}
