import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Boxes, AlertTriangle, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';

export function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { showToast } = useToast();

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('stockStatus', filter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/admin/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      showToast('재고 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleStockChange = async (id, delta, directValue) => {
    setUpdatingId(id);
    try {
      const payload = directValue !== undefined ? { newStock: directValue } : { delta };
      const res = await api.patch(`/admin/products/${id}/stock`, payload);
      if (res.success) {
        showToast('재고 수량이 업데이트되었습니다.', 'success');
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stock: res.stock } : p))
        );
      }
    } catch (err) {
      showToast('재고 변경에 실패했습니다.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const inStockCount = products.filter((p) => p.stock > 15).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 15).length;
  const outStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <AdminLayout activePage="inventory">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Boxes size={28} color="var(--accent-sunset)" />
              <span>재고 관리 센터 (Inventory Control)</span>
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              상품별 실시간 재고 파악, 품절 자동 방지 처리 및 수량 일괄 조정
            </p>
          </div>

          <button
            onClick={fetchInventory}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>새로고침</span>
          </button>
        </div>

        {/* Inventory Summary Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>전체 상품 수</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{products.length}개</h3>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>재고 원활 (In Stock &gt; 15개)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{inStockCount}개</h3>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #fef08a', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854d0e' }}>품절 임박 (Low Stock 1~15개)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>{lowStockCount}개</h3>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #fca5a5', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>품절 (Out of Stock 0개)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{outStockCount}개</h3>
          </div>
        </div>

        {/* Filters & Search */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 24px',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: filter === 'all' ? '#18181b' : '#f4f4f5',
                color: filter === 'all' ? '#ffffff' : '#52525b',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              전체 보기
            </button>
            <button
              onClick={() => setFilter('low')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: filter === 'low' ? '#b45309' : '#fffbeb',
                color: filter === 'low' ? '#ffffff' : '#b45309',
                border: '1px solid #fef3c7',
                cursor: 'pointer',
              }}
            >
              ⚠️ 품절 임박 (1~15개)
            </button>
            <button
              onClick={() => setFilter('out')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: filter === 'out' ? '#dc2626' : '#fee2e2',
                color: filter === 'out' ? '#ffffff' : '#dc2626',
                border: '1px solid #fca5a5',
                cursor: 'pointer',
              }}
            >
              ❌ 품절 (0개)
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="상품명, SKU 검색"
                className="form-input"
                style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem', width: '220px' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              검색
            </button>
          </form>
        </div>

        {/* Inventory Table */}
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
                  <th style={{ padding: '14px 20px' }}>상품 정보</th>
                  <th style={{ padding: '14px 16px' }}>카테고리</th>
                  <th style={{ padding: '14px 16px' }}>판매가</th>
                  <th style={{ padding: '14px 16px' }}>현재 재고 수량</th>
                  <th style={{ padding: '14px 16px' }}>재고 상태</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>빠른 수량 수정</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      재고 데이터 로딩 중...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      해당 조건의 재고 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={p.images?.[0] || ''}
                            alt=""
                            style={{ width: '40px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div>
                            <p style={{ fontWeight: 700, color: '#18181b' }}>{p.name_ko}</p>
                            <p style={{ fontSize: '0.75rem', color: '#71717a' }}>{p.name_en}</p>
                            <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#999' }}>SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#52525b' }}>
                        {p.category_name_ko}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        {formatKRW(p.discount_price || p.price)}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => handleStockChange(p.id, 0, Math.max(0, parseInt(e.target.value) || 0))}
                          style={{
                            width: '80px',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #d4d4d8',
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: p.stock <= 0 ? '#dc2626' : p.stock <= 15 ? '#b45309' : '#16a34a',
                          }}
                        />
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {p.stock <= 0 ? (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} />
                            <span>Out of Stock (품절)</span>
                          </span>
                        ) : p.stock <= 15 ? (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} />
                            <span>Low Stock (품절임박)</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} />
                            <span>In Stock (원활)</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button
                            onClick={() => handleStockChange(p.id, -1)}
                            style={{ padding: '4px 8px', backgroundColor: '#f4f4f5', borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleStockChange(p.id, 5)}
                            style={{ padding: '4px 8px', backgroundColor: '#f4f4f5', borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleStockChange(p.id, 20)}
                            style={{ padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', border: '1px solid #bae6fd', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            +20
                          </button>
                          <button
                            onClick={() => handleStockChange(p.id, 0, 0)}
                            style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', border: '1px solid #fca5a5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            품절 처리 (0)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
