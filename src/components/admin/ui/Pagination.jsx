import React from 'react';

export function Pagination({ page = 1, pageSize = 20, total = 0, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const nums = [];
  for (let p = Math.max(1, safePage - 2); p <= Math.min(totalPages, safePage + 2); p++) nums.push(p);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);
  return (
    <div className="adm-card adm-pagination" role="navigation" aria-label="Pagination">
      <span aria-live="polite">{start}–{end} / {total}</span>
      {onPageSize ? (
        <select className="adm-select" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Rows per page">
          {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n} / page</option>))}
        </select>
      ) : null}
      <button type="button" disabled={safePage <= 1} onClick={() => onPage?.(safePage - 1)} aria-label="Previous page">‹</button>
      {nums.map((p) => (
        <button key={p} type="button" aria-current={p === safePage ? 'page' : undefined} onClick={() => onPage?.(p)}>{p}</button>
      ))}
      <button type="button" disabled={safePage >= totalPages} onClick={() => onPage?.(safePage + 1)} aria-label="Next page">›</button>
    </div>
  );
}
