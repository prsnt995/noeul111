import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ORDER_SOURCES, sourceLabel } from '../../utils/orderSources.js';
import { X, Search, Plus, Trash2 } from 'lucide-react';

// Manual / external order modal: Instagram, TikTok, other.
// Bank-transfer flow only — created as pending_payment so stock is reserved
// and payment is confirmed via the existing verify-payment path.
export function ManualOrderModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const { lang } = useLanguage();
  const [saving, setSaving] = useState(false);

  const [orderSource, setOrderSource] = useState('instagram');
  const [sourceDetail, setSourceDetail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [shippingMemo, setShippingMemo] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [items, setItems] = useState([]);

  // Customer search (link if exists)
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Product / variant picker — color and size are two separate selects.
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [pickQty, setPickQty] = useState(1);

  // Esc closes (adm-modal is CSS only — no built-in focus trap here).
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (!customerQuery.trim() || customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await adminApi.get(`/admin/customers?search=${encodeURIComponent(customerQuery.trim())}`);
        setCustomerResults((res.data || []).slice(0, 8));
      } catch {
        setCustomerResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [customerQuery]);

  useEffect(() => {
    if (!productQuery.trim() || productQuery.trim().length < 2) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await adminApi.get(`/admin/products?search=${encodeURIComponent(productQuery.trim())}&limit=8`);
        // Hide fully sold-out products from the picker.
        setProductResults((res.data || []).filter(p => totalAvailable(p) > 0));
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [productQuery]);

  const pickCustomer = (c) => {
    setCustomerId(c.id);
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    setPostalCode(c.postal_code || '');
    setAddress(c.address || '');
    setDetailAddress(c.detail_address || '');
    setCustomerResults([]);
    setCustomerQuery('');
  };

  const clearLinkedCustomer = () => setCustomerId(null);

  // Normalize to per-variant rows { id, color, size, available }.
  // Supabase shape uses p.variants (stock − reserved per variant);
  // legacy shape falls back to product-level stock for every combo.
  const allVariants = (p) => {
    if (!p) return [];
    if (Array.isArray(p.variants) && p.variants.length) {
      return p.variants
        .filter(v => v.active !== false)
        .map(v => ({
          id: v.id,
          color: v.color || 'DEFAULT',
          size: v.size || 'FREE',
          available: Math.max(0, (v.stock || 0) - (v.reserved || 0)),
        }));
    }
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['FREE'];
    const colors = p.colors && p.colors.length ? p.colors : ['DEFAULT'];
    const stock = Number(p.stock ?? 0);
    const rows = [];
    for (const color of colors) {
      for (const size of sizes) {
        const c = typeof color === 'string' ? color : (color.name_ko || color.name_en || 'DEFAULT');
        const s = typeof size === 'string' ? size : 'FREE';
        rows.push({ id: null, productId: p.id, color: c, size: s, available: stock });
      }
    }
    return rows;
  };

  const totalAvailable = (p) => allVariants(p).reduce((s, v) => s + v.available, 0);

  // Colors with at least one available size — fully sold-out colors hidden.
  const colorOptions = (p) => {
    const seen = [];
    for (const v of allVariants(p)) {
      if (v.available > 0 && !seen.includes(v.color)) seen.push(v.color);
    }
    return seen;
  };

  // Available sizes of one color — sold-out sizes (e.g. Black/L) hidden.
  const sizeOptions = (p, color) =>
    allVariants(p).filter(v => v.color === color && v.available > 0);

  const findVariant = (p, color, size) =>
    allVariants(p).find(v => v.color === color && v.size === size) || null;

  const pickProduct = (p) => {
    setSelectedProduct(p);
    const colors = colorOptions(p);
    const firstColor = colors[0] || '';
    setSelectedColor(firstColor);
    const sizes = sizeOptions(p, firstColor);
    setSelectedSize(sizes[0]?.size || '');
    setPickQty(1);
  };

  // Quantity already in the draft for the same variant.
  const draftQty = (productId, variantId, color, size) =>
    items
      .filter(i => i.product_id === productId && (variantId ? i.variant_id === variantId : (i.color === color && i.size === size)))
      .reduce((s, i) => s + i.quantity, 0);

  const currentVariant = selectedProduct ? findVariant(selectedProduct, selectedColor, selectedSize) : null;
  const currentAvailable = currentVariant
    ? Math.max(0, currentVariant.available - draftQty(selectedProduct.id, currentVariant.id, selectedColor, selectedSize))
    : 0;

  const addItem = () => {
    if (!selectedProduct || !currentVariant || currentAvailable < 1) return;
    const qty = Math.max(1, Math.min(currentAvailable, Number(pickQty) || 1));
    const unit = Number(selectedProduct.discount_price || selectedProduct.price || 0);
    setItems(prev => [...prev, {
      key: `${selectedProduct.id}-${currentVariant.id || `${selectedColor}-${selectedSize}`}-${Date.now()}`,
      product_id: selectedProduct.id,
      variant_id: currentVariant.id || null,
      variant_label: `${selectedColor} / ${selectedSize}`,
      color: selectedColor,
      size: selectedSize,
      product_name: selectedProduct.name_ko || selectedProduct.name_en || '',
      unit_price: unit,
      quantity: qty,
    }]);
    setPickQty(1);
    // Draft subtotal changed — validated coupon may no longer apply.
    setAppliedCoupon(null);
    setCouponError('');
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i.key !== key));
    // Draft subtotal changed — validated coupon may no longer apply.
    setAppliedCoupon(null);
    setCouponError('');
  };

  const couponErrorText = (code) => {
    const map = {
      COUPON_CODE_REQUIRED: { ko: '쿠폰 코드를 입력해주세요.', en: 'Enter a coupon code.' },
      COUPON_INVALID: { ko: '유효하지 않은 쿠폰 코드입니다.', en: 'Invalid coupon code.' },
      COUPON_EXPIRED: { ko: '사용 기간이 아닌 쿠폰입니다.', en: 'Coupon is not valid at this time.' },
      COUPON_LIMIT_REACHED: { ko: '쿠폰 사용 수량이 모두 소진되었습니다.', en: 'Coupon usage limit reached.' },
      COUPON_MINIMUM_NOT_MET: { ko: '최소 주문 금액을 충족하지 않아 사용할 수 없습니다.', en: 'Minimum order amount not met.' },
    };
    const entry = map[code] || { ko: '쿠폰을 확인할 수 없습니다.', en: 'Could not validate coupon.' };
    return lang === 'en' ? entry.en : entry.ko;
  };

  const handleCouponCheck = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code || items.length === 0) return;
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const res = await adminApi.get(`/admin/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
      if (res.success) {
        setAppliedCoupon(res.data);
        showToast(lang === 'en' ? `Coupon applied: -${formatKRW(res.data.discount)}` : `쿠폰 적용됨: -${formatKRW(res.data.discount)}`, 'success');
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(couponErrorText(err?.message));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const couponDiscount = appliedCoupon?.discount || 0;
  const shipping = items.length === 0 ? 0 : (subtotal - couponDiscount >= 70000 ? 0 : 3000);
  const total = Math.max(0, subtotal - couponDiscount + shipping);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast(lang === 'en' ? 'Add at least one product.' : '상품을 1개 이상 추가해주세요.', 'error');
      return;
    }
    // Legacy SQLite path uses product_id; Supabase path needs variant_id.
    setSaving(true);
    try {
      const payloadItems = items.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id || undefined,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      }));
      const res = await adminApi.post('/admin/orders/manual', {
        order_source: orderSource,
        source_detail: sourceDetail.trim() || undefined,
        customer_id: customerId || undefined,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        postal_code: postalCode.trim(),
        address: address.trim(),
        detail_address: detailAddress.trim() || undefined,
        shipping_memo: shippingMemo.trim() || undefined,
        coupon_code: appliedCoupon?.code || undefined,
        payment_sender_name: customerName.trim(),
        items: payloadItems,
      });
      if (res.success) {
        showToast(lang === 'en' ? 'External order created.' : '외부 주문이 등록되었습니다.', 'success');
        onCreated?.(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err?.message || (lang === 'en' ? 'Failed to create order.' : '주문 등록 실패'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <div className="adm-modal" role="dialog" aria-modal="true" aria-label={lang === 'en' ? 'New Manual Order' : '외부 주문 등록'} style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
          <div>
            <h2>
              {lang === 'en' ? 'New Manual Order' : '외부 주문 등록'} <small style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 400 }}>(Instagram / TikTok)</small>
            </h2>
            <p className="adm-modal-sub" style={{ marginBottom: 0 }}>
              {lang === 'en'
                ? 'Stock is reserved immediately. Payment is confirmed via the bank-transfer verify flow.'
                : '등록 즉시 재고가 차감(예약)되며, 무통장 입금 검수 흐름으로 결제를 확정합니다.'}
            </p>
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label={lang === 'en' ? 'Close dialog' : '닫기 Close'}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: 12 }}>
          <div className="adm-form-grid">
            <div>
              <label className="adm-label" htmlFor="manual-source">{lang === 'en' ? 'Channel *' : '주문 채널 *'}</label>
              <select id="manual-source" value={orderSource} onChange={(e) => setOrderSource(e.target.value)} className="adm-select" style={{ width: '100%' }}>
                {ORDER_SOURCES.filter(s => s !== 'website').map(s => (
                  <option key={s} value={s}>{sourceLabel(s, 'ko')} ({sourceLabel(s, 'en')})</option>
                ))}
                <option value="website">{sourceLabel('website', 'ko')} ({sourceLabel('website', 'en')})</option>
              </select>
            </div>
            <div>
              <label className="adm-label" htmlFor="manual-source-detail">{lang === 'en' ? 'Channel memo (e.g. IG handle)' : '채널 메모 (예: IG 아이디)'}</label>
              <input id="manual-source-detail" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} className="adm-input" placeholder="e.g. @noeul.seoul" maxLength={200} />
            </div>
          </div>

          <div className="adm-card" style={{ padding: '14px' }}>
            <label className="adm-label" htmlFor="manual-customer-search">
              {lang === 'en' ? 'Link member (optional)' : '회원 연결 (선택)'} {customerId && <span style={{ color: '#16a34a' }}>✓ 연결됨 Linked</span>}
            </label>
            <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
              <Search size={15} color="#999" aria-hidden style={{ position: 'absolute', top: '11px', left: '10px' }} />
              <input id="manual-customer-search" value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} className="adm-input" placeholder={lang === 'en' ? 'Search name / email / phone' : '이름 / 이메일 / 연락처 검색'} style={{ paddingLeft: '32px' }} />
              {customerId && <button type="button" className="adm-btn" onClick={clearLinkedCustomer}>해제 Unlink</button>}
            </div>
            {searchingCustomers && <p style={{ fontSize: '0.75rem', color: '#888' }}>검색 중…</p>}
            {customerResults.length > 0 && (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '6px', marginTop: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {customerResults.map(c => (
                  <button key={c.id} type="button" onClick={() => pickCustomer(c)} className="adm-cmd-item">
                    <span><strong>{c.name}</strong> <small style={{ color: '#71717a' }}>{c.email} {c.phone}</small></span>
                  </button>
                ))}
              </div>
            )}
            <div className="adm-form-grid" style={{ marginTop: '12px' }}>
              <div><label className="adm-label" htmlFor="manual-name">{lang === 'en' ? 'Recipient *' : '받는 분 *'}</label><input id="manual-name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="adm-input" maxLength={60} /></div>
              <div><label className="adm-label" htmlFor="manual-phone">{lang === 'en' ? 'Phone *' : '연락처 *'}</label><input id="manual-phone" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="adm-input" placeholder="010-0000-0000" maxLength={30} /></div>
              <div className="full"><label className="adm-label" htmlFor="manual-email">Email</label><input id="manual-email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="adm-input" maxLength={120} /></div>
              <div><label className="adm-label" htmlFor="manual-postal">{lang === 'en' ? 'Postal code *' : '우편번호 *'}</label><input id="manual-postal" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="adm-input" maxLength={20} /></div>
              <div><label className="adm-label" htmlFor="manual-addr">{lang === 'en' ? 'Address *' : '주소 *'}</label><input id="manual-addr" required value={address} onChange={(e) => setAddress(e.target.value)} className="adm-input" maxLength={200} /></div>
              <div className="full"><label className="adm-label" htmlFor="manual-addr-detail">{lang === 'en' ? 'Detail address' : '상세 주소'}</label><input id="manual-addr-detail" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} className="adm-input" maxLength={200} /></div>
              <div className="full"><label className="adm-label" htmlFor="manual-memo">{lang === 'en' ? 'Shipping memo' : '배송 메모'}</label><input id="manual-memo" value={shippingMemo} onChange={(e) => setShippingMemo(e.target.value)} className="adm-input" maxLength={300} /></div>
            </div>
          </div>

          <div className="adm-card" style={{ padding: '14px' }}>
            <label className="adm-label" htmlFor="manual-product-search">{lang === 'en' ? 'Products *' : '주문 상품 *'}</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#999" aria-hidden style={{ position: 'absolute', top: '11px', left: '10px' }} />
              <input id="manual-product-search" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className="adm-input" placeholder={lang === 'en' ? 'Search products (2+ chars)' : '상품 검색 (2글자 이상)'} style={{ paddingLeft: '32px' }} />
            </div>
            {searchingProducts && <p style={{ fontSize: '0.75rem', color: '#888' }}>검색 중…</p>}
            {productResults.length > 0 && !selectedProduct && (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '6px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {productResults.map(p => (
                  <button key={p.id} type="button" onClick={() => pickProduct(p)} className="adm-cmd-item">
                    <span><strong>{p.name_ko}</strong></span>
                    <small>{formatKRW(p.discount_price || p.price)} · 재고 {totalAvailable(p)}개</small>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fafafa', border: '1px solid #f0f0f2', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedProduct.name_ko}</span>
                  <button type="button" onClick={() => { setSelectedProduct(null); setProductQuery(''); setProductResults([]); }} className="adm-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>다른 상품 검색</button>
                </div>
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label" htmlFor="manual-color">{lang === 'en' ? 'Color' : '색상'}</label>
                    <select
                      id="manual-color"
                      value={selectedColor}
                      onChange={(e) => {
                        const c = e.target.value;
                        setSelectedColor(c);
                        const sizes = sizeOptions(selectedProduct, c);
                        setSelectedSize(sizes[0]?.size || '');
                        setPickQty(1);
                      }}
                      className="adm-select"
                      style={{ width: '100%' }}
                    >
                      {colorOptions(selectedProduct).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="adm-label" htmlFor="manual-size">{lang === 'en' ? 'Size' : '사이즈'}</label>
                    <select
                      id="manual-size"
                      value={selectedSize}
                      onChange={(e) => { setSelectedSize(e.target.value); setPickQty(1); }}
                      className="adm-select"
                      style={{ width: '100%' }}
                    >
                      {sizeOptions(selectedProduct, selectedColor).map(v => (
                        <option key={v.size} value={v.size}>{v.size} ({v.available}개 가능)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="adm-label" htmlFor="manual-qty">{lang === 'en' ? 'Qty' : '수량'}</label>
                    <input
                      id="manual-qty"
                      type="number" min={1} max={Math.max(1, currentAvailable)}
                      value={pickQty}
                      onChange={(e) => setPickQty(e.target.value)}
                      className="adm-input"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="button" className="adm-btn" onClick={addItem} disabled={currentAvailable < 1} style={{ width: '100%' }}>
                      <Plus size={14} aria-hidden /> 추가{currentAvailable > 0 ? ` (${currentAvailable}개)` : ''}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              {items.length === 0 && <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>{lang === 'en' ? 'No items yet.' : '아직 추가된 상품이 없습니다.'}</p>}
              {items.map(i => (
                <div key={i.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: '0.85rem', background: '#fafafa', border: '1px solid #f0f0f2', borderRadius: '6px', padding: '8px 12px' }}>
                  <span><strong>{i.product_name}</strong> <span style={{ color: '#71717a' }}>{i.variant_label} × {i.quantity}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <strong>{formatKRW(i.unit_price * i.quantity)}</strong>
                    <button type="button" onClick={() => removeItem(i.key)} aria-label="Remove item 항목 삭제" className="adm-icon-btn" style={{ color: '#dc2626', width: 28, height: 28 }}><Trash2 size={14} aria-hidden /></button>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '10px' }}>
              <span>상품 합계 Subtotal</span><span>{formatKRW(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#15803d' }}>
                <span>쿠폰 할인 ({appliedCoupon.code})</span><span>−{formatKRW(couponDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>배송비 Shipping</span><span>{formatKRW(shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>{lang === 'en' ? 'Total' : '합계'}</span><span>{formatKRW(total)}</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label className="adm-label" htmlFor="manual-coupon">{lang === 'en' ? 'Coupon (optional)' : '쿠폰 코드 (선택)'}</label>
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }}>
                  <span><strong style={{ color: '#15803d' }}>✓ {appliedCoupon.code}</strong> <span style={{ color: '#15803d' }}>−{formatKRW(appliedCoupon.discount)}</span></span>
                  <button type="button" onClick={clearCoupon} aria-label="Remove coupon 쿠폰 제거" className="adm-icon-btn" style={{ width: 28, height: 28 }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="manual-coupon"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    className="adm-input"
                    placeholder="SAVE10"
                    maxLength={40}
                    disabled={checkingCoupon}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleCouponCheck}
                    disabled={checkingCoupon || !couponInput.trim() || items.length === 0}
                    className="adm-btn"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {checkingCoupon ? (lang === 'en' ? 'Checking...' : '확인 중...') : (lang === 'en' ? 'Check' : '확인')}
                  </button>
                </div>
              )}
              {couponError && <p role="alert" style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '6px', marginBottom: 0 }}>{couponError}</p>}
            </div>
          </div>

          <div className="adm-modal-actions" style={{ marginTop: 0 }}>
            <button type="button" onClick={onClose} className="adm-btn" style={{ flex: 1 }} disabled={saving}>취소 Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary" style={{ flex: 1 }} disabled={saving || items.length === 0}>
              {saving ? (lang === 'en' ? 'Saving...' : '등록 중...') : (lang === 'en' ? 'Create Order' : '주문 등록하기')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
