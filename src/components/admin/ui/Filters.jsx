import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Dropdown } from '../../common/Dropdown.jsx';
import { FilterChips } from '../../common/FilterChips.jsx';

/**
 * Unified premium filter bar: debounced search + custom dropdowns +
 * active-filter chips + reset. Same `selects` prop shape as before, plus
 * optional per-select `label` (visible bilingual mini-label) and
 * `clearValue` (defaults to 'all').
 * selects: [{ name, value, onChange, options: [{value,label,hint?}], ariaLabel, label, clearValue }]
 */
export function Filters({
  searchValue = '',
  onSearch,
  searchPlaceholder = '검색 Search…',
  selects = [],
  onReset,
  resetLabel = '초기화 Reset',
  children,
  ariaLabel = 'List filters',
}) {
  const [draft, setDraft] = useState(searchValue);
  useEffect(() => setDraft(searchValue), [searchValue]);
  useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => {
      if (draft !== searchValue) onSearch(draft);
    }, 300);
    return () => clearTimeout(t);
  }, [draft, onSearch, searchValue]);

  const chips = (selects || [])
    .filter((s) => s.value !== undefined && s.value !== null && s.value !== '' && s.value !== (s.clearValue ?? 'all'))
    .map((s) => {
      const opt = (s.options || []).find((o) => String(o.value) === String(s.value));
      return {
        key: s.name,
        label: opt ? opt.label : String(s.value),
        onClear: () => s.onChange?.(s.clearValue ?? 'all'),
      };
    });

  return (
    <div className="adm-card adm-filter-bar" role="search" aria-label={ariaLabel}>
      <div className="adm-search">
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} aria-hidden />
        <input
          className="adm-input"
          style={{ paddingLeft: 34 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          type="search"
        />
      </div>
      {selects.map((s) => (
        <Dropdown
          key={s.name}
          value={s.value}
          options={s.options || []}
          onChange={(v) => s.onChange?.(v)}
          ariaLabel={s.ariaLabel || s.name}
          label={s.label}
        />
      ))}
      {children}
      {(chips.length > 0 || onReset) && (
        <div className="adm-filter-chips">
          <FilterChips
            chips={chips}
            onResetAll={onReset}
            resetLabel={resetLabel}
          />
        </div>
      )}
    </div>
  );
}
