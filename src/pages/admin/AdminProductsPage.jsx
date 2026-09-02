import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ImageUploader } from '../../components/admin/ImageUploader.jsx';
import { api } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Edit2, Trash2, Search, Filter, PlusCircle, MinusCircle, AlertCircle, X, Image as ImageIcon } from 'lucide-react';

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const { showToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Product Form State
  const [formData, setFormData] = useState({
    sku: '',
    category_id: '',
    name_ko: '',
    name_en: '',
    description_ko: '',
    description_en: '',
    price: '',
    discount_price: '',
    stock: 20,
    is_new: true,
    is_best: false,
    status: 'active',
    images: [''],
    sizes: ['S', 'M', 'L'],
    colors: [{ name_ko: '블랙', name_en: 'Black', hex: '#111112' }],
    fabric_ko: '',
    care_ko: '',
    fit_ko: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (stockFilter !== 'all') params.append('stockStatus', stockFilter);

      const [prodRes, catRes] = await Promise.all([
        api.get(`/admin/products?${params.toString()}`),
        api.get('/admin/categories'),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Fetch admin products failed:', err);
      showToast('상품 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, stockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      sku: `NE-${Date.now().toString().slice(-6)}`,
      category_id: categories[0]?.id || 1,
      name_ko: '',
      name_en: '',
      description_ko: '',
      description_en: '',
      price: '',
      discount_price: '',
      stock: 30,
      is_new: true,
      is_best: false,
      status: 'active',
      images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [{ name_ko: '블랙', name_en: 'Black', hex: '#111112' }],
      fabric_ko: '코튼 100%',
      care_ko: '찬물 단독 세탁 권장',
      fit_ko: '오버사이즈 릴렉스드 핏',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditMode(true);
    setEditingId(p.id);
    const details = p.details || {};
    setFormData({
      sku: p.sku,
      category_id: p.category_id,
      name_ko: p.name_ko,
      name_en: p.name_en,
      description_ko: p.description_ko || '',
      description_en: p.description_en || '',
      price: p.price,
      discount_price: p.discount_price || '',
      stock: p.stock,
      is_new: Boolean(p.is_new),
      is_best: Boolean(p.is_best),
      status: p.status || 'active',
      images: p.images?.length > 0 ? p.images : [''],
      sizes: p.sizes?.length > 0 ? p.sizes : ['FREE'],
      colors: p.colors?.length > 0 ? p.colors : [{ name_ko: '단일상품', name_en: 'Default', hex: '#111' }],
      fabric_ko: details.fabric_ko || details.fabric || '',
      care_ko: details.care_ko || details.care_en || '',
      fit_ko: details.fit_ko || details.fit || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        stock: Number(formData.stock),
        details: {
          fabric_ko: formData.fabric_ko,
          care_ko: formData.care_ko,
          fit_ko: formData.fit_ko,
        },
      };

      if (isEditMode) {
        await api.put(`/admin/products/${editingId}`, payload);
        showToast('상품 정보가 성공적으로 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast('새 상품이 등록되었습니다.', 'success');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/admin/products/${id}`);
      showToast('상품이 삭제되었습니다.', 'info');
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err) {
      showToast('상품 삭제 실패', 'error');
    }
  };

  const handleQuickStock = async (id, delta) => {
    try {
      await api.patch(`/admin/products/${id}/stock`, { delta });
      showToast('재고 수량이 업데이트되었습니다.', 'success');
      fetchProducts();
    } catch (err) {
      showToast('재고 변경 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="products">
      <div>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>상품 관리 (Product Management)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              전체 상품 목록 조회, 신규 상품 등록, 재고 실시간 수정 및 삭제
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '12px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 상품 등록</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="all">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ko} ({c.name_en})
                </option>
              ))}
            </select>

            {/* Stock Level Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="all">전체 재고 상태</option>
              <option value="in">재고 원활 (&gt; 15개)</option>
              <option value="low">품절 임박 (1 ~ 15개)</option>
              <option value="out">품절 (0개)</option>
            </select>
          </div>

          {/* Search Form */}
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

        {/* Product List Table */}
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
                  <th style={{ padding: '14px 16px' }}>판매가 (KRW)</th>
                  <th style={{ padding: '14px 16px' }}>재고 수량</th>
                  <th style={{ padding: '14px 16px' }}>구분</th>
                  <th style={{ padding: '14px 16px' }}>상태</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      상품 데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                      {/* Product Thumbnail & Name */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={p.images?.[0] || ''}
                            alt=""
                            style={{ width: '44px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div>
                            <p style={{ fontWeight: 600, color: '#18181b' }}>{p.name_ko}</p>
                            <p style={{ fontSize: '0.75rem', color: '#71717a' }}>{p.name_en}</p>
                            <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#999' }}>SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px', color: '#52525b' }}>
                        {p.category_name_ko}
                      </td>

                      {/* Price */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700 }}>{formatKRW(p.discount_price || p.price)}</span>
                        {p.discount_price && (
                          <span style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through', display: 'block' }}>
                            {formatKRW(p.price)} (-{p.discount_rate}%)
                          </span>
                        )}
                      </td>

                      {/* Stock with quick modifier */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: p.stock <= 0 ? '#dc2626' : p.stock <= 15 ? 'var(--accent-sunset)' : '#16a34a',
                            }}
                          >
                            {p.stock}개
                          </span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              onClick={() => handleQuickStock(p.id, -1)}
                              title="재고 -1"
                              style={{ padding: '2px 5px', backgroundColor: '#f4f4f5', borderRadius: '3px', color: '#555' }}
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleQuickStock(p.id, 5)}
                              title="재고 +5"
                              style={{ padding: '2px 5px', backgroundColor: '#f4f4f5', borderRadius: '3px', color: '#555' }}
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Badges */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {p.is_new ? <span style={{ fontSize: '0.6875rem', padding: '2px 5px', backgroundColor: '#18181b', color: '#fff', borderRadius: '2px' }}>NEW</span> : null}
                          {p.is_best ? <span style={{ fontSize: '0.6875rem', padding: '2px 5px', backgroundColor: 'var(--accent-sunset)', color: '#fff', borderRadius: '2px' }}>BEST</span> : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            backgroundColor: p.status === 'active' ? '#dcfce7' : '#f4f4f5',
                            color: p.status === 'active' ? '#166534' : '#71717a',
                            fontWeight: 600,
                          }}
                        >
                          {p.status === 'active' ? '판매중' : '비공개'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', color: '#27272a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit2 size={13} />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            style={{ padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={13} />
                            <span>삭제</span>
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

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="backdrop" onClick={() => setDeleteConfirmId(null)} style={{ zIndex: 110 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '420px',
                margin: '120px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: 'var(--shadow-xl)',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>상품을 삭제하시겠습니까?</h3>
              <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '24px' }}>
                삭제된 상품은 복구할 수 없습니다. 계속하시겠습니까?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary" style={{ flex: 1 }}>
                  취소
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirmId)}
                  className="btn-primary"
                  style={{ flex: 1, backgroundColor: '#dc2626' }}
                >
                  확인 및 삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Product Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                margin: '40px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {isEditMode ? '상품 정보 수정 (Edit Product)' : '새 상품 등록 (Add Product)'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ color: '#71717a' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveProduct} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 상품명 (Korean Name) *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_ko}
                      onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                      placeholder="예: 시그니처 오버사이즈 울 블레이저"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 상품명 (English Name) *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="e.g. Signature Oversized Wool Blazer"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Category & SKU */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">카테고리 *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="form-select"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name_ko} ({c.name_en})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">상품 SKU 번호</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="NE-JK-001"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">정상 판매가 (KRW ₩) *</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="248000"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">할인가 (선택)</label>
                    <input
                      type="number"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                      placeholder="218000"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">초기 재고 수량 *</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">한글 상세 설명</label>
                  <textarea
                    rows={3}
                    value={formData.description_ko}
                    onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 상세 설명 (English Description)</label>
                  <textarea
                    rows={2}
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                {/* Image Upload Component */}
                <ImageUploader
                  images={formData.images}
                  onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                  maxImages={10}
                  label="상품 사진 파일 업로드 (Product Photos)"
                />

                {/* Badges & Status Toggles */}
                <div style={{ display: 'flex', gap: '24px', padding: '16px', backgroundColor: '#f4f4f6', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_new}
                      onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    />
                    <span>NEW 신상품 뱃지</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_best}
                      onChange={(e) => setFormData({ ...formData, is_best: e.target.checked })}
                    />
                    <span>BEST 베스트 뱃지</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'draft' })}
                    />
                    <span>공개 판매 활성화 (Active)</span>
                  </label>
                </div>

                {/* Modal Footer CTA */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>
                    {isEditMode ? '수정 내용 저장' : '새 상품 등록 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
