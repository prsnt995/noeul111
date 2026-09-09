import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Globe, CheckCircle2, AlertCircle, Edit2, Search, Languages } from 'lucide-react';

export function AdminLanguagesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, complete, incomplete
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products');
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      showToast('다국어 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const isComplete = Boolean(p.name_ko && p.name_en && p.description_ko && p.description_en);
    if (filter === 'complete' && !isComplete) return false;
    if (filter === 'incomplete' && isComplete) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return p.name_ko?.toLowerCase().includes(term) || p.name_en?.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term);
    }
    return true;
  });

  const completeCount = products.filter((p) => p.name_ko && p.name_en && p.description_ko && p.description_en).length;
  const incompleteCount = products.length - completeCount;

  return (
    <AdminLayout activePage="languages">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={28} color="var(--accent-sunset)" />
              <span>다국어 관리 센터 (Language Management)</span>
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              고객 웹사이트 다국어(한국어, 영어) 번역 상태 점검 및 상품 정보 통합 번역 관리
            </p>
          </div>
        </div>

        {/* Translation Status Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a' }}>지원 언어 (Supported Languages)</span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#18181b', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                🇰🇷 한국어 (Korean)
              </span>
              <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--accent-sunset)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                🇺🇸 영어 (English)
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>완전 번역 완료 (KO + EN)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{completeCount}개</h3>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #fef08a', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854d0e' }}>영문 번역 미비 / 작성 필요</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>{incompleteCount}개</h3>
          </div>
        </div>

        {/* Filter & Search */}
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
              전체 보기 ({products.length})
            </button>
            <button
              onClick={() => setFilter('complete')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: filter === 'complete' ? '#16a34a' : '#f0fdf4',
                color: filter === 'complete' ? '#ffffff' : '#166534',
                border: '1px solid #bbf7d0',
                cursor: 'pointer',
              }}
            >
              ✅ 번역 완료만 ({completeCount})
            </button>
            <button
              onClick={() => setFilter('incomplete')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: filter === 'incomplete' ? '#b45309' : '#fffbeb',
                color: filter === 'incomplete' ? '#ffffff' : '#b45309',
                border: '1px solid #fef3c7',
                cursor: 'pointer',
              }}
            >
              ⚠️ 미완료만 보기 ({incompleteCount})
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명, SKU 검색"
              className="form-input"
              style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem', width: '240px' }}
            />
          </div>
        </div>

        {/* Translation Table */}
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
                  <th style={{ padding: '14px 20px' }}>상품 (SKU)</th>
                  <th style={{ padding: '14px 16px' }}>🇰🇷 한국어 데이터 (Korean)</th>
                  <th style={{ padding: '14px 16px' }}>🇺🇸 영어 데이터 (English)</th>
                  <th style={{ padding: '14px 16px' }}>소재 (Material KO/EN)</th>
                  <th style={{ padding: '14px 16px' }}>번역 상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      데이터 로딩 중...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      조건에 일치하는 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isComplete = Boolean(p.name_ko && p.name_en && p.description_ko && p.description_en);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={p.images?.[0] || ''} alt="" style={{ width: '36px', height: '46px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#888' }}>#{p.id} • {p.sku}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 700, color: '#18181b' }}>{p.name_ko || '미작성'}</p>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {p.description_ko || '상세 설명 미작성'}
                          </p>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 700, color: p.name_en ? '#18181b' : '#dc2626' }}>{p.name_en || '미작성 (Missing)'}</p>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {p.description_en || 'English description missing'}
                          </p>
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>🇰🇷 {p.material_ko || p.material || '미입력'}</span>
                            <span style={{ color: p.material_en ? '#18181b' : '#dc2626' }}>🇺🇸 {p.material_en || 'Missing'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {isComplete ? (
                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} />
                              <span>번역 완료</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} />
                              <span>보완 필요</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
