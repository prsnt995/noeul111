import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  Filters,
  DataTable,
  Pagination,
  ErrorBanner,
  Drawer,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Eye } from 'lucide-react';

const PAGE_SIZE = 20;

// Read-only audit trail (GET /api/v1/admin/audit-logs, latest 200).
// The backend keeps this insert-only and best-effort by design.
export function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const res = await adminApi.get('/admin/audit-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setErrorMsg(err?.message || '감사 로그를 불러오지 못했습니다.');
      showToast('감사 로그를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actions = useMemo(() => {
    const set = new Set((logs || []).map((l) => l.action).filter(Boolean));
    return [...set].sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (logs || []).filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (!term) return true;
      return `${l.action || ''} ${l.target || ''} ${l.actor || ''}`.toLowerCase().includes(term);
    });
  }, [logs, search, actionFilter]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const columns = [
    {
      key: 'created',
      label: '일시 Time',
      render: (l) => (
        <span style={{ fontSize: '0.78rem', color: '#52525b', whiteSpace: 'nowrap' }}>
          {String(l.created_at || '').replace('T', ' ').slice(0, 19)}
        </span>
      ),
    },
    {
      key: 'action',
      label: '작업 Action',
      render: (l) => <strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{l.action}</strong>,
    },
    {
      key: 'target',
      label: '대상 Target',
      render: (l) => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#52525b' }}>{l.target || '—'}</span>,
    },
    {
      key: 'actor',
      label: '수행자 Actor',
      render: (l) => (
        <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#71717a' }}>
          {l.actor ? String(l.actor).slice(0, 8) : 'system'}
        </span>
      ),
    },
    {
      key: 'detail',
      label: '상세 Detail',
      align: 'right',
      render: (l) => (
        <button type="button" className="adm-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelected(l)}>
          <Eye size={13} aria-hidden />
          <span>원문 보기</span>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout activePage="audit">
      <PageHeader
        ko="감사 로그"
        en="Audit Logs"
        desc="관리자 작업 이력 (읽기 전용, 최신 200건) — 상품·주문·쿠폰·설정 변경 추적"
      />

      <ErrorBanner message={errorMsg ? `감사 로그 로드 실패: ${errorMsg}` : ''} onRetry={fetchLogs} />

      <Filters
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="작업·대상·수행자 검색 Search…"
        selects={[
          {
            name: 'action', value: actionFilter, onChange: (v) => { setActionFilter(v); setPage(1); }, ariaLabel: '작업 종류 Action',
            options: [{ value: 'all', label: '전체 작업 All actions' }, ...actions.map((a) => ({ value: a, label: a }))],
          },
        ]}
      >
        <span style={{ fontSize: '0.8125rem', color: '#71717a', marginLeft: 'auto' }}>
          총 <strong>{filtered.length}</strong>건
        </span>
      </Filters>

      <DataTable
        columns={columns}
        rows={pageRows}
        loading={loading}
        emptyTitle="감사 로그가 없습니다 No audit logs found"
        emptyDesc="관리자 작업이 기록되면 여기에 표시됩니다."
        rowKey={(r, i) => r.id ?? i}
      />

      <div style={{ marginTop: 12 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="로그 원문 Log detail"
        subtitle={selected ? `${selected.action} · ${String(selected.created_at || '').replace('T', ' ').slice(0, 19)}` : ''}
      >
        {selected && (
          <pre style={{ fontSize: '0.75rem', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16, overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(selected, null, 2)}
          </pre>
        )}
      </Drawer>
    </AdminLayout>
  );
}
