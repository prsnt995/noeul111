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
    <div className="backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '720px', maxHeight: '92vh', margin: '24px auto', backgroundColor: '#fff', borderRadius: '12px', overflowY: 'auto', padding: '28px', boxShadow: 'var(--shadow-xl)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {lang === 'en' ? 'New Manual Order' : '외부 주문 등록'} <span style={{ fontSize: '0.8rem', color: '#71717a' }}>(Instagram / TikTok)</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '4px' }}>
              {lang === 'en'
                ? 'Stock is reserved immediately. Payment is confirmed via the bank-transfer verify flow.'
                : '등록 즉시 재고가 차감(예약)되며, 무통장 입금 검수 흐름으로 결제를 확정합니다.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{lang === 'en' ? 'Channel' : '주문 채널'} *</label>
              <select value={orderSource} onChange={(e) => setOrderSource(e.target.value)} className="form-select">
                {ORDER_SOURCES.filter(s => s !== 'website').map(s => (
                  <option key={s} value={s}>{sourceLabel(s, 'ko')} ({sourceLabel(s, 'en')})</option>
                ))}
                <option value="website">{sourceLabel('website', 'ko')} ({sourceLabel('website', 'en')})</option>
              </select>
            </div>
            <div>
              <label className="form-label">{lang === 'en' ? 'Channel memo (e.g. IG handle)' : '채널 메모 (예: IG 아이디)'}</label>
              <input value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} className="form-input" placeholder="e.g. @noeul.seoul" maxLength={200} />
            </div>
          </div>

          <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px' }}>
            <label className="form-label">{lang === 'en' ? 'Link member (optional)' : '회원 연결 (선택)'} {customerId && <span style={{ color: '#16a34a' }}>✓ 연결됨</span>}</label>
            <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
              <Search size={15} color="#999" style={{ position: 'absolute', top: '11px', left: '10px' }} />
              <input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} className="form-input" placeholder={lang === 'en' ? 'Search name / email / phone' : '이름 / 이메일 / 연락처 검색'} style={{ paddingLeft: '32px' }} />
              {customerId && <button type="button" className="btn-secondary" onClick={clearLinkedCustomer}>해제</button>}
            </div>
            {searchingCustomers && <p style={{ fontSize: '0.75rem', color: '#888' }}>검색 중...</p>}
            {customerResults.length > 0 && (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '6px', marginTop: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {customerResults.map(c => (
                  <button key={c.id} type="button" onClick={() => pickCustomer(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f2', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <strong>{c.name}</strong> <span style={{ color: '#71717a' }}>{c.email} {c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div><label className="form-label">{lang === 'en' ? 'Recipient' : '받는 분'} *</label><input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="form-input" maxLength={60} /></div>
              <div><label className="form-label">{lang === 'en' ? 'Phone' : '연락처'} *</label><input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="form-input" placeholder="010-0000-0000" maxLength={30} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="form-input" maxLength={120} /></div>
              <div><label className="form-label">{lang === 'en' ? 'Postal code' : '우편번호'} *</label><input required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="form-input" maxLength={20} /></div>
              <div><label className="form-label">{lang === 'en' ? 'Address' : '주소'} *</label><input required value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" maxLength={200} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">{lang === 'en' ? 'Detail address' : '상세 주소'}</label><input value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} className="form-input" maxLength={200} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">{lang === 'en' ? 'Shipping memo' : '배송 메모'}</label><input value={shippingMemo} onChange={(e) => setShippingMemo(e.target.value)} className="form-input" maxLength={300} /></div>
            </div>
          </div>

          <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px' }}>
            <label className="form-label">{lang === 'en' ? 'Products' : '주문 상품'} *</label>
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="#999" style={{ position: 'absolute', top: '11px', left: '10px' }} />
                <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className="form-input" placeholder={lang === 'en' ? 'Search products (2+ chars)' : '상품 검색 (2글자 이상)'} style={{ paddingLeft: '32px' }} />
              </div>
            </div>
            {searchingProducts && <p style={{ fontSize: '0.75rem', color: '#888' }}>검색 중...</p>}
            {productResults.length > 0 && !selectedProduct && (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '6px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {productResults.map(p => (
                  <button key={p.id} type="button" onClick={() => pickProduct(p)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f2', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <strong>{p.name_ko}</strong>
                    <span style={{ color: '#71717a' }}>{formatKRW(p.discount_price || p.price)} · 재고 {totalAvailable(p)}개</span>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fafafa', border: '1px solid #f0f0f2', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedProduct.name_ko}</span>
                  <button type="button" onClick={() => { setSelectedProduct(null); setProductQuery(''); setProductResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#71717a' }}>다른 상품 검색</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-label">{lang === 'en' ? 'Color' : '색상'}</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => {
                        const c = e.target.value;
                        setSelectedColor(c);
                        const sizes = sizeOptions(selectedProduct, c);
                        setSelectedSize(sizes[0]?.size || '');
                        setPickQty(1);
                      }}
                      className="form-select"
                    >
                      {colorOptions(selectedProduct).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-label">{lang === 'en' ? 'Size' : '사이즈'}</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => { setSelectedSize(e.target.value); setPickQty(1); }}
                      className="form-select"
                    >
                      {sizeOptions(selectedProduct, selectedColor).map(v => (
                        <option key={v.size} value={v.size}>{v.size} ({v.available}개 가능)</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '90px' }}>
                    <label className="form-label">{lang === 'en' ? 'Qty' : '수량'}</label>
                    <input
                      type="number" min={1} max={Math.max(1, currentAvailable)}
                      value={pickQty}
                      onChange={(e) => setPickQty(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button type="button" className="btn-secondary" onClick={addItem} disabled={currentAvailable < 1}>
                      <Plus size={14} /> 추가{currentAvailable > 0 ? ` (${currentAvailable}개 가능)` : ''}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              {items.length === 0 && <p style={{ fontSize: '0.8rem', color: '#999' }}>{lang === 'en' ? 'No items yet.' : '아직 추가된 상품이 없습니다.'}</p>}
              {items.map(i => (
                <div key={i.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', background: '#fafafa', border: '1px solid #f0f0f2', borderRadius: '6px', padding: '8px 12px' }}>
                  <span><strong>{i.product_name}</strong> <span style={{ color: '#71717a' }}>{i.variant_label} × {i.quantity}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{formatKRW(i.unit_price * i.quantity)}</strong>
                    <button type="button" onClick={() => removeItem(i.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '10px' }}>
              <span>상품 합계</span><span>{formatKRW(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#15803d' }}>
                <span>쿠폰 할인 ({appliedCoupon.code})</span><span>−{formatKRW(couponDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>배송비</span><span>{formatKRW(shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>{lang === 'en' ? 'Total' : '합계'}</span><span>{formatKRW(total)}</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label className="form-label">{lang === 'en' ? 'Coupon (optional)' : '쿠폰 코드 (선택)'}</label>
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }}>
                  <span><strong style={{ color: '#15803d' }}>✓ {appliedCoupon.code}</strong> <span style={{ color: '#15803d' }}>−{formatKRW(appliedCoupon.discount)}</span></span>
                  <button type="button" onClick={clearCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#71717a' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    className="form-input"
                    placeholder="SAVE10"
                    maxLength={40}
                    disabled={checkingCoupon}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleCouponCheck}
                    disabled={checkingCoupon || !couponInput.trim() || items.length === 0}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    {checkingCoupon ? (lang === 'en' ? 'Checking...' : '확인 중...') : (lang === 'en' ? 'Check' : '확인')}
                  </button>
                </div>
              )}
              {couponError && <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '6px' }}>{couponError}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={saving}>취소 Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-sunset)' }} disabled={saving || items.length === 0}>
              {saving ? (lang === 'en' ? 'Saving...' : '등록 중...') : (lang === 'en' ? 'Create Order' : '주문 등록하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
