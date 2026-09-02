import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Search, Eye, Users, ShoppingBag, X } from 'lucide-react';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { showToast } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await api.get(`/admin/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Fetch admin customers failed:', err);
      showToast('고객 목록을 불러오지 못했습니다.', 'error');
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
    try {
      const res = await api.get(`/admin/customers/${id}`);
      if (res.success) {
        setSelectedCustomer(res.data);
      }
    } catch (err) {
      showToast('고객 상세 정보를 불러오지 못했습니다.', 'error');
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

        {/* Search Bar */}
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
          </span>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름, 이메일, 연락처 검색"
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
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      고객 데이터를 불러오는 중...
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

              {/* Profile details */}
              <div style={{ backgroundColor: '#fafafa', padding: '18px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem', lineHeight: 1.7 }}>
                <p><strong>고객 성함:</strong> {selectedCustomer.name}</p>
                <p><strong>연락처:</strong> {selectedCustomer.phone || '미등록'}</p>
                <p><strong>등록 배송지:</strong> [{selectedCustomer.postal_code || '-'}] {selectedCustomer.address || '주소 없음'} {selectedCustomer.detail_address}</p>
                <p><strong>가입일시:</strong> {selectedCustomer.created_at}</p>
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
