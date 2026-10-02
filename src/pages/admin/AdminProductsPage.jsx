import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ImageUploader } from '../../components/admin/ImageUploader.jsx';
import { api, adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { TableSkeleton } from '../../components/admin/AdminSkeleton.jsx';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Tag,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const COMMON_SIZES = ['S', 'M', 'L', 'XL', 'FREE'];
const PRESET_COLORS = [
  { name_ko: '블랙', name_en: 'Black', hex: '#111112' },
  { name_ko: '화이트', name_en: 'White', hex: '#ffffff' },
  { name_ko: '크림', name_en: 'Cream', hex: '#fdfbf7' },
  { name_ko: '오트밀', name_en: 'Oatmeal', hex: '#e8e3d9' },
  { name_ko: '그레이', name_en: 'Grey', hex: '#9ca3af' },
  { name_ko: '차콜', name_en: 'Charcoal', hex: '#374151' },
  { name_ko: '네이비', name_en: 'Navy', hex: '#1e3a8a' },
  { name_ko: '베이지', name_en: 'Beige', hex: '#d4b996' },
  { name_ko: '브라운', name_en: 'Brown', hex: '#78350f' },
  { name_ko: '레드', name_en: 'Red', hex: '#dc2626' },
  { name_ko: '와인', name_en: 'Wine', hex: '#7f1d1d' },
  { name_ko: '스카이', name_en: 'Sky', hex: '#7dd3fc' },
  { name_ko: '핑크', name_en: 'Pink', hex: '#f9a8d4' },
  { name_ko: '민트', name_en: 'Mint', hex: '#a7f3d0' },
  { name_ko: '라벤더', name_en: 'Lavender', hex: '#c4b5fd' },
  { name_ko: '올리브', name_en: 'Olive', hex: '#65a30d' },
  { name_ko: '버터', name_en: 'Butter', hex: '#fde68a' },
  { name_ko: '카멜', name_en: 'Camel', hex: '#d6a66a' },
  { name_ko: '스틸', name_en: 'Steel', hex: '#64748b' },
  { name_ko: '아이보리', name_en: 'Ivory', hex: '#fffff0' },
];

// Same priority as the backend combosFromBody (api/admin.js) so table keys
// always match variant rows: name_en first, then name_ko, name, DEFAULT.
const colorKey = (c) => (typeof c === 'string' ? c : (c?.name_en || c?.name_ko || c?.name || 'DEFAULT'));
const comboKey = (c, size) => `${colorKey(c)}|||${size}`;
const cellFilled = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const cellHeadStyle = {
  padding: '8px 10px',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#52525b',
  backgroundColor: '#f4f4f5',
  border: '1px solid #e4e4e7',
  whiteSpace: 'nowrap',
};

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [specialFilter, setSpecialFilter] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;
  const { showToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    category_id: '',
    name_ko: '',
    name_en: '',
    description_ko: '',
    description_en: '',
    material_ko: '',
    material_en: '',
    price: '',
    discount_price: '',
    is_new: true,
    is_sale: false,
    is_best: false,
    status: 'active',
    images: [],
    sizes: ['S', 'M', 'L'],
    colors: [{ name_ko: '블랙', name_en: 'Black', hex: '#111112' }],
    // Color×Size combo stock: key `${color}|||${size}`, value '' = not offered.
    variant_stock: {},
  });

  // Custom color draft (name + hex picker) appended to presets
  const [newColor, setNewColor] = useState({ name_ko: '', name_en: '', hex: '#18181b' });

  const fetchProducts = async (reset = true) => {
    const targetPage = reset ? 0 : page;
    if (reset) setPage(0);
    setLoading(true);
    try {
      setErrorMsg('');
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (stockFilter !== 'all') params.append('stockStatus', stockFilter);
      if (specialFilter !== 'all') params.append('filterType', specialFilter);
      params.append('limit', String(LIMIT));
      params.append('offset', String(targetPage * LIMIT));

      const [prodRes, catRes] = await Promise.all([
        adminApi.get(`/admin/products?${params.toString()}`),
        reset ? adminApi.get('/admin/categories') : Promise.resolve({ success: false }),
      ]);

      if (prodRes.success) {
        const list = prodRes.data || [];
        setProducts(prev => reset ? list : [...prev, ...list]);
        setTotal(prodRes.total ?? list.length);
        setHasMore(list.length === LIMIT && (prodRes.total ?? 0) > (targetPage + 1) * LIMIT);
        if (reset) setPage(1);
        else setPage(p => p + 1);
      }
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      const msg = err?.message || '';
      console.error('Fetch admin products failed:', err);
      if (msg.includes('401') || msg.includes('SIGN_IN_REQUIRED') || msg.includes('SESSION_EXPIRED')) {
        setErrorMsg('관리자 로그인이 필요합니다. /admin/login 에서 Google 계정으로 로그인하세요.');
      } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        setErrorMsg('관리자 권한이 없습니다. staff_members에 super_admin/admin으로 등록된 Google 계정으로 로그인하세요.');
      } else {
        setErrorMsg(msg || '상품 목록을 불러오지 못했습니다.');
        showToast(msg || '상품 목록을 불러오지 못했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, [selectedCategory, stockFilter, specialFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(true);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewColor({ name_ko: '', name_en: '', hex: '#18181b' });
    setFormData({
      sku: `NE-${Date.now().toString().slice(-6)}`,
      category_id: categories[0]?.id || 1,
      name_ko: '',
      name_en: '',
      description_ko: '',
      description_en: '',
      material_ko: '100% 코튼',
      material_en: '100% Cotton',
      price: '',
      discount_price: '',
      is_new: true,
      is_sale: false,
      is_best: false,
      status: 'active',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [{ name_ko: '블랙', name_en: 'Black', hex: '#111112' }],
      variant_stock: {},
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditMode(true);
    setEditingId(p.id);
    setNewColor({ name_ko: '', name_en: '', hex: '#18181b' });
    // Preserve per-image color mapping for reorder plan (media has color, images is fallback)
    const mediaWithColor = Array.isArray(p.media) && p.media.length
      ? p.media.map(m => ({ url: m.url, color: m.color || null, variant_id: m.variant_id || null }))
      : (p.images || []).map(url => (typeof url === 'string' ? { url, color: null } : url));
    // Prefill combo stock from existing variants (blank = combo not offered)
    const variant_stock = {};
    (p.variants || []).forEach(v => {
      variant_stock[comboKey({ name_en: v.color }, v.size)] = String(v.stock ?? 0);
    });
    setFormData({
      sku: p.sku || '',
      category_id: p.category_id,
      name_ko: p.name_ko || '',
      name_en: p.name_en || '',
      description_ko: p.description_ko || '',
      description_en: p.description_en || '',
      material_ko: p.material_ko || p.material || '',
      material_en: p.material_en || '',
      price: p.price || '',
      discount_price: p.discount_price || '',
      is_new: Boolean(p.is_new),
      is_sale: Boolean(p.is_sale || (p.discount_price && p.discount_price < p.price)),
      is_best: Boolean(p.is_best),
      status: p.status || 'active',
      images: mediaWithColor,
      sizes: p.sizes?.length > 0 ? p.sizes : ['FREE'],
      colors: p.colors?.length > 0 ? p.colors : [{ name_ko: '블랙', name_en: 'Black', hex: '#111' }],
      variant_stock,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    // Build the offered-combo map: only filled cells are sent (blank = not
    // offered), validated as integers 0..99999.
    const variant_stock = {};
    for (const c of formData.colors) {
      for (const sz of formData.sizes) {
        const raw = formData.variant_stock[comboKey(c, sz)];
        if (!cellFilled(raw)) continue;
        const n = Math.round(Number(raw));
        if (!Number.isFinite(n) || n < 0 || n > 99999) {
          showToast(`재고 값이 올바르지 않습니다: ${colorKey(c)} / ${sz}`, 'error');
          return;
        }
        variant_stock[comboKey(c, sz)] = n;
      }
    }
    const emptyColors = formData.colors.filter(c => !formData.sizes.some(sz => cellFilled(formData.variant_stock[comboKey(c, sz)])));
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        variant_stock,
      };

      if (isEditMode) {
        await adminApi.put(`/admin/products/${editingId}`, payload);
        showToast('상품 정보가 성공적으로 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/products', payload);
        showToast('새 상품이 등록되었습니다.', 'success');
      }
      if (emptyColors.length) {
        showToast(`판매 조합 없는 색상(고객에게 숨김): ${emptyColors.map(colorKey).join(', ')}`, 'info');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'hidden' : 'active';
      await adminApi.patch(`/admin/products/${id}/status`, { status: nextStatus });
      showToast(`상품 상태가 ${nextStatus === 'active' ? '공개' : '비공개'}로 변경되었습니다.`, 'info');
      fetchProducts();
    } catch (err) {
      showToast('상태 변경 실패', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await adminApi.delete(`/admin/products/${id}`);
      showToast(res.message || '상품이 성공적으로 삭제되었습니다.', 'info');
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      showToast(err.message || '상품 삭제 실패', 'error');
    }
  };

  const handleQuickStock = async (id, delta) => {
    try {
      await adminApi.patch(`/admin/products/${id}/stock`, { delta });
      showToast('재고가 업데이트되었습니다.', 'success');
      fetchProducts();
    } catch (err) {
      showToast('재고 변경 실패', 'error');
    }
  };

  const toggleSizeSelection = (size) => {
    const current = [...formData.sizes];
    const index = current.indexOf(size);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(size);
    }
    setFormData({ ...formData, sizes: current });
  };

  const toggleColorSelection = (colorObj) => {
    const current = [...formData.colors];
    const exists = current.some((c) => c.name_en === colorObj.name_en);
    if (exists) {
      const next = current.filter((c) => c.name_en !== colorObj.name_en);
      setFormData({ ...formData, colors: next.length > 0 ? next : [colorObj] });
    } else {
      setFormData({ ...formData, colors: [...current, colorObj] });
    }
  };

  const addCustomColor = () => {
    const name_en = newColor.name_en.trim();
    const name_ko = newColor.name_ko.trim() || name_en;
    if (!name_en) {
      showToast('영문 색상명을 입력하세요 (예: Dusty Blue)', 'error');
      return;
    }
    if (formData.colors.some((c) => c.name_en === name_en)) {
      showToast('이미 존재하는 색상입니다.', 'error');
      return;
    }
    setFormData({ ...formData, colors: [...formData.colors, { name_ko, name_en, hex: newColor.hex }] });
    setNewColor({ name_ko: '', name_en: '', hex: '#18181b' });
  };

  const setComboCell = (color, size, value) => {
    setFormData({ ...formData, variant_stock: { ...formData.variant_stock, [comboKey(color, size)]: value } });
  };

  const fillAllBlankWithZero = () => {
    const next = { ...formData.variant_stock };
    for (const c of formData.colors) {
      for (const sz of formData.sizes) {
        const k = comboKey(c, sz);
        if (!cellFilled(next[k])) next[k] = '0';
      }
    }
    setFormData({ ...formData, variant_stock: next });
  };

  const clearAllCells = () => {
    const next = {};
    for (const c of formData.colors) {
      for (const sz of formData.sizes) next[comboKey(c, sz)] = '';
    }
    setFormData({ ...formData, variant_stock: next });
  };

  return (
    <AdminLayout activePage="products">
      <div>
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.875rem', lineHeight: 1.5 }}>
            <strong>상품 로드 실패:</strong> {errorMsg}
            <button onClick={fetchProducts} style={{ marginLeft: 12, padding: '6px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>다시 시도</button>
            <a href="/admin/login" style={{ marginLeft: 8, color: '#dc2626', textDecoration: 'underline', fontSize: '0.8125rem' }}>로그인 페이지로 이동 →</a>
          </div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>상품 관리 (Product Management)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              전체 상품 등록, 실시간 한/영 다국어 데이터 수정, 사진 관리, 재고 및 공개 상태 변경
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '12px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 상품 등록 (Add Product)</span>
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
              <option value="all">전체 카테고리 (All Categories)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ko} ({c.name_en})
                </option>
              ))}
            </select>

            {/* Special Filter (New / Sale / Out of Stock) */}
            <select
              value={specialFilter}
              onChange={(e) => setSpecialFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="all">전체 필터 (All Items)</option>
              <option value="new">⭐ New Arrivals (신상품)</option>
              <option value="sale">🏷️ Sale (세일/할인 상품)</option>
              <option value="in_stock">✅ In Stock (재고 있음)</option>
              <option value="out_of_stock">❌ Out of Stock (품절 상품)</option>
            </select>

            {/* Stock Level Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="all">전체 수량 필터</option>
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
                placeholder="상품명, SKU, ID 검색"
                className="form-input"
                style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem', width: '240px' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              검색
            </button>
          </form>
        </div>

        {/* Product Table */}
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
                  <th style={{ padding: '14px 16px', width: '60px' }}>ID / 순서</th>
                  <th style={{ padding: '14px 20px' }}>상품 정보 (Product Info)</th>
                  <th style={{ padding: '14px 16px' }}>카테고리</th>
                  <th style={{ padding: '14px 16px' }}>판매가 (Price)</th>
                  <th style={{ padding: '14px 16px' }}>재고 (Stock)</th>
                  <th style={{ padding: '14px 16px' }}>뱃지 (Badges)</th>
                  <th style={{ padding: '14px 16px' }}>공개 상태</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리 (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <TableSkeleton rows={5} cols={8} />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      조건에 일치하는 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f2', opacity: p.status === 'hidden' ? 0.6 : 1 }}>
                      <td style={{ padding: '14px 16px', color: '#71717a', fontWeight: 600 }}>
                        #{p.id}
                      </td>

                      {/* Product Main Image & Bilingual Names */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={p.images?.[0] || '/products/men/tshirts/classic-tshirt/1.jpg'}
                            alt=""
                            style={{ width: '48px', height: '62px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e4e4e7' }}
                          />
                          <div>
                            <p style={{ fontWeight: 700, color: '#18181b', fontSize: '0.9375rem' }}>{p.name_ko}</p>
                            <p style={{ fontSize: '0.75rem', color: '#71717a' }}>{p.name_en}</p>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#999' }}>SKU: {p.sku}</span>
                              {p.material_ko && (
                                <span style={{ fontSize: '0.6875rem', color: '#52525b', backgroundColor: '#f4f4f5', padding: '1px 5px', borderRadius: '3px' }}>
                                  {p.material_ko}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px', color: '#52525b', fontWeight: 500 }}>
                        {p.category_name_ko}
                        <span style={{ fontSize: '0.6875rem', color: '#a1a1aa', display: 'block' }}>{p.category_name_en}</span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#18181b' }}>{formatKRW(p.discount_price || p.price)}</span>
                        {p.discount_price && (
                          <span style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through', display: 'block' }}>
                            {formatKRW(p.price)} (-{p.discount_rate}%)
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.875rem',
                              color: p.stock <= 0 ? '#dc2626' : p.stock <= 15 ? 'var(--accent-sunset)' : '#16a34a',
                            }}
                          >
                            {p.stock <= 0 ? '품절 (0개)' : `${p.stock}개`}
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
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {p.is_new ? <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: '#18181b', color: '#fff', borderRadius: '2px', fontWeight: 700 }}>NEW</span> : null}
                          {p.is_sale ? <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: '#dc2626', color: '#fff', borderRadius: '2px', fontWeight: 700 }}>SALE</span> : null}
                          {p.is_best ? <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--accent-sunset)', color: '#fff', borderRadius: '2px', fontWeight: 700 }}>BEST</span> : null}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleToggleStatus(p.id, p.status)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: p.status === 'active' ? '#dcfce7' : '#fee2e2',
                            color: p.status === 'active' ? '#166534' : '#991b1b',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {p.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{p.status === 'active' ? '공개중' : '숨김(비공개)'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', color: '#27272a', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #e4e4e7', cursor: 'pointer' }}
                          >
                            <Edit2 size={13} />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            style={{ padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #fca5a5', cursor: 'pointer' }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f0f0f2', backgroundColor: '#fafafa', fontSize: '0.75rem', color: '#71717a' }}>
            <span>총 {total}개 중 {products.length}개 표시</span>
            <span style={{ fontSize: '0.6875rem', color: '#a1a1aa' }}>Supabase free-tier: 20개씩 lazy load</span>
          </div>
        </div>

        {hasMore && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button
              onClick={() => fetchProducts(false)}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '10px 24px', fontSize: '0.875rem', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '로딩 중...' : `더 보기 (${products.length}/${total})`}
            </button>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <div style={{ textAlign: 'center', padding: '16px', color: '#71717a', fontSize: '0.8125rem' }}>
            모든 상품을 불러왔습니다. ({total}개)
          </div>
        )}

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
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>상품을 완전히 삭제하시겠습니까?</h3>
              <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '24px' }}>
                삭제된 상품은 고객 웹사이트에서 즉시 제거되며 복구할 수 없습니다.
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
                maxWidth: '780px',
                maxHeight: '92vh',
                margin: '30px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                  {isEditMode ? '상품 정보 수정 (Edit Product)' : '새 상품 등록 (Add New Product)'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveProduct} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Language Management: Names */}
                <div style={{ backgroundColor: '#fbfbfb', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f2' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-sunset)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                    1. 언어 설정 - 상품명 (Product Names in KO & EN)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">한글 상품명 (Korean Name) *</label>
                      <input
                        type="text"
                        required
                        value={formData.name_ko}
                        onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                        placeholder="예: 노을 케이블 니트 가디건"
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
                        placeholder="e.g. NOEUL Cable Knit Cardigan"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Category & SKU */}
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
                      placeholder="NE-KN-001"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 3. Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">정상 판매가 (KRW ₩) *</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="89000"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">할인가 (Sale Price, 선택)</label>
                    <input
                      type="number"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                      placeholder="79000"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 4. Language Management: Materials & Descriptions */}
                <div style={{ backgroundColor: '#fbfbfb', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f2' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-sunset)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                    2. 언어 설정 - 소재 및 설명 (Material & Description)
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">한글 소재 (Korean Material)</label>
                      <input
                        type="text"
                        value={formData.material_ko}
                        onChange={(e) => setFormData({ ...formData, material_ko: e.target.value })}
                        placeholder="예: 코튼 100%, 울 80% 나일론 20%"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">영문 소재 (English Material)</label>
                      <input
                        type="text"
                        value={formData.material_en}
                        onChange={(e) => setFormData({ ...formData, material_en: e.target.value })}
                        placeholder="e.g. 100% Cotton, 80% Wool"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">한글 상세 설명</label>
                      <textarea
                        rows={3}
                        value={formData.description_ko}
                        onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })}
                        placeholder="상품의 디자인, 핏, 특장점을 작성하세요."
                        className="form-textarea"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">영문 상세 설명 (English Description)</label>
                      <textarea
                        rows={3}
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        placeholder="Enter detailed English description for international customers."
                        className="form-textarea"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Sizes & Colors Multi-Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Sizes */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">가능한 사이즈 (Available Sizes)</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {COMMON_SIZES.map((sz) => {
                        const selected = formData.sizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSizeSelection(sz)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              backgroundColor: selected ? 'var(--accent-sunset)' : '#f4f4f5',
                              color: selected ? '#ffffff' : '#52525b',
                              border: selected ? 'none' : '1px solid #e4e4e7',
                              cursor: 'pointer',
                            }}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">가능한 색상 (Available Colors)</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {PRESET_COLORS.map((cObj) => {
                        const selected = formData.colors.some((c) => c.name_en === cObj.name_en);
                        return (
                          <button
                            key={cObj.name_en}
                            type="button"
                            onClick={() => toggleColorSelection(cObj)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: selected ? '#18181b' : '#f4f4f5',
                              color: selected ? '#ffffff' : '#52525b',
                              border: selected ? 'none' : '1px solid #e4e4e7',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: cObj.hex,
                                border: '1px solid #ccc',
                              }}
                            />
                            <span>{cObj.name_ko} ({cObj.name_en})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom color: name + hex picker */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={newColor.name_ko}
                        onChange={(e) => setNewColor({ ...newColor, name_ko: e.target.value })}
                        placeholder="한글명 (더스티 블루)"
                        className="form-input"
                        style={{ width: '130px', padding: '6px 8px', fontSize: '0.75rem' }}
                      />
                      <input
                        type="text"
                        value={newColor.name_en}
                        onChange={(e) => setNewColor({ ...newColor, name_en: e.target.value })}
                        placeholder="English (Dusty Blue)"
                        className="form-input"
                        style={{ width: '140px', padding: '6px 8px', fontSize: '0.75rem' }}
                      />
                      <input
                        type="color"
                        value={newColor.hex}
                        onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                        title="색상 선택"
                        style={{ width: '32px', height: '30px', padding: '2px', border: '1px solid #e4e4e7', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                      />
                      <button
                        type="button"
                        onClick={addCustomColor}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#ffffff',
                          color: '#18181b',
                          border: '1px dashed #18181b',
                          cursor: 'pointer',
                        }}
                      >
                        + 색상 추가
                      </button>
                    </div>

                    {/* Custom colors added beyond presets (removable) */}
                    {formData.colors.filter((c) => !PRESET_COLORS.some((p) => p.name_en === c.name_en)).length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {formData.colors.filter((c) => !PRESET_COLORS.some((p) => p.name_en === c.name_en)).map((cObj) => (
                          <span
                            key={cObj.name_en}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: '#18181b',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cObj.hex, border: '1px solid #ccc' }} />
                            <span>{cObj.name_ko} ({cObj.name_en})</span>
                            <button
                              type="button"
                              onClick={() => toggleColorSelection(cObj)}
                              aria-label={`${cObj.name_en} 삭제`}
                              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0, fontSize: '0.875rem', lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Variant Stock Matrix — Color × Size mini table.
                    Blank cell = combo not offered; 0 = offered but sold out. */}
                <div style={{ backgroundColor: '#fbfbfb', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-sunset)', textTransform: 'uppercase' }}>
                      6. 옵션별 재고 (Color × Size Stock)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={fillAllBlankWithZero} style={{ padding: '5px 10px', fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '4px', cursor: 'pointer', color: '#52525b' }}>
                        빈칸 전체 0 채우기
                      </button>
                      <button type="button" onClick={clearAllCells} style={{ padding: '5px 10px', fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '4px', cursor: 'pointer', color: '#52525b' }}>
                        전체 비우기
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#71717a', margin: '0 0 10px' }}>
                    숫자를 입력하면 해당 조합을 판매합니다. 빈 칸은 판매하지 않는 조합이며, 0은 품절(판매 중)입니다.
                  </p>

                  {formData.sizes.length === 0 || formData.colors.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', margin: 0 }}>사이즈와 색상을 먼저 선택하세요.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ ...cellHeadStyle, textAlign: 'left' }}>색상 \\ 사이즈</th>
                            {formData.sizes.map((sz) => (
                              <th key={sz} style={cellHeadStyle}>{sz}</th>
                            ))}
                            <th style={{ ...cellHeadStyle, backgroundColor: '#f4f4f5' }}>합계</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.colors.map((c) => {
                            const rowTotals = formData.sizes.map((sz) => {
                              const raw = formData.variant_stock[comboKey(c, sz)];
                              return cellFilled(raw) ? Math.max(0, Math.round(Number(raw)) || 0) : null;
                            });
                            const rowSum = rowTotals.reduce((s, v) => s + (v || 0), 0);
                            const hasAny = rowTotals.some((v) => v !== null);
                            return (
                              <tr key={colorKey(c)}>
                                <th scope="row" style={{ ...cellHeadStyle, textAlign: 'left', whiteSpace: 'nowrap' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex || '#d4d4d8', border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
                                    {c.name_ko} ({colorKey(c)})
                                  </span>
                                </th>
                                {formData.sizes.map((sz) => {
                                  const key = comboKey(c, sz);
                                  const val = formData.variant_stock[key] ?? '';
                                  const filled = cellFilled(val);
                                  return (
                                    <td key={sz} style={{ border: '1px solid #e4e4e7', padding: '4px', textAlign: 'center' }}>
                                      <input
                                        type="number"
                                        min="0"
                                        max="99999"
                                        value={val}
                                        onChange={(e) => setComboCell(c, sz, e.target.value)}
                                        placeholder="–"
                                        aria-label={`${colorKey(c)} ${sz} 재고`}
                                        style={{
                                          width: '58px',
                                          padding: '6px 4px',
                                          fontSize: '0.8125rem',
                                          textAlign: 'center',
                                          border: filled ? '1px solid #d4d4d8' : '1px dashed #d4d4d8',
                                          borderRadius: '4px',
                                          backgroundColor: filled ? '#ffffff' : '#f4f4f5',
                                          color: filled && Number(val) === 0 ? '#a1a1aa' : '#18181b',
                                          font: 'inherit',
                                          outline: 'none',
                                        }}
                                      />
                                    </td>
                                  );
                                })}
                                <td style={{ border: '1px solid #e4e4e7', padding: '4px 8px', textAlign: 'center', fontWeight: 700, backgroundColor: '#fafafa', color: hasAny ? '#18181b' : '#a1a1aa' }}>
                                  {hasAny ? rowSum : '–'}
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <th style={{ ...cellHeadStyle, textAlign: 'left', backgroundColor: '#f4f4f5' }}>사이즈 합계</th>
                            {formData.sizes.map((sz) => {
                              const colSum = formData.colors.reduce((s, c) => {
                                const raw = formData.variant_stock[comboKey(c, sz)];
                                return s + (cellFilled(raw) ? Math.max(0, Math.round(Number(raw)) || 0) : 0);
                              }, 0);
                              const any = formData.colors.some((c) => cellFilled(formData.variant_stock[comboKey(c, sz)]));
                              return (
                                <td key={sz} style={{ ...cellHeadStyle, backgroundColor: '#f4f4f5', textAlign: 'center' }}>
                                  {any ? colSum : '–'}
                                </td>
                              );
                            })}
                            <td style={{ ...cellHeadStyle, backgroundColor: '#ececec', textAlign: 'center' }}>
                              {formData.colors.reduce((s, c) => s + formData.sizes.reduce((ss, sz) => {
                                const raw = formData.variant_stock[comboKey(c, sz)];
                                return ss + (cellFilled(raw) ? Math.max(0, Math.round(Number(raw)) || 0) : 0);
                              }, 0), 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 7. Product Image Manager — reorder plan: each image can be linked to a color (e.g., 2 blue, 3 green). On storefront, selecting blue reorders that color's images first, still shows all 5. */}
                <ImageUploader
                  images={formData.images}
                  onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                  maxImages={10}
                  label="상품 이미지 관리 (Product Photos - 첫 번째 사진이 메인, 색상 지정 시 해당 색상 선택 시 먼저 표시)"
                  availableColors={formData.colors}
                />

                {/* 8. Badges & Visibility Status Flags */}
                <div style={{ display: 'flex', gap: '20px', padding: '16px', backgroundColor: '#f4f4f6', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_new}
                      onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    />
                    <span>⭐ New Arrival (신상품 뱃지)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_sale}
                      onChange={(e) => setFormData({ ...formData, is_sale: e.target.checked })}
                    />
                    <span>🏷️ Sale (세일/할인 뱃지)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'hidden' })}
                    />
                    <span>👁️ 고객 웹사이트에 공개 (Show on Website)</span>
                  </label>
                </div>

                {/* Submit Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>
                    {isEditMode ? '수정 내용 저장하기' : '새 상품 등록 완료'}
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

