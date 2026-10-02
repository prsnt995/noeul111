import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Unified filter bar: debounced search + selects + reset.
 * selects: [{ name, value, onChange, options: [{value,label}], ariaLabel }]
 */
export function Filters({ searchValue = '', onSearch, searchPlaceholder = '검색 Search…', selects = [], onReset, children }) {
  const [draft, setDraft] = useState(searchValue);
  useEffect(() => setDraft(searchValue), [searchValue]);
  useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => {
      if (draft !== searchValue) onSearch(draft);
    }, 300);
    return () => clearTimeout(t);
  }, [draft, onSearch, searchValue]);

  return (
    <div className="adm-card adm-filter-bar" role="search">
      <div className="adm-search">
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} aria-hidden />
        <input
          className="adm-input"
          style={{ paddingLeft: 34 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
      {selects.map((s) => (
        <select key={s.name} className="adm-select" value={s.value} onChange={(e) => s.onChange?.(e.target.value)} aria-label={s.ariaLabel || s.name}>
          {(s.options || []).map((o) => (
            <option key={String(o.value)} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      {children}
      {onReset ? <button type="button" className="adm-btn" onClick={onReset}>초기화 Reset</button> : null}
    </div>
  );
}
