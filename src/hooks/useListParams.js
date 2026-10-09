import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'wouter';

/**
 * URL-persisted list state for admin list pages.
 * config: { keys: string[] } — only these query keys are managed.
 * Defaults are omitted from the URL; page=1 is omitted.
 * Returns { values, set(patch), reset } where set() also drops page
 * unless the patch explicitly sets it.
 */
export function useListParams(config = {}) {
  const allowlist = config.keys || [];
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const out = {};
    for (const k of allowlist) out[k] = searchParams.get(k) || '';
    return out;
  }, [searchParams.toString(), allowlist.join(',')]);

  const set = useCallback((patch = {}) => {
    const next = new URLSearchParams(searchParams.toString());
    const touchesFilter = Object.keys(patch).some((k) => k !== 'page');
    for (const [k, v] of Object.entries(patch)) {
      if (!allowlist.includes(k)) continue;
      if (v === undefined || v === null || v === '' || v === 'all' || (k === 'page' && String(v) === '1')) next.delete(k);
      else next.set(k, String(v));
    }
    // Any filter/search/sort change restarts at page 1.
    if (touchesFilter && patch.page === undefined) next.delete('page');
    const qs = next.toString();
    setSearchParams(qs ? `?${qs}` : '', { replace: true });
  }, [searchParams.toString(), allowlist.join(','), setSearchParams]);

  const reset = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    for (const k of allowlist) next.delete(k);
    const qs = next.toString();
    setSearchParams(qs ? `?${qs}` : '', { replace: true });
  }, [searchParams.toString(), allowlist.join(','), setSearchParams]);

  return { values, set, reset };
}
