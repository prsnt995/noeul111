import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Empty } from './Empty.jsx';

/**
 * Sortable, accessible table wrapper.
 * columns: [{ key, label, sortable, align, render(row) }]
 */
export function DataTable({ columns = [], rows = [], loading = false, emptyTitle, emptyDesc, emptyAction, sort, onSort, rowKey = (r, i) => r.id ?? i, selectable, selectedIds, onToggleSelect, onToggleAll }) {
  const allChecked = rows.length > 0 && selectable && rows.every((r) => selectedIds?.has?.(rowKey(r)));
  return (
    <div className="adm-card">
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              {selectable ? (
                <th scope="col" style={{ width: 36 }}>
                  <input type="checkbox" checked={!!allChecked} onChange={onToggleAll} aria-label="Select all rows" />
                </th>
              ) : null}
              {columns.map((c) => (
                <th key={c.key} scope="col" style={c.align ? { textAlign: c.align } : undefined}>
                  {c.sortable ? (
                    <button type="button" onClick={() => onSort?.(c.key)} aria-label={`Sort by ${c.label}`}>
                      {c.label}
                      <ArrowUpDown size={12} aria-hidden style={{ opacity: sort?.key === c.key ? 1 : 0.4 }} />
                      {sort?.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : null}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={(columns.length || 1) + (selectable ? 1 : 0)} style={{ padding: 0 }}><div style={{ padding: 16, display: 'grid', gap: 10 }}>{[0, 1, 2, 3].map((i) => (<div key={i} className="adm-skel" style={{ height: 16 }} />))}</div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={(columns.length || 1) + (selectable ? 1 : 0)} style={{ padding: 0 }}><Empty title={emptyTitle} desc={emptyDesc} action={emptyAction} /></td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={rowKey(r, i)}>
                  {selectable ? (
                    <td><input type="checkbox" checked={!!selectedIds?.has?.(rowKey(r, i))} onChange={() => onToggleSelect?.(rowKey(r, i))} aria-label={`Select row ${i + 1}`} /></td>
                  ) : null}
                  {columns.map((c) => (
                    <td key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{c.render ? c.render(r) : r[c.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
