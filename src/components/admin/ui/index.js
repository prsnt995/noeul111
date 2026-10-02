export { PageHeader } from './PageHeader.jsx';
export { Filters } from './Filters.jsx';
export { DataTable } from './DataTable.jsx';
export { Pagination } from './Pagination.jsx';
export { Empty, ErrorBanner } from './Empty.jsx';
export { ConfirmModal, Drawer } from './Overlays.jsx';
export { StatusPill } from './StatusPill.jsx';
export { CommandPalette } from './CommandPalette.jsx';

/**
 * Shared paginated-list helper (works with legacy + new API shapes).
 * API returns either { data, pagination:{page,pageSize,total} } or
 * legacy { data, total, count }. This normalizes both.
 */
export function normalizeListResponse(json, fallbackPage = 1, fallbackPageSize = 20) {
  const data = json?.data || [];
  const p = json?.pagination || {};
  const total = Number(p.total ?? json?.total ?? json?.count ?? data.length) || 0;
  const page = Number(p.page || fallbackPage) || 1;
  const pageSize = Number(p.pageSize || fallbackPageSize) || fallbackPageSize;
  return { data, page, pageSize, total };
}

export function buildListParams({ page, pageSize, search, sort, dir, ...rest } = {}) {
  const sp = new URLSearchParams();
  if (page) sp.set('page', String(page));
  if (pageSize) sp.set('pageSize', String(pageSize));
  // Legacy aliases so old + new servers both understand pagination.
  if (page && pageSize) {
    sp.set('limit', String(pageSize));
    sp.set('offset', String((page - 1) * pageSize));
  }
  if (search) sp.set('search', search);
  if (sort) sp.set('sort', sort);
  if (dir) sp.set('order', dir);
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
