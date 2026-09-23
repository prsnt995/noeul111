import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api, adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Search, Eye, Users, ShoppingBag, X, MapPin, Phone, Mail, Calendar, Ban, CheckCircle } from 'lucide-react';
import { TableSkeleton } from '../../components/admin/AdminSkeleton.jsx';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const { showToast } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await adminApi.get(`/admin/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data);
      }
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
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
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

  return (
    <AdminLayout activePage="customers">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>고객 관리 (Customer Management)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              가입 회원 정보, 배송지 주소, 주문 이력 및 총 누적 구매 금액 확인
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.875rem', lineHeight: 1.5 }}>
            <strong>고객 로드 실패:</strong> {errorMsg}
            <button onClick={fetchCustomers} style={{ marginLeft: 12, padding: '6px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>다시 시도</button>
            <a href="/admin/login" style={{ marginLeft: 8, color: '#dc2626', textDecoration: 'underline', fontSize: '0.8125rem' }}>로그인 페이지로 이동 →</a>
          </div>
        )}

        {/* Search Bar — free-tier: no phone column in profiles, search is name/email only */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #e4e4e7',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: '#71717a' }}>
            총 <strong>{customers.length}</strong>명의 회원이 등록되어 있습니다.
            <span style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginLeft: 8 }}>Supabase free-tier: 100명 lazy</span>
          </span>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름, 이메일 검색"
                className="form-input"
                style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem', width: '240px' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              검색
            </button>
          </form>
        </div>

        {/* Customers Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>고객명 / 이메일</th>
                  <th style={{ padding: '14px 16px' }}>연락처</th>
                  <th style={{ padding: '14px 16px' }}>기본 배송 주소</th>
                  <th style={{ padding: '14px 16px' }}>주문 건수</th>
                  <th style={{ padding: '14px 16px' }}>총 구매 금액</th>
                  <th style={{ padding: '14px 16px' }}>가입 일시</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <TableSkeleton rows={5} cols={7} />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      등록된 고객이 없습니다.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ fontWeight: 600, color: '#18181b' }}>{c.name}</p>
                        <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{c.email}</span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#52525b' }}>
                        {c.phone || '미등록'}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#52525b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address ? `[${c.postal_code}] ${c.address} ${c.detail_address}` : '주소 미등록'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600 }}>{c.order_count}건</span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-sunset)' }}>
                          {formatKRW(c.total_spent)}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#71717a', fontSize: '0.75rem' }}>
                        {c.created_at?.split('T')[0] || c.created_at?.split(' ')[0]}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => openCustomerDetail(c.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', color: '#18181b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} />
                          <span>주문 이력</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="backdrop" onClick={() => setSelectedCustomer(null)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                margin: '40px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
                padding: '32px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e4e4e7', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>고객 상세 프로필 & 구매 이력</h3>
                  <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>{selectedCustomer.email}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* Profile details — latest address from app.addresses, free-tier lazy */}
              <div style={{ backgroundColor: '#fafafa', padding: '18px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem', lineHeight: 1.7 }}>
                {detailLoading ? (
                  <p style={{ color: '#71717a' }}>고객 상세 로딩 중...</p>
                ) : (
                  <>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> <strong>이메일:</strong> {selectedCustomer.email}</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> <strong>연락처:</strong> {selectedCustomer.phone || '미등록 (프로필에 저장된 주소 없음)'}</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> <strong>등록 배송지:</strong> [{selectedCustomer.postal_code || '-'}] {selectedCustomer.address || '주소 없음'} {selectedCustomer.detail_address} {selectedCustomer.recipient ? `(${selectedCustomer.recipient})` : ''}</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> <strong>가입일시:</strong> {selectedCustomer.created_at?.split('T')[0] || selectedCustomer.created_at}</p>
                    {selectedCustomer.disabled && <p style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}><Ban size={14} /> <strong>계정 상태:</strong> 비활성화됨</p>}
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

              {/* Orders List */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
                  주문 내역 ({selectedCustomer.orders?.length || 0}건)
                </h4>

                {selectedCustomer.orders?.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.875rem' }}>아직 주문 내역이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedCustomer.orders?.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          border: '1px solid #e4e4e7',
                          borderRadius: '8px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{ord.order_number}</span>
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>{ord.created_at?.split('T')[0] || ord.created_at?.split(' ')[0]}</span>
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: '#555', marginTop: '4px' }}>
                            {ord.items?.[0]?.product_name_ko} {ord.items?.length > 1 ? `외 ${ord.items.length - 1}건` : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{formatKRW(ord.total_amount)}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600 }}>
                            {ord.order_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
