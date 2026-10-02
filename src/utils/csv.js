/**
 * Minimal CSV export for admin list views (client-side, current filters).
 * UTF-8 BOM prefix keeps Korean text intact in Excel.
 */

function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/** columns: [{ key, label, get(row) }] */
export function toCsv(rows, columns) {
  const head = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = (rows || []).map((r) =>
    columns.map((c) => escapeCell(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(',')
  );
  return `\uFEFF${[head, ...lines].join('\r\n')}`;
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvFilename(prefix) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.csv`;
}
