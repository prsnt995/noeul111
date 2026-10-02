import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  Filters,
  DataTable,
  Pagination,
  ErrorBanner,
  Drawer,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { toCsv, downloadCsv, csvFilename } from '../../utils/csv.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Eye, MapPin, Phone, Mail, Calendar, Ban, Download } from 'lucide-react';

const PAGE_SIZE = 20;

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({ page, pageSize: PAGE_SIZE, search: search.trim(), sort: sort.key, dir: sort.dir });
      const res = await adminApi.get(`/admin/customers${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setCustomers(data);
      setTotal(t);
    } catch (err) {
      const msg = err?.message || '';
      console.error('Fetch admin customers failed:', err);
      if (msg.includes('401') || msg.includes('SIGN_IN_REQUIRED')) {
        setErrorMsg('관리자 로그인이 필요합니다. /admin/login 에서 Google 계정으로 로그인하세요.');
      } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        setErrorMsg('관리자 권한이 없습니다.');
      } else {
        setErrorMsg(msg || '고객 목록을 불러오지 못했습니다.');
        showToast(msg || '고객 목록을 불러오지 못했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, sort]);

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };

  // CSV export of the current search (all pages, capped at 1000 rows).
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const all = [];
      let pageNum = 1;
      for (;;) {
        const qs = buildListParams({ page: pageNum, pageSize: 200, search: search.trim(), sort: sort.key, dir: sort.dir });
        const res = await adminApi.get(`/admin/customers${qs}`);
        const { data, total: t } = normalizeListResponse(res, pageNum, 200);
        all.push(...(data || []));
        if (all.length >= (t || 0) || !(data || []).length || all.length >= 1000) break;
        pageNum += 1;
      }
      const csv = toCsv(all, [
        { label: '이름 Name', get: (c) => c.name },
        { label: '이메일 Email', get: (c) => c.email },
        { label: '연락처 Phone', get: (c) => c.phone },
        { label: '우편번호 Postal', get: (c) => c.postal_code },
        { label: '주소 Address', get: (c) => `${c.address || ''} ${c.detail_address || ''}`.trim() },
        { label: '수령인 Recipient', get: (c) => c.recipient },
        { label: '주문건수 Orders', get: (c) => c.order_count },
        { label: '총구매 Total spent', get: (c) => c.total_spent },
        { label: '가입일 Joined', get: (c) => String(c.created_at || '').replace('T', ' ').slice(0, 19) },
      ]);
      downloadCsv(csvFilename('customers'), csv);
      showToast(`${all.length}건 CSV 다운로드됨 Downloaded`, 'success');
    } catch (err) {
      showToast(err?.message || 'CSV 다운로드 실패', 'error');
    } finally {
      setExporting(false);
    }
  };

  const openCustomerDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.get(`/admin/customers/${id}`);
      if (res.success) {
        // Backend now returns flat {...profile, phone, address, orders, addresses} (was {profile, orders})
        const raw = res.data;
        const normalized = raw.profile ? { ...raw.profile, orders: raw.orders, addresses: raw.addresses, phone: raw.phone || raw.profile.phone, address: raw.address || raw.profile.address } : raw;
        // Ensure phone/address from latest address if present
        if (raw.addresses?.[0] && !normalized.phone) {
          normalized.phone = raw.addresses[0].phone;
          normalized.postal_code = raw.addresses[0].postal_code;
          normalized.address = raw.addresses[0].address;
          normalized.detail_address = raw.addresses[0].detail_address;
        }
        setSelectedCustomer(normalized);
      }
    } catch (err) {
      showToast('고객 상세 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: '고객명 / 이메일 Name',
      sortable: true,
      render: (c) => (
        <div>
          <p style={{ fontWeight: 600, color: '#18181b', margin: 0 }}>{c.name}</p>
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{c.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: '연락처 Phone',
      render: (c) => <span style={{ color: '#52525b' }}>{c.phone || '미등록'}</span>,
    },
    {
      key: 'address',
      label: '기본 배송 주소 Address',
      render: (c) => (
        <span style={{ color: '#52525b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {c.address ? `[${c.postal_code}] ${c.address} ${c.detail_address}` : '주소 미등록'}
        </span>
      ),
    },
    {
      key: 'order_count',
      label: '주문 건수 Orders',
      render: (c) => <span style={{ fontWeight: 600 }}>{c.order_count}건</span>,
    },
    {
      key: 'total_spent',
      label: '총 구매 금액 Spent',
      render: (c) => <span style={{ fontWeight: 700, color: 'var(--adm-accent)' }}>{formatKRW(c.total_spent)}</span>,
    },
    {
      key: 'created_at',
      label: '가입 일시 Joined',
      sortable: true,
      render: (c) => (
        <span style={{ color: '#71717a', fontSize: '0.75rem' }}>{c.created_at?.split('T')[0] || c.created_at?.split(' ')[0]}</span>
      ),
    },
    {
      key: 'actions',
      label: '관리 Actions',
      align: 'right',
      render: (c) => (
        <button type="button" className="adm-btn" style={{ padding: '6px 12px', fontSize: '0.8125rem' }} onClick={() => openCustomerDetail(c.id)}>
          <Eye size={13} aria-hidden />
          <span>주문 이력</span>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout activePage="customers">
      <PageHeader
        ko="고객 관리"
        en="Customer Management"
        desc="가입 회원 정보, 배송지 주소, 주문 이력 및 총 누적 구매 금액 확인"
        actions={(
          <button type="button" className="adm-btn" onClick={handleExportCsv} disabled={exporting}>
            <Download size={15} aria-hidden />
            <span>{exporting ? '내보내는 중…' : 'CSV 다운로드 Export'}</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `고객 로드 실패: ${errorMsg}` : ''} onRetry={fetchCustomers} />

      <Filters
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="이름, 이메일 검색 Search…"
      >
        <span style={{ fontSize: '0.8125rem', color: '#71717a', marginLeft: 'auto' }}>
          총 <strong>{total}</strong>명의 회원
        </span>
      </Filters>

      <DataTable
        columns={columns}
        rows={customers}
        loading={loading}
        emptyTitle="등록된 고객이 없습니다 No customers found"
        emptyDesc="검색어를 조정해 보세요."
        sort={sort}
        onSort={handleSort}
        rowKey={(r) => r.id}
      />

      <div style={{ marginTop: 12 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      {/* Customer Detail Drawer */}
      <Drawer
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="고객 상세 프로필 & 구매 이력 Customer Detail"
        subtitle={selectedCustomer?.email || ''}
      >
        {selectedCustomer && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="adm-card" style={{ padding: 16, fontSize: '0.875rem', lineHeight: 1.7 }}>
              {detailLoading ? (
                <p style={{ color: '#71717a', margin: 0 }}>고객 상세 로딩 중…</p>
              ) : (
                <>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 4px' }}><Mail size={14} aria-hidden /> <strong>이메일:</strong> {selectedCustomer.email}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 4px' }}><Phone size={14} aria-hidden /> <strong>연락처:</strong> {selectedCustomer.phone || '미등록 (프로필에 저장된 주소 없음)'}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 4px' }}><MapPin size={14} aria-hidden /> <strong>등록 배송지:</strong> [{selectedCustomer.postal_code || '-'}] {selectedCustomer.address || '주소 없음'} {selectedCustomer.detail_address} {selectedCustomer.recipient ? `(${selectedCustomer.recipient})` : ''}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}><Calendar size={14} aria-hidden /> <strong>가입일시:</strong> {selectedCustomer.created_at?.split('T')[0] || selectedCustomer.created_at}</p>
                  {selectedCustomer.disabled && <p style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 0' }}><Ban size={14} aria-hidden /> <strong>계정 상태:</strong> 비활성화됨</p>}
                  {selectedCustomer.addresses?.length > 1 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e4e4e7' }}>
                      <p style={{ fontWeight: 700, marginBottom: 6 }}>저장된 배송지 ({selectedCustomer.addresses.length}개)</p>
                      {selectedCustomer.addresses.slice(0, 3).map((a, i) => (
                        <p key={i} style={{ fontSize: '0.8125rem', color: '#52525b', marginBottom: 4 }}>
                          [{a.postal_code}] {a.address} {a.detail_address} — {a.recipient} ({a.phone})
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 14px' }}>
                주문 내역 ({selectedCustomer.orders?.length || 0}건 Orders)
              </h4>
              {selectedCustomer.orders?.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.875rem' }}>아직 주문 내역이 없습니다.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedCustomer.orders?.map((ord) => (
                    <div
                      key={ord.id}
                      style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{ord.order_number}</span>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>{ord.created_at?.split('T')[0] || ord.created_at?.split(' ')[0]}</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#555', marginTop: '4px', marginBottom: 0 }}>
                          {ord.items?.[0]?.product_name_ko} {ord.items?.length > 1 ? `외 ${ord.items.length - 1}건` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{formatKRW(ord.total_amount)}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--adm-accent)', fontWeight: 600 }}>
                          {ord.order_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </AdminLayout>
  );
}
