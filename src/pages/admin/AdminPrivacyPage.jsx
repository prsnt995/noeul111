import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  Filters,
  DataTable,
  Pagination,
  ErrorBanner,
  Drawer,
  StatusPill,
  ConfirmModal,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { useListParams } from '../../hooks/useListParams.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Eye } from 'lucide-react';

const PAGE_SIZE = 20;

const KIND_LABEL = {
  export: '내보내기 Export',
  delete: '삭제 Delete',
  correct: '정정 Correct',
};

const STATUS_PILL = {
  pending: { label: '대기중 Pending', status: 'pending_payment' },
  done: { label: '처리완료 Done', status: 'delivered' },
  completed: { label: '처리완료 Done', status: 'delivered' },
  rejected: { label: '반려 Rejected', status: 'cancelled' },
};

// Privacy request inbox (GET list + PATCH resolve via
// /api/v1/admin/privacy-requests/:id).
export function AdminPrivacyPage() {
  // Filter state lives in the URL (?page=&search=&status=) — client-side
  // filtering over the latest 100 requests.
  const listParams = useListParams({ keys: ['page', 'search', 'status'] });
  const pv = listParams.values;
  const page = Number(pv.page) || 1;
  const search = pv.search || '';
  const statusFilter = pv.status || 'all';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolveAction, setResolveAction] = useState(null);
  const [resolving, setResolving] = useState(false);
  const { showToast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const res = await adminApi.get('/admin/privacy-requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Fetch privacy requests error:', err);
      setErrorMsg(err?.message || '개인정보 요청을 불러오지 못했습니다.');
      showToast('개인정보 요청을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const isPending = (r) => !['done', 'completed', 'rejected'].includes(String(r?.status || '').toLowerCase());

  const handleResolve = async () => {
    if (!selected || !resolveAction || resolving) return;
    setResolving(true);
    try {
      const res = await adminApi.patch(`/admin/privacy-requests/${selected.id}`, { status: resolveAction });
      if (res.success) {
        showToast(resolveAction === 'rejected' ? '요청이 반려 처리되었습니다.' : '요청이 처리완료로 표시되었습니다.', 'success');
        setSelected(res.data || { ...selected, status: resolveAction });
        fetchRequests();
      }
    } catch (err) {
      showToast(err?.message || '상태 변경 실패', 'error');
    } finally {
      setResolving(false);
      setResolveAction(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (requests || []).filter((r) => {
      if (statusFilter !== 'all' && String(r.status || '').toLowerCase() !== statusFilter) return false;
      if (!term) return true;
      return `${r.user_id || ''} ${r.kind || r.type || ''} ${r.customer_email || ''}`.toLowerCase().includes(term);
    });
  }, [requests, search, statusFilter]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const columns = [
    {
      key: 'created',
      label: '요청 일시 Requested',
      render: (r) => (
        <span style={{ fontSize: '0.8rem', color: '#52525b', whiteSpace: 'nowrap' }}>
          {String(r.created_at || '').replace('T', ' ').slice(0, 19)}
        </span>
      ),
    },
    {
      key: 'kind',
      label: '요청 종류 Type',
      render: (r) => <strong>{KIND_LABEL[String(r.kind || r.type || '').toLowerCase()] || r.kind || r.type || '—'}</strong>,
    },
    {
      key: 'user',
      label: '요청자 Requester',
      render: (r) => (
        <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#52525b' }}>
          {r.customer_email || (r.user_id ? String(r.user_id).slice(0, 8) : '—')}
        </span>
      ),
    },
    {
      key: 'status',
      label: '처리 상태 Status',
      render: (r) => {
        const pill = STATUS_PILL[String(r.status || '').toLowerCase()] || { label: r.status || '—', status: 'neutral' };
        return <StatusPill status={pill.status} label={pill.label} />;
      },
    },
    {
      key: 'detail',
      label: '상세 Detail',
      align: 'right',
      render: (r) => (
        <button type="button" className="adm-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelected(r)}>
          <Eye size={13} aria-hidden />
          <span>원문 보기</span>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout activePage="privacy">
      <PageHeader
        ko="개인정보 요청"
        en="Privacy Requests"
        desc="고객의 내보내기·삭제·정정 요청 inbox (최신 100건) — 상세 보기에서 처리완료·반려 확정 (되돌릴 수 없음)"
      />

      <ErrorBanner message={errorMsg ? `개인정보 요청 로드 실패: ${errorMsg}` : ''} onRetry={fetchRequests} />

      <Filters
        searchValue={search}
        onSearch={(v) => listParams.set({ search: v })}
        onReset={listParams.reset}
        searchPlaceholder="요청자·종류 검색 Search…"
        selects={[
          {
            name: 'status', value: statusFilter, onChange: (v) => listParams.set({ status: v }), ariaLabel: '처리 상태 Status', label: '상태 Status',
            options: [
              { value: 'all', label: '전체 상태 All' },
              { value: 'pending', label: '대기중 Pending' },
              { value: 'done', label: '처리완료 Done' },
              { value: 'completed', label: '처리완료 Completed' },
              { value: 'rejected', label: '반려 Rejected' },
            ],
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
        emptyTitle="개인정보 요청이 없습니다 No privacy requests"
        emptyDesc="고객이 내보내기·삭제·정정을 요청하면 여기에 표시됩니다."
        rowKey={(r, i) => r.id ?? i}
      />

      <div style={{ marginTop: 12 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={(p) => listParams.set({ page: p })} />
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="요청 원문 Request detail"
        subtitle={selected ? `${selected.kind || selected.type || ''} · ${String(selected.created_at || '').replace('T', ' ').slice(0, 19)}` : ''}
        footer={selected && isPending(selected) ? (
          <>
            <button type="button" className="adm-btn" onClick={() => setResolveAction('rejected')}>반려하기 Reject</button>
            <button type="button" className="adm-btn adm-btn-primary" onClick={() => setResolveAction('done')}>처리완료로 표시 Resolve</button>
          </>
        ) : undefined}
      >
        {selected && (
          <>
            <div style={{ marginBottom: 12 }}>
              {(() => {
                const pill = STATUS_PILL[String(selected.status || '').toLowerCase()] || { label: selected.status || '—', status: 'neutral' };
                return <StatusPill status={pill.status} label={pill.label} />;
              })()}
            </div>
            <pre style={{ fontSize: '0.75rem', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16, overflowX: 'auto', margin: 0 }}>
              {JSON.stringify(selected, null, 2)}
            </pre>
            {isPending(selected) && (
              <p style={{ fontSize: '0.78rem', color: '#71717a', marginTop: 12, marginBottom: 0 }}>
                처리완료·반려는 되돌릴 수 없으며 감사 로그에 기록됩니다. Resolving is terminal and audit-logged.
              </p>
            )}
          </>
        )}
      </Drawer>

      <ConfirmModal
        open={!!resolveAction}
        title={resolveAction === 'rejected' ? '요청 반려 Reject request' : '처리완료 표시 Resolve request'}
        desc={resolveAction === 'rejected'
          ? '이 개인정보 요청을 반려 처리합니다. 고객에게 별도 안내가 필요합니다.'
          : '이 개인정보 요청을 처리완료로 표시합니다. 실제 내보내기·삭제·정정 작업이 끝난 뒤에만 확정하세요.'}
        confirmLabel={resolving ? '처리 중…' : resolveAction === 'rejected' ? '반려하기 Reject' : '처리완료 Resolve'}
        onConfirm={handleResolve}
        onClose={() => { if (!resolving) setResolveAction(null); }}
      />
    </AdminLayout>
  );
}
