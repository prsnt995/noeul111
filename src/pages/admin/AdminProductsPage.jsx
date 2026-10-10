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
import { useListParams } from '../../hooks/useListParams.js';
import {
  validateProductForm,
  productErrorText,
  COMMON_SIZES,
  DEFAULT_SIZE_STOCK,
  generateNextSku,
} from '../../utils/product.js';
import { normalizePrefix, suggestPrefix, nextSku } from '../../utils/sku.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useBusy } from '../../context/BusyContext.jsx';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

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
  // List state lives in the URL (?page=&search=&sort=&order=&category=&…).
  const listParams = useListParams({ keys: ['page', 'search', 'sort', 'order', 'category', 'stockStatus', 'filterType'] });
  const pv = listParams.values;
  const page = Number(pv.page) || 1;
  const search = pv.search || '';
  const sort = { key: pv.sort || 'id', dir: pv.order === 'asc' ? 'asc' : 'desc' };
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const PAGE_SIZE = 20;
  const { showToast } = useToast();
  const { runBusy, busy: saving } = useBusy();

  const selectedCatObj = categories.find((c) => String(c.id) === String(pv.category) || String(c.slug) === String(pv.category));
  const selectedCategory = selectedCatObj ? String(selectedCatObj.id) : (pv.category === 'all' || !pv.category ? 'all' : pv.category);
  const stockFilter = pv.stockStatus || 'all';
  const specialFilter = pv.filterType || 'all';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  // Self-diagnosis payload from /admin/health/schema — set when a save fails
  // with SCHEMA_MISMATCH/DB_PERMISSION so the banner can name the cause.
  const [schemaIssue, setSchemaIssue] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    category_id: '',
    name_ko: '',
    description_ko: '',
    material_ko: '',
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
    colors: [{ name_ko: '블랙', hex: '#111112' }],
    // Color×Size combo stock: key `${color}|||${size}`, value '' = not offered.
    variant_stock: {},
    // Rich blocks rendered in the PDP band below the tabs.
    detail_blocks: [],
  });

  // Custom color draft (name + hex picker) appended to presets
  const [newColor, setNewColor] = useState({ name_ko: '', name_en: '', hex: '#18181b' });
  // Tracks whether the admin typed the SKU manually (stops auto-suggest).
  const [skuDirty, setSkuDirty] = useState(false);

  // Next auto SKU preview for a category (best-effort seq+1; the server
  // assigns authoritatively and skips taken codes).
  const suggestSkuForCategory = (cat) => {
    if (!cat) return '';
    const prefix = normalizePrefix(cat.sku_prefix) || suggestPrefix(cat.slug);
    if (!prefix) return '';
    try {
      return nextSku(prefix, (Number(cat.sku_seq) || 0) + 1);
    } catch {
      return '';
    }
  };

  // Standalone category refresh: the save guard and the add-modal call this
  // when the list is empty/stale, instead of trusting a phantom fallback id.
  const fetchCategories = async () => {
    try {
      const res = await adminApi.get('/admin/categories');
      if (res.success) {
        setCategories(res.data || []);
        return res.data || [];
      }
    } catch (err) {
      console.error('Fetch categories failed:', err?.message);
    }
    return [];
  };

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
        category: selectedCategory === 'all' ? undefined : (selectedCatObj ? selectedCatObj.id : selectedCategory),
        stockStatus: stockFilter,
        filterType: specialFilter,
      });

      const [prodRes, catRes] = await Promise.all([
        adminApi.get(`/admin/products${qs}`),
        categories.length ? Promise.resolve({ success: false }) : fetchCategories().then((data) => ({ success: true, data })),
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
      } else if (msg.includes('PRODUCTS_UNAVAILABLE')) {
        setErrorMsg('상품 데이터를 일시적으로 불러올 수 없습니다. 서버 상태 또는 데이터베이스 연결을 확인해 주세요. (PRODUCTS_UNAVAILABLE)');
        showToast('상품 데이터를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.', 'error');
      } else {
        setErrorMsg(msg || '상품 목록을 불러오지 못했습니다.');
        showToast(msg || '상품 목록을 불러오지 못했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pv]);

  const handleSort = (key) => {
    const dir = sort.key === key ? (sort.dir === 'asc' ? 'desc' : 'asc') : 'desc';
    listParams.set({ sort: key, order: dir });
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewColor({ name_ko: '', name_en: '', hex: '#18181b' });
    setSkuDirty(false);
    // Never fall back to a phantom id: an empty string fails pre-flight with
    // a named message instead of dying on the category FK server-side.
    if (!categories.length) fetchCategories();
    const targetCat = categories[0] || null;
    const initialSizes = ['FREE'];
    const initialColors = [{ name_ko: '블랙', name_en: 'Black', hex: '#111112' }];
    const initialStock = {};
    initialColors.forEach((c) => {
      initialSizes.forEach((sz) => {
        initialStock[comboKey(c, sz)] = String(DEFAULT_SIZE_STOCK);
      });
    });
    // Auto-suggest the next category SKU (TSH-00042…); the server assigns
    // authoritatively, this is just a preview until the admin types.
    // Falls back to the legacy generator when the category lacks sku_seq.
    const initialSku = suggestSkuForCategory(targetCat) || (targetCat ? generateNextSku(targetCat, products) : '');
    setFormData({
      sku: initialSku,
      category_id: targetCat?.id ?? '',
      name_ko: '',
      description_ko: '',
      material_ko: '100% 코튼',
      price: '',
      discount_price: '',
      gender: 'women',
      is_new: true,
      is_sale: false,
      is_best: false,
      best_rank: '',
      status: 'active',
      images: [],
      sizes: initialSizes,
      colors: initialColors,
      variant_stock: initialStock,
      detail_blocks: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditMode(true);
    setEditingId(p.id);
    setNewColor({ name_ko: '', name_en: '', hex: '#18181b' });
    // Existing SKU is explicit — never overwrite it with suggestions.
    setSkuDirty(true);
    // Preserve per-image color mapping for reorder plan (media has color, images is fallback)
    const mediaWithColor = Array.isArray(p.media) && p.media.length
      ? p.media.map(m => ({ url: m.url, color: m.color || null, variant_id: m.variant_id || null }))
      : (p.images || []).map(url => (typeof url === 'string' ? { url, color: null } : url));
    // Prefill combo stock from existing variants (blank = combo not offered)
    const variant_stock = {};
    (p.variants || []).forEach(v => {
      variant_stock[comboKey({ name_ko: v.color, name_en: v.color }, v.size)] = String(v.stock ?? 0);
    });
    setFormData({
      sku: p.sku || '',
      category_id: p.category_id,
      name_ko: p.name_ko || p.name || '',
      description_ko: p.description_ko || p.description || '',
      material_ko: p.material_ko || p.material || '',
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
      colors: p.colors?.length > 0 ? p.colors : [{ name_ko: '블랙', hex: '#111' }],
      variant_stock,
      detail_blocks: Array.isArray(p.detail_blocks) ? p.detail_blocks : [],
    });
    setIsModalOpen(true);
  };

  // --- Detail content block editor (rendered by DetailContentBand on PDP) ---
  const addDetailBlock = (type) => {
    const blank = type === 'heading' || type === 'text'
      ? { type, text: { ko: '', en: '' } }
      : type === 'image'
        ? { type, url: '', alt: '', caption: { ko: '', en: '' } }
        : { type, images: [] };
    setFormData((fd) => ({ ...fd, detail_blocks: [...fd.detail_blocks, blank] }));
  };
  const updateDetailBlock = (i, patch) => {
    setFormData((fd) => ({
      ...fd,
      detail_blocks: fd.detail_blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  };
  const removeDetailBlock = (i) => {
    setFormData((fd) => ({ ...fd, detail_blocks: fd.detail_blocks.filter((_, idx) => idx !== i) }));
  };
  const moveDetailBlock = (i, dir) => {
    setFormData((fd) => {
      const next = [...fd.detail_blocks];
      const j = i + dir;
      if (j < 0 || j >= next.length) return fd;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...fd, detail_blocks: next };
    });
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
    // Detail blocks: mirror backend caps so fixable mistakes never round trip.
    const blocks = formData.detail_blocks || [];
    if (blocks.length > 50) {
      showToast('상세 블록은 최대 50개까지 저장할 수 있습니다.', 'error');
      return;
    }
    const emptyBlock = blocks.find(b => (
      (b.type === 'heading' || b.type === 'text') ? !String(b.text?.ko || '').trim() && !String(b.text?.en || '').trim()
        : b.type === 'image' ? !b.url
          : !(b.images || []).length
    ));
    if (emptyBlock) {
      showToast('비어 있는 상세 블록이 있습니다 — 내용을 채우거나 삭제하세요.', 'error');
      return;
    }
    // Pre-flight mirrors the backend guards so fixable input mistakes show a
    // named message without a wasted round trip.
    const preflight = validateProductForm(formData);
    if (!preflight.ok) {
      showToast(productErrorText(preflight.code), 'error');
      return;
    }
    // The dropdown can hold a stale id (category deleted after selection, or
    // list reloaded mid-edit) — catch it here, not on the FK server-side.
    if (!categories.some((c) => String(c.id) === String(formData.category_id))) {
      fetchCategories();
      showToast(productErrorText('CATEGORY_INVALID'), 'error');
      return;
    }
    // Blocking loader for the whole save: no clicks elsewhere, no double
    // submit, no duplicate-creating retry while the request is in flight.
    await runBusy(async () => {
      const payload = {
        ...formData,
        name_en: formData.name_en || formData.name_ko,
        description_en: formData.description_en || formData.description_ko || '',
        material_en: formData.material_en || formData.material_ko || '',
        colors: formData.colors.map((c) => ({
          ...c,
          name_ko: c.name_ko || c.name || c.name_en,
          name_en: c.name_en || c.name_ko || c.name,
        })),
        // Untouched auto-suggest goes out blank so the server assigns the
        // authoritative next sequence; a manually typed SKU is sent as-is.
        sku: skuDirty ? formData.sku : '',
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        variant_stock,
      };

      if (isEditMode) {
        await adminApi.put(`/admin/products/${editingId}`, payload);
        showToast('상품 정보가 성공적으로 수정되었습니다.', 'success');
      } else {
        const res = await adminApi.post('/admin/products', payload);
        showToast(`새 상품이 등록되었습니다.${res?.data?.sku ? ` (SKU: ${res.data.sku})` : ''}`, 'success');
      }
      if (emptyColors.length) {
        showToast(`판매 조합 없는 색상(고객에게 숨김): ${emptyColors.map(colorKey).join(', ')}`, 'info');
      }

      setIsModalOpen(false);
      fetchProducts();
    }, isEditMode ? '상품 수정 중...' : '상품 등록 중...').catch((err) => {
      const code = err?.message;
      showToast(productErrorText(code), 'error');
      // Environment-class failures need evidence, not retries: pull the
      // read-only schema diagnosis so the banner below can name it.
      if (code === 'SCHEMA_MISMATCH' || code === 'DB_PERMISSION') {
        adminApi.get('/admin/health/schema').then(
          (res) => setSchemaIssue({ code, ...(res || {}) }),
          () => setSchemaIssue({ code, ok: false, probeError: 'UNREACHABLE' })
        );
      }
    });
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

  const handleCategoryChange = (catId) => {
    const targetCat = categories.find((c) => String(c.id) === String(catId));
    const nextSku = targetCat ? generateNextSku(targetCat, products) : formData.sku;
    setFormData((prev) => ({
      ...prev,
      category_id: catId,
      sku: !isEditMode ? nextSku : prev.sku,
    }));
  };

  const toggleSizeSelection = (size) => {
    const current = [...formData.sizes];
    const index = current.indexOf(size);
    const nextStock = { ...formData.variant_stock };
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(size);
      // Default quantity to 50 for every newly selected size
      for (const c of formData.colors) {
        const k = comboKey(c, size);
        if (!cellFilled(nextStock[k])) {
          nextStock[k] = String(DEFAULT_SIZE_STOCK);
        }
      }
    }
    setFormData({ ...formData, sizes: current, variant_stock: nextStock });
  };

  const toggleColorSelection = (colorObj) => {
    const current = [...formData.colors];
    const key = colorObj.name_ko || colorObj.name_en;
    const exists = current.some((c) => (c.name_ko || c.name_en) === key);
    if (exists) {
      const next = current.filter((c) => (c.name_ko || c.name_en) !== key);
      setFormData({ ...formData, colors: next.length > 0 ? next : [colorObj] });
    } else {
      const nextStock = { ...formData.variant_stock };
      for (const sz of formData.sizes) {
        const k = comboKey(colorObj, sz);
        if (!cellFilled(nextStock[k])) {
          nextStock[k] = String(DEFAULT_SIZE_STOCK);
        }
      }
      setFormData({ ...formData, colors: [...current, colorObj], variant_stock: nextStock });
    }
  };

  const addCustomColor = () => {
    const name_ko = newColor.name_ko.trim();
    if (!name_ko) {
      showToast('색상명을 입력하세요 (예: 더스티 블루)', 'error');
      return;
    }
    if (formData.colors.some((c) => (c.name_ko || c.name_en) === name_ko)) {
      showToast('이미 존재하는 색상입니다.', 'error');
      return;
    }
    const customColor = { name_ko, name_en: name_ko, hex: newColor.hex };
    const nextStock = { ...formData.variant_stock };
    for (const sz of formData.sizes) {
      const k = comboKey(customColor, sz);
      if (!cellFilled(nextStock[k])) {
        nextStock[k] = String(DEFAULT_SIZE_STOCK);
      }
    }
    setFormData({
      ...formData,
      colors: [...formData.colors, customColor],
      variant_stock: nextStock,
    });
    setNewColor({ name_ko: '', hex: '#18181b' });
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
      label: '상품 정보',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: p.status === 'hidden' ? 0.6 : 1 }}>
          <img
            src={p.images?.[0] || '/products/men/tshirts/classic-tshirt/1.jpg'}
            alt=""
            style={{ width: '48px', height: '62px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e4e4e7' }}
          />
          <div>
            <p style={{ fontWeight: 700, color: '#18181b', fontSize: '0.9375rem', margin: 0 }}>#{p.id} {p.name_ko || p.name || p.name_en}</p>
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
      label: '카테고리',
      render: (p) => {
        const cat = categories.find((c) => String(c.id) === String(p.category_id));
        return (
          <div style={{ color: '#52525b', fontWeight: 500 }}>
            {p.category_name_ko || p.category_name || p.category_name_en || cat?.name_ko || cat?.name || '-'}
          </div>
        );
      },
    },
    {
      key: 'price',
      label: '판매가',
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
      label: '재고',
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
        <ErrorBanner
          message={
            errorMsg
              ? errorMsg.startsWith('관리자') || errorMsg.startsWith('상품')
                ? errorMsg
                : `상품 로드 실패: ${errorMsg}`
              : ''
          }
          onRetry={fetchProducts}
        />

        {schemaIssue && !schemaIssue.ok && (
          <div className="adm-error" role="alert" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>
                {schemaIssue.code === 'DB_PERMISSION'
                  ? 'DB 쓰기 권한이 없습니다 — 서버 키 / RLS 설정을 확인해야 합니다.'
                  : '상품 테이블 스키마가 코드보다 뒤처져 있습니다 — 아래 마이그레이션을 적용해야 합니다.'}
              </strong>
              <button type="button" className="adm-btn" onClick={() => setSchemaIssue(null)} style={{ marginLeft: 'auto' }}>
                닫기 Dismiss
              </button>
            </div>
            {(schemaIssue.missingColumns?.length > 0) && (
              <div style={{ fontSize: '0.82rem' }}>
                <div>누락 컬럼 Missing columns: <strong>{schemaIssue.missingColumns.join(', ')}</strong></div>
                <div>적용할 파일 Migrations to apply (순서대로): <strong>{(schemaIssue.missingMigrations || []).join(', ')}</strong></div>
              </div>
            )}
            {schemaIssue.probeError && !(schemaIssue.missingColumns?.length) && (
              <div style={{ fontSize: '0.82rem' }}>
                스키마 확인 자체가 실패했습니다 ({schemaIssue.probeError}) — DB 연결 또는 권한을 확인하세요.
              </div>
            )}
          </div>
        )}

        <Filters
          searchValue={search}
          onSearch={(v) => listParams.set({ search: v })}
          onReset={listParams.reset}
          searchPlaceholder="상품명, SKU, ID 검색..."
          selects={[
            {
              name: 'category', value: selectedCategory, onChange: (v) => listParams.set({ category: v }), ariaLabel: '카테고리', label: '카테고리', clearValue: 'all',
              options: [
                { value: 'all', label: '전체 카테고리' },
                ...categories
                  .filter((c) => c && c.id != null)
                  .map((c) => ({ value: String(c.id), label: c.name_ko || c.name || c.name_en })),
              ],
            },
            {
              name: 'special', value: specialFilter, onChange: (v) => listParams.set({ filterType: v }), ariaLabel: '필터', label: '필터',
              options: [
                { value: 'all', label: '전체 상품' },
                { value: 'new', label: '⭐ 신상품' },
                { value: 'best', label: '🔥 베스트 (홈페이지 상단 노출)' },
                { value: 'sale', label: '🏷️ 세일/할인' },
                { value: 'in_stock', label: '✅ 재고 있음' },
                { value: 'out_of_stock', label: '❌ 품절' },
              ],
            },
            {
              name: 'stock', value: stockFilter, onChange: (v) => listParams.set({ stockStatus: v }), ariaLabel: '재고 수량', label: '재고 수량',
              options: [
                { value: 'all', label: '전체 수량' },
                { value: 'in', label: '재고 원활 (> 15개)' },
                { value: 'low', label: '품절 임박 (1 ~ 15개)' },
                { value: 'out', label: '품절 (0개)' },
              ],
            },
          ]}
        />

        {selectedIds.size > 0 && (
          <div className="adm-card adm-filter-bar" role="toolbar" aria-label="일괄 작업">
            <strong style={{ fontSize: '0.85rem' }}>{selectedIds.size}개 선택됨</strong>
            <button type="button" className="adm-btn" onClick={() => setBulkAction('publish')}>공개</button>
            <button type="button" className="adm-btn" onClick={() => setBulkAction('hide')}>숨김</button>
            <button type="button" className="adm-btn" onClick={() => setBulkAction('delete')}>삭제</button>
            <button type="button" className="adm-btn" onClick={() => setSelectedIds(new Set())}>선택 해제</button>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={products}
          loading={loading}
          emptyTitle="조건에 일치하는 상품이 없습니다"
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
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={(p) => listParams.set({ page: p })} />
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
                  {isEditMode ? '상품 정보 수정' : '새 상품 등록'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveProduct} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Product Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">상품명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name_ko}
                    onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                    placeholder="예: 노을 케이블 니트 가디건"
                    className="form-input"
                  />
                </div>

                {/* 2. Category, Gender & SKU */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">카테고리 *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        const category_id = e.target.value;
                        const cat = categories.find((c) => String(c.id) === String(category_id));
                        setFormData((fd) => ({
                          ...fd,
                          category_id,
                          // Follow the category with a fresh suggestion until
                          // the admin types a SKU manually.
                          ...(!skuDirty && !isEditMode ? { sku: suggestSkuForCategory(cat) || (cat ? generateNextSku(cat, products) : fd.sku) } : {}),
                        }));
                      }}
                      className="form-select"
                      required
                    >
                      {categories.length === 0 && (
                        <option value="">카테고리 없음 — 먼저 카테고리를 등록하세요</option>
                      )}
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name_ko || c.name || c.name_en}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">성별 *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="form-select"
                    >
                      <option value="women">여성</option>
                      <option value="men">남성</option>
                      <option value="unisex">남녀공용</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">상품 SKU 번호 {skuDirty ? '(직접 입력)' : '(자동 부여)'}</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => { setSkuDirty(true); setFormData({ ...formData, sku: e.target.value }); }}
                        placeholder={isEditMode ? '' : '비워두면 카테고리별 자동 부여'}
                        className="form-input"
                        style={{ fontFamily: 'monospace', fontWeight: skuDirty ? 400 : 700 }}
                      />
                      {!isEditMode && (
                        <button
                          type="button"
                          title="다음 번호로 다시 생성"
                          onClick={() => {
                            const cat = categories.find((c) => String(c.id) === String(formData.category_id)) || categories[0];
                            const next = suggestSkuForCategory(cat) || (cat ? generateNextSku(cat, products) : formData.sku);
                            setSkuDirty(false);
                            setFormData((fd) => ({ ...fd, sku: next }));
                            if (next) showToast(`SKU 자동 생성: ${next}`, 'info');
                          }}
                          style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #e4e4e7', background: '#f4f4f5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                          ⟳ 자동
                        </button>
                      )}
                    </div>
                    {!isEditMode && !skuDirty && formData.sku && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--accent-sunset)', fontWeight: 600 }}>
                        다음 SKU: {formData.sku} (저장 시 확정)
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">정상 판매가 (원) *</label>
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
                    <label className="form-label">할인가 (선택)</label>
                    <input
                      type="number"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                      placeholder="79000"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 4. Material & Description */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">소재 (선택)</label>
                    <input
                      type="text"
                      value={formData.material_ko}
                      onChange={(e) => setFormData({ ...formData, material_ko: e.target.value })}
                      placeholder="예: 코튼 100%, 울 80% 나일론 20%"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">상세 설명</label>
                    <textarea
                      rows={4}
                      value={formData.description_ko}
                      onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })}
                      placeholder="상품의 디자인, 핏, 특장점을 작성하세요."
                      className="form-textarea"
                    />
                  </div>
                </div>

                {/* 5. Detail Content Blocks — rich blocks rendered in the PDP band below the tabs. */}
                <div style={{ backgroundColor: '#fbfbfb', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f2' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-sunset)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    3. 상세 페이지 콘텐츠 블록
                  </span>
                  <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '12px', lineHeight: 1.5 }}>
                    상품 페이지 탭 영역 아래에 별도 밴드로 표시됩니다. 설명 아래에 텍스트·이미지 블록을 자유롭게 쌓으세요. (첫 블록부터 순서대로 노출)
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <button type="button" className="btn-secondary" onClick={() => addDetailBlock('heading')}>+ 제목</button>
                    <button type="button" className="btn-secondary" onClick={() => addDetailBlock('text')}>+ 텍스트</button>
                    <button type="button" className="btn-secondary" onClick={() => addDetailBlock('image')}>+ 이미지</button>
                    <button type="button" className="btn-secondary" onClick={() => addDetailBlock('image_grid')}>+ 이미지 그리드</button>
                  </div>

                  {formData.detail_blocks.length === 0 && (
                    <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', textAlign: 'center', padding: '20px', border: '1px dashed #d4d4d8', borderRadius: '8px', backgroundColor: '#fff' }}>
                      아직 블록이 없습니다 — 위 버튼으로 제목/텍스트/이미지를 추가하세요.
                    </p>
                  )}

                  {formData.detail_blocks.map((block, i) => {
                    const typeLabel = { heading: '제목', text: '텍스트', image: '이미지', image_grid: '이미지 그리드' }[block.type] || block.type;
                    return (
                      <div key={i} style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px', marginBottom: '10px', backgroundColor: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#18181b', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                            {i + 1}. {typeLabel}
                          </span>
                          <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => moveDetailBlock(i, -1)} disabled={i === 0} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: i === 0 ? 0.4 : 1 }}>↑</button>
                            <button type="button" onClick={() => moveDetailBlock(i, 1)} disabled={i === formData.detail_blocks.length - 1} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: i === formData.detail_blocks.length - 1 ? 0.4 : 1 }}>↓</button>
                            <button type="button" onClick={() => removeDetailBlock(i)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fecaca' }}>삭제</button>
                          </span>
                        </div>

                        {(block.type === 'heading' || block.type === 'text') && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{block.type === 'heading' ? '제목' : '본문 내용'}</label>
                            {block.type === 'heading' ? (
                              <input type="text" maxLength={300} className="form-input" value={block.text?.ko || ''} placeholder="예: 소재 디테일" onChange={(e) => updateDetailBlock(i, { text: { ko: e.target.value, en: e.target.value } })} />
                            ) : (
                              <textarea rows={4} maxLength={4000} className="form-textarea" value={block.text?.ko || ''} placeholder="한글 본문을 입력하세요." onChange={(e) => updateDetailBlock(i, { text: { ko: e.target.value, en: e.target.value } })} />
                            )}
                          </div>
                        )}

                        {block.type === 'image' && (
                          <div>
                            <ImageUploader
                              mode="block"
                              maxImages={1}
                              label="블록 이미지"
                              images={block.url ? [{ url: block.url, color: null }] : []}
                              onChange={(imgs) => updateDetailBlock(i, { url: imgs[0]?.url || '' })}
                            />
                            <div className="form-group" style={{ marginTop: '8px', marginBottom: 0 }}>
                              <label className="form-label">캡션 (선택)</label>
                              <input type="text" maxLength={300} className="form-input" value={block.caption?.ko || ''} placeholder="이미지 아래에 표시되는 설명" onChange={(e) => updateDetailBlock(i, { caption: { ko: e.target.value, en: e.target.value } })} />
                            </div>
                          </div>
                        )}

                        {block.type === 'image_grid' && (
                          <ImageUploader
                            mode="block"
                            maxImages={6}
                            label="그리드 이미지 (2열로 표시)"
                            images={(block.images || []).map((im) => ({ url: im.url, color: null }))}
                            onChange={(imgs) => updateDetailBlock(i, { images: imgs.map((im) => ({ url: im.url, alt: '' })) })}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 6. Sizes & Colors Multi-Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Sizes */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">선택 가능한 사이즈</label>
                      <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                        선택 시 기본 재고 {DEFAULT_SIZE_STOCK}개 자동 설정
                      </span>
                    </div>
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
                            {sz === 'FREE' ? 'FREE (F)' : sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">선택 가능한 색상</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {PRESET_COLORS.map((cObj) => {
                        const selected = formData.colors.some((c) => (c.name_ko === cObj.name_ko) || (c.name_en === cObj.name_en));
                        return (
                          <button
                            key={cObj.name_ko || cObj.name_en}
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
                            <span>{cObj.name_ko}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom color: name + hex picker */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={newColor.name_ko}
                        onChange={(e) => setNewColor({ ...newColor, name_ko: e.target.value, name_en: e.target.value })}
                        placeholder="색상명 (예: 더스티 블루)"
                        className="form-input"
                        style={{ width: '160px', padding: '6px 8px', fontSize: '0.75rem' }}
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
                    {formData.colors.filter((c) => !PRESET_COLORS.some((p) => p.name_en === c.name_en || p.name_ko === c.name_ko)).length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {formData.colors.filter((c) => !PRESET_COLORS.some((p) => p.name_en === c.name_en || p.name_ko === c.name_ko)).map((cObj) => (
                          <span
                            key={cObj.name_ko || cObj.name_en}
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
                            <span>{cObj.name_ko || cObj.name_en}</span>
                            <button
                              type="button"
                              onClick={() => toggleColorSelection(cObj)}
                              aria-label={`${cObj.name_ko || cObj.name_en} 삭제`}
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

                {/* 7. Variant Stock Matrix — Color × Size mini table.
                    Blank cell = combo not offered; 0 = offered but sold out. */}
                <div style={{ backgroundColor: '#fbfbfb', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-sunset)', textTransform: 'uppercase' }}>
                      4. 옵션별 재고 (Color × Size Stock)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...formData.variant_stock };
                          for (const c of formData.colors) {
                            for (const sz of formData.sizes) {
                              next[comboKey(c, sz)] = String(DEFAULT_SIZE_STOCK);
                            }
                          }
                          setFormData({ ...formData, variant_stock: next });
                          showToast(`선택된 사이즈의 재고를 기본 ${DEFAULT_SIZE_STOCK}개로 설정했습니다.`, 'info');
                        }}
                        style={{ padding: '5px 10px', fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '4px', cursor: 'pointer', color: 'var(--accent-sunset)' }}
                      >
                        기본 50개 전체 채우기
                      </button>
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

                {/* 8. Product Image Manager — reorder plan: each image can be linked to a color (e.g., 2 blue, 3 green). On storefront, selecting blue reorders that color's images first, still shows all 5. */}
                <ImageUploader
                  images={formData.images}
                  onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                  label="5. 상품 이미지 관리 (Product Photos - 첫 번째 사진이 메인, 색상 지정 시 해당 색상 선택 시 먼저 표시)"
                  availableColors={formData.colors}
                />

                {/* 9. Badges & Visibility Status Flags */}
                <div style={{ display: 'flex', gap: '20px', padding: '16px', backgroundColor: '#f4f4f6', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_new}
                      onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    />
                    <span>⭐ 신상품 (NEW 뱃지)</span>
                  </label>

                  <span
                    title="세일 뱃지는 할인가 입력 시 자동으로 표시됩니다"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: Number(formData.discount_price) > 0 ? '#18181b' : '#a1a1aa' }}
                  >
                    <span
                      style={{
                        display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px',
                        backgroundColor: Number(formData.discount_price) > 0 ? '#dc2626' : '#e4e4e7',
                      }}
                    />
                    <span>🏷️ 세일 (할인가 입력 시 자동 표시)</span>
                  </span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_best}
                      onChange={(e) => setFormData({ ...formData, is_best: e.target.checked })}
                    />
                    <span>🔥 베스트 (홈페이지 상단 노출)</span>
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
                    <span>👁️ 웹사이트에 상품 공개</span>
                  </label>
                </div>

                {/* Submit Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" disabled={saving}>
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)', opacity: saving ? 0.65 : 1 }} disabled={saving}>
                    {saving ? '저장 중...' : isEditMode ? '수정 내용 저장하기' : '새 상품 등록 완료'}
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

