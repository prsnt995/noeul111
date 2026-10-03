import React from 'react';
import { X } from 'lucide-react';

/**
 * Removable active-filter chips shared by storefront + admin.
 * chips: [{ key, label, onClear }] — resetLabel/resetAll optional.
 */
export function FilterChips({ chips = [], onResetAll, resetLabel = 'Reset all 초기화', count = null }) {
  if (!chips.length) return null;
  return (
    <div className="filter-chips" aria-live="polite">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          className="filter-chip"
          onClick={c.onClear}
          aria-label={`Clear filter ${c.label}`}
        >
          <span>{c.label}</span>
          <X size={12} aria-hidden />
        </button>
      ))}
      {onResetAll ? (
        <button type="button" className="filter-chips-reset" onClick={onResetAll}>
          {resetLabel}
        </button>
      ) : null}
      {count !== null && count !== undefined ? (
        <span className="filter-count">{count}</span>
      ) : null}
    </div>
  );
}
