import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ImageUploader } from '../../components/admin/ImageUploader.jsx';
import {
  PageHeader,
  Filters,
  DataTable,
  Pagination,
  ErrorBanner,
  ConfirmModal,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({ key: 'id', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const PAGE_SIZE = 20;
  const { showToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

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
    gender: 'women',
    is_new: true,
    is_sale: false,
    is_best: false,
    best_rank: '',
    status: 'active',
    images: [],
    sizes: ['S', 'M', 'L'],
    colors: [{ name_ko: '블랙', name_en: 'Black', hex: '#111112' }],
    // Color×Size combo stock: key `${color}|||${size}`, value '' = not offered.
    variant_stock: {},
  });

  // Custom color draft (name + hex picker) appended to presets
  const [newColor, setNewColor] = useState({ name_ko: '', name_en: '', hex: '#18181b' });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim(),
        sort: sort.key,
        dir: sort.dir,
        category: selectedCategory,
        stockStatus: stockFilter,
        filterType: specialFilter,
      });

      const [prodRes, catRes] = await Promise.all([
        adminApi.get(`/admin/products${qs}`),
        categories.length ? Promise.resolve({ success: false }) : adminApi.get('/admin/categories'),
      ]);

      if (prodRes.success) {
        const { data, total: t } = normalizeListResponse(prodRes, page, PAGE_SIZE);
        setProducts(data || []);
        setTotal(t);
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
    fetchProducts();
  }, [selectedCategory, stockFilter, specialFilter, page, sort, search]);

  const resetPage = (fn) => (v) => { fn(v); setPage(1); };

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
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
      gender: 'women',
      is_new: true,
      is_sale: false,
      is_best: false,
      best_rank: '',
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
      gender: ['men', 'women', 'unisex'].includes(p.gender) ? p.gender : 'women',
      is_new: Boolean(p.is_new),
      is_sale: Boolean(p.is_sale || (p.discount_price && p.discount_price < p.price)),
      is_best: Boolean(p.is_best),
      best_rank: p.best_rank ?? '',
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
    const nextStatus = currentStatus === 'active' ? 'hidden' : 'active';
    const prev = products;
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
    try {
      await adminApi.patch(`/admin/products/${id}/status`, { status: nextStatus });
      showToast(`상품 상태가 ${nextStatus === 'active' ? '공개' : '비공개'}로 변경되었습니다.`, 'info');
    } catch (err) {
      setProducts(prev);
      showToast(err?.message || '상태 변경 실패', 'error');
    }
  };

  // Open the delete dialog for a single product (resets the ordered-block state).
  const askDelete = (id) => {
    setDeleteBlocked(false);
    setDeleteConfirmId(id);
  };

  const closeDeleteDialog = () => {
    setDeleteConfirmId(null);
    setDeleteBlocked(false);
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await adminApi.delete(`/admin/products/${id}`);
      showToast(res.message || '상품이 성공적으로 삭제되었습니다.', 'info');
      closeDeleteDialog();
      fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      const code = err.message || '';
      if (code === 'PRODUCT_ORDERED') {
        // Order history pins the row — keep the dialog open and offer the
        // recommended next step (hide) instead of a toast dead end.
        setDeleteBlocked(true);
        return;
      }
      const friendly = code === 'PRODUCT_DELETE_FAILED'
        ? '상품 삭제에 실패했습니다. 연결된 데이터(주문·리뷰·장바구니)를 확인한 후 다시 시도해 주세요.'
        : null;
      showToast(friendly || code || '상품 삭제 실패', 'error');
      closeDeleteDialog();
    }
  };

  const handleQuickStock = async (id, delta) => {
    const prev = products;
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p)));
    try {
      const res = await adminApi.patch(`/admin/products/${id}/stock`, { delta });
      if (res && Number.isFinite(Number(res.stock))) {
        setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, stock: Number(res.stock) } : p)));
      }
    } catch (err) {
      setProducts(prev);
      showToast(err?.message || '재고 변경 실패', 'error');
    }
  };

  // One-click BEST toggle — controls homepage top strip (no backend change:
  // PUT already accepts partial { is_best }).
  const handleToggleBest = async (p) => {
    const prev = products;
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, is_best: !p.is_best } : x)));
    try {
      await adminApi.put(`/admin/products/${p.id}`, { is_best: !p.is_best });
      showToast(
        !p.is_best
          ? `BEST로 지정됨 — 홈페이지 상단에 노출됩니다: ${p.name_ko || p.name_en}`
          : `BEST 해제됨: ${p.name_ko || p.name_en}`,
        'success'
      );
    } catch (err) {
      setProducts(prev);
      showToast(err.message || 'BEST 변경 실패', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === products.length && products.length > 0 ? new Set() : new Set(products.map((p) => p.id))));
  };

  const runBulk = async () => {
    if (!bulkAction) return;
    const ids = [...selectedIds];
    if (!ids.length) { setBulkAction(null); return; }
    setBulkBusy(true);
    let ok = 0;
    let fail = 0;
    let orderedBlocked = 0;
    for (const id of ids) {
      try {
        if (bulkAction === 'publish') await adminApi.patch(`/admin/products/${id}/status`, { status: 'active' });
        else if (bulkAction === 'hide') await adminApi.patch(`/admin/products/${id}/status`, { status: 'hidden' });
        else await adminApi.delete(`/admin/products/${id}`);
        ok += 1;
      } catch (err) {
        fail += 1;
        if (err?.message === 'PRODUCT_ORDERED') orderedBlocked += 1;
      }
    }
    setBulkBusy(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    if (bulkAction === 'delete' && orderedBlocked) {
      showToast(`${ok}개 삭제, ${orderedBlocked}개는 주문 내역이 있어 건너뜀${fail - orderedBlocked ? ` (기타 실패 ${fail - orderedBlocked}건)` : ''}`, fail ? 'error' : 'info');
    } else {
      showToast(fail ? `${ok}건 처리, ${fail}건 실패` : `${ok}건 처리되었습니다.`, fail ? 'error' : 'success');
    }
    fetchProducts();
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

  const columns = [
    {
      key: 'product',
      label: '상품 정보 Product Info',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: p.status === 'hidden' ? 0.6 : 1 }}>
          <img
            src={p.images?.[0] || '/products/men/tshirts/classic-tshirt/1.jpg'}
            alt=""
            style={{ width: '48px', height: '62px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e4e4e7' }}
          />
          <div>
            <p style={{ fontWeight: 700, color: '#18181b', fontSize: '0.9375rem', margin: 0 }}>#{p.id} {p.name_ko}</p>
            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{p.name_en}</p>
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
      ),
    },
    {
      key: 'category',
      label: '카테고리 Category',
      render: (p) => (
        <div style={{ color: '#52525b', fontWeight: 500 }}>
          {p.category_name_ko}
          <span style={{ fontSize: '0.6875rem', color: '#a1a1aa', display: 'block' }}>{p.category_name_en}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: '판매가 Price',
      sortable: true,
      render: (p) => (
        <div>
          <span style={{ fontWeight: 700, color: '#18181b' }}>{formatKRW(p.discount_price || p.price)}</span>
          {p.discount_price && (
            <span style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through', display: 'block' }}>
              {formatKRW(p.price)} (-{p.discount_rate}%)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: '재고 Stock',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.875rem',
              color: p.stock <= 0 ? '#dc2626' : p.stock <= 15 ? 'var(--adm-accent)' : '#16a34a',
            }}
          >
            {p.stock <= 0 ? '품절 (0개)' : `${p.stock}개`}
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              type="button"
              onClick={() => handleQuickStock(p.id, -1)}
              title="재고 -1"
              aria-label={`${p.name_ko} 재고 -1`}
              className="adm-btn"
              style={{ padding: '2px 5px', fontSize: '0.75rem' }}
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => handleQuickStock(p.id, 5)}
              title="재고 +5"
              aria-label={`${p.name_ko} 재고 +5`}
              className="adm-btn"
              style={{ padding: '2px 5px', fontSize: '0.75rem' }}
            >
              +5
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'badges',
      label: '뱃지 Badges',
      render: (p) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {p.is_new ? <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: '#18181b', color: '#fff', borderRadius: '2px', fontWeight: 700 }}>NEW</span> : null}
          {p.is_sale ? <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: '#dc2626', color: '#fff', borderRadius: '2px', fontWeight: 700 }}>SALE</span> : null}
          <button
            type="button"
            onClick={() => handleToggleBest(p)}
            title={p.is_best ? 'BEST 해제 (홈페이지 상단에서 제거)' : 'BEST 지정 (홈페이지 상단에 노출)'}
            style={{
              fontSize: '0.625rem', padding: '2px 6px',
              backgroundColor: p.is_best ? 'var(--adm-accent)' : '#f4f4f5',
              color: p.is_best ? '#fff' : '#a1a1aa',
              border: p.is_best ? 'none' : '1px dashed #d4d4d8',
              borderRadius: '2px', fontWeight: 700, cursor: 'pointer',
            }}
          >
                            {p.is_best ? 'BEST ✓' : 'BEST +'}
                          </button>
                          {p.is_best && p.best_rank !== null && p.best_rank !== undefined && p.best_rank !== '' && (
                            <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#71717a' }}>#{p.best_rank}</span>
                          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: '공개 상태 Visibility',
      render: (p) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(p.id, p.status)}
          aria-label={`${p.name_ko} ${p.status === 'active' ? '숨기기' : '공개하기'}`}
          style={{
            fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px',
            backgroundColor: p.status === 'active' ? '#dcfce7' : '#fee2e2',
            color: p.status === 'active' ? '#166534' : '#991b1b',
            fontWeight: 700, border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}
        >
          {p.status === 'active' ? <Eye size={12} aria-hidden /> : <EyeOff size={12} aria-hidden />}
          <span>{p.status === 'active' ? '공개중' : '숨김(비공개)'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '관리 Actions',
      align: 'right',
      render: (p) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={() => openEditModal(p)}
            className="adm-btn"
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          >
            <Edit2 size={13} aria-hidden />
            <span>수정</span>
          </button>
          <button
            type="button"
            onClick={() => askDelete(p.id)}
            className="adm-btn"
            style={{ padding: '6px 10px', fontSize: '0.8125rem', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            <Trash2 size={13} aria-hidden />
            <span>삭제</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout activePage="products">
      <div>
        <PageHeader
          ko="상품 관리"
          en="Product Management"
          desc="전체 상품 등록, 실시간 한/영 다국어 데이터 수정, 사진 관리, 재고 및 공개 상태 변경"
          actions={(
            <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
              <Plus size={16} aria-hidden />
              <span>새 상품 등록 (Add Product)</span>
            </button>
          )}
        />
        <ErrorBanner message={errorMsg ? `상품 로드 실패: ${errorMsg}` : ''} onRetry={fetchProducts} />

        <Filters
          searchValue={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="상품명, SKU, ID 검색 Search…"
          selects={[
            {
              name: 'category', value: selectedCategory, onChange: resetPage(setSelectedCategory), ariaLabel: '카테고리 Category',
              options: [
                { value: 'all', label: '전체 카테고리 (All Categories)' },
                ...categories.map((c) => ({ value: String(c.id), label: `${c.name_ko} (${c.name_en})` })),
              ],
            },
            {
              name: 'special', value: specialFilter, onChange: resetPage(setSpecialFilter), ariaLabel: '특별 필터 Special filter',
              options: [
                { value: 'all', label: '전체 필터 (All Items)' },
                { value: 'new', label: '⭐ New Arrivals (신상품)' },
                { value: 'best', label: '🔥 Best (베스트 — 홈페이지 상단 노출)' },
                { value: 'sale', label: '🏷️ Sale (세일/할인 상품)' },
                { value: 'in_stock', label: '✅ In Stock (재고 있음)' },
                { value: 'out_of_stock', label: '❌ Out of Stock (품절 상품)' },
              ],
            },
            {
              name: 'stock', value: stockFilter, onChange: resetPage(setStockFilter), ariaLabel: '재고 수량 Stock level',
              options: [
                { value: 'all', label: '전체 수량 필터 All' },
                { value: 'in', label: '재고 원활 (> 15개)' },
                { value: 'low', label: '품절 임박 (1 ~ 15개)' },
                { value: 'out', label: '품절 (0개)' },
              ],
            },
          ]}
        />

        {selectedIds.size > 0 && (
          <div className="adm-card adm-filter-bar" role="toolbar" aria-label="Bulk actions 일괄 작업">
            <strong style={{ fontSize: '0.85rem' }}>{selectedIds.size}개 선택됨 Selected</strong>
            <button type="button" className="adm-btn" onClick={() => setBulkAction('publish')}>공개하기 Publish</button>
            <button type="button" className="adm-btn" onClick={() => setBulkAction('hide')}>숨기기 Hide</button>
            <button type="button" className="adm-btn" onClick={() => setBulkAction('delete')}>삭제하기 Delete</button>
            <button type="button" className="adm-btn" onClick={() => setSelectedIds(new Set())}>선택 해제</button>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={products}
          loading={loading}
          emptyTitle="조건에 일치하는 상품이 없습니다 No products found"
          emptyDesc="필터를 조정하거나 새 상품을 등록하세요."
          emptyAction={(
            <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
              <Plus size={14} aria-hidden /> 새 상품 등록
            </button>
          )}
          sort={sort}
          onSort={handleSort}
          rowKey={(r) => r.id}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleSelectAll}
        />

        <div style={{ marginTop: 12 }}>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </div>

        <ConfirmModal
          open={!!deleteConfirmId || bulkAction === 'delete'}
          title={deleteBlocked && deleteConfirmId
            ? '주문 내역이 있어 삭제할 수 없습니다 Cannot delete — has orders'
            : bulkAction === 'delete' ? `선택한 ${selectedIds.size}개 상품을 삭제할까요? Bulk delete` : '상품을 완전히 삭제하시겠습니까? Delete product'}
          desc={deleteBlocked && deleteConfirmId
            ? '이 상품은 과거 주문에 포함되어 있어 기록 보존을 위해 삭제가 차단됩니다. 대신 숨김 처리하면 고객 웹사이트에서 즉시 사라지고 주문 내역은 그대로 유지됩니다.'
            : '삭제된 상품은 고객 웹사이트에서 즉시 제거되며 복구할 수 없습니다. 주문 내역이 있는 상품은 건너뜁니다.'}
          confirmLabel={bulkBusy ? '처리 중…' : deleteBlocked && deleteConfirmId ? '숨김 처리하기 Hide instead' : '확인 및 삭제 Delete'}
          danger={!(deleteBlocked && deleteConfirmId)}
          onConfirm={() => {
            if (bulkAction === 'delete') runBulk();
            else if (deleteBlocked && deleteConfirmId) {
              handleToggleStatus(deleteConfirmId, 'active');
              closeDeleteDialog();
            }
            else if (deleteConfirmId) handleDeleteProduct(deleteConfirmId);
          }}
          onClose={() => { if (!bulkBusy) { closeDeleteDialog(); setBulkAction(null); } }}
        />

        <ConfirmModal
          open={bulkAction === 'publish' || bulkAction === 'hide'}
          title={bulkAction === 'publish' ? `선택한 ${selectedIds.size}개 상품을 공개할까요? Bulk publish` : `선택한 ${selectedIds.size}개 상품을 숨길까요? Bulk hide`}
          desc={bulkAction === 'publish' ? '고객 웹사이트에 즉시 노출됩니다.' : '고객 웹사이트에서 즉시 숨겨집니다.'}
          confirmLabel={bulkBusy ? '처리 중…' : '확인 Confirm'}
          danger={false}
          onConfirm={runBulk}
          onClose={() => { if (!bulkBusy) setBulkAction(null); }}
        />

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

                {/* 2. Category, Gender & SKU */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                    <label className="form-label">성별 (Gender) *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="form-select"
                    >
                      <option value="women">여성 (Women)</option>
                      <option value="men">남성 (Men)</option>
                      <option value="unisex">공용 (Unisex)</option>
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

                  <span
                    title="SALE 뱃지는 할인가 입력 시 자동으로 표시됩니다"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: Number(formData.discount_price) > 0 ? '#18181b' : '#a1a1aa' }}
                  >
                    <span
                      style={{
                        display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px',
                        backgroundColor: Number(formData.discount_price) > 0 ? '#dc2626' : '#e4e4e7',
                      }}
                    />
                    <span>🏷️ Sale (할인가 입력 시 자동 표시)</span>
                  </span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_best}
                      onChange={(e) => setFormData({ ...formData, is_best: e.target.checked })}
                    />
                    <span>🔥 Best (홈페이지 상단 노출)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }} title="숫자가 낮을수록 홈페이지 상단 먼저 노출 (비워두면 뒤로)">
                    <span>BEST 순서</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      placeholder="예: 1"
                      value={formData.best_rank}
                      onChange={(e) => setFormData({ ...formData, best_rank: e.target.value })}
                      className="form-input"
                      style={{ width: '90px', padding: '6px 8px', fontSize: '0.8125rem' }}
                    />
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

