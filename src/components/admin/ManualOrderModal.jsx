import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ORDER_SOURCES, sourceLabel } from '../../utils/orderSources.js';
import { X, Search, Plus, Trash2 } from 'lucide-react';

// Manual / external order modal: Instagram, TikTok, other.
// Bank-transfer flow only — created as pending_payment so stock is reserved
// and payment is confirmed via the existing verify-payment path.
export function ManualOrderModal({ onClose, onCreated }) {
  const { showToast } = useToast();
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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Customer search autocomplete
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Product picker
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [pickQty, setPickQty] = useState(1);

  // Items in manual order: [{ key, product_id, variant_id, product_name, size, color, unit_price, quantity }]
  const [items, setItems] = useState([]);

  // Debounced customer search
  useEffect(() => {
    const q = customerQuery.trim();
    if (q.length < 2) {
      setCustomerResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await adminApi.get(`/admin/customers?search=${encodeURIComponent(q)}&limit=5`);
        if (res.success) {
          setCustomerResults(res.data?.customers || res.data || []);
        }
      } catch {
        setCustomerResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery]);

  // Debounced product search
  useEffect(() => {
    const q = productQuery.trim();
    if (q.length < 2) {
      setProductResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await adminApi.get(`/admin/products?search=${encodeURIComponent(q)}&limit=6`);
        if (res.success) {
          setProductResults(res.data?.products || res.data || []);
        }
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [productQuery]);

  const pickCustomer = (c) => {
    setCustomerId(c.id);
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    if (c.default_address) {
      setPostalCode(c.default_address.postal_code || '');
      setAddress(c.default_address.address || '');
      setDetailAddress(c.default_address.detail_address || '');
    }
    setCustomerResults([]);
    setCustomerQuery(c.name || c.email || '');
  };

  const clearLinkedCustomer = () => {
    setCustomerId(null);
    setCustomerQuery('');
  };

  const pickProduct = (p) => {
    setSelectedProduct(p);
    const colors = colorOptions(p);
    const initialColor = colors[0] || '';
    setSelectedColor(initialColor);
    const sizes = sizeOptions(p, initialColor);
    setSelectedSize(sizes[0]?.size || '');
    setPickQty(1);
    setProductResults([]);
  };

  const colorOptions = (prod) => {
    if (!prod) return [];
    if (Array.isArray(prod.colors) && prod.colors.length > 0) {
      return prod.colors.map(c => (typeof c === 'object' ? c.name_ko || c.name || c.name_en : c)).filter(Boolean);
    }
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      const set = new Set();
      prod.variants.forEach(v => { if (v.color) set.add(v.color); });
      if (set.size > 0) return Array.from(set);
    }
    return ['단일색상'];
  };

  const sizeOptions = (prod, color) => {
    if (!prod) return [];
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      const filtered = prod.variants.filter(v => !color || !v.color || v.color === color);
      return filtered.map(v => ({
        size: v.size || 'FREE',
        variant_id: v.id,
        available: typeof v.stock === 'number' ? v.stock : 99,
        price: v.price || prod.discount_price || prod.price,
      }));
    }
    const sizes = Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : ['FREE'];
    return sizes.map(s => ({
      size: s,
      variant_id: null,
      available: typeof prod.stock === 'number' ? prod.stock : 99,
      price: prod.discount_price || prod.price,
    }));
  };

  const currentAvailable = (() => {
    if (!selectedProduct) return 0;
    const sizes = sizeOptions(selectedProduct, selectedColor);
    const found = sizes.find(s => s.size === selectedSize);
    return found ? found.available : (selectedProduct.stock ?? 0);
  })();

  const totalAvailable = (prod) => {
    if (!prod) return 0;
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      return prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return prod.stock ?? 0;
  };

  const addItem = () => {
    if (!selectedProduct) return;
    const qty = Math.max(1, parseInt(pickQty, 10) || 1);
    if (qty > currentAvailable) {
      showToast(`남은 재고(${currentAvailable}개)보다 많이 선택할 수 없습니다.`, 'error');
      return;
    }
    const sizes = sizeOptions(selectedProduct, selectedColor);
    const found = sizes.find(s => s.size === selectedSize);
    const key = `${selectedProduct.id}-${selectedColor}-${selectedSize}`;
    const unitPrice = selectedProduct.discount_price || selectedProduct.price;

    setItems(prev => {
      const idx = prev.findIndex(i => i.key === key);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].quantity + qty;
        if (newQty > currentAvailable) {
          showToast(`남은 재고(${currentAvailable}개)를 초과합니다.`, 'error');
          return prev;
        }
        next[idx] = { ...next[idx], quantity: newQty };
        return next;
      }
      return [...prev, {
        key,
        product_id: selectedProduct.id,
        variant_id: found?.variant_id || null,
        product_name: selectedProduct.name_ko || selectedProduct.name || selectedProduct.name_en,
        color: selectedColor,
        size: selectedSize,
        variant_label: `${selectedColor} / ${selectedSize}`,
        unit_price: unitPrice,
        quantity: qty,
      }];
    });

    setSelectedProduct(null);
    setProductQuery('');
    setProductResults([]);
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const couponErrorText = (code) => {
    const map = {
      COUPON_CODE_REQUIRED: '쿠폰 코드를 입력해주세요.',
      COUPON_INVALID: '유효하지 않은 쿠폰 코드입니다.',
      COUPON_EXPIRED: '사용 기간이 아닌 쿠폰입니다.',
      COUPON_LIMIT_REACHED: '쿠폰 사용 수량이 모두 소진되었습니다.',
      COUPON_MINIMUM_NOT_MET: '최소 주문 금액을 충족하지 않아 사용할 수 없습니다.',
    };
    return map[code] || '쿠폰을 확인할 수 없습니다.';
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
        showToast(`쿠폰 적용됨: -${formatKRW(res.data.discount)}`, 'success');
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
  const shipping = 0;
  const total = Math.max(0, subtotal - couponDiscount + shipping);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('상품을 1개 이상 추가해주세요.', 'error');
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
        showToast('외부 주문이 등록되었습니다.', 'success');
        onCreated?.(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err?.message || '주문 등록 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <div className="adm-modal" role="dialog" aria-modal="true" aria-label="외부 주문 등록" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
          <div>
            <h2>
              외부 주문 등록 <small style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 400 }}>(Instagram / TikTok)</small>
            </h2>
            <p className="adm-modal-sub" style={{ marginBottom: 0 }}>
              등록 즉시 재고가 차감(예약)되며, 무통장 입금 검수 흐름으로 결제를 확정합니다.
            </p>
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="닫기">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: 12 }}>
          <div className="adm-form-grid">
            <div>
              <label className="adm-label" htmlFor="manual-source">주문 채널 *</label>
              <select id="manual-source" value={orderSource} onChange={(e) => setOrderSource(e.target.value)} className="adm-select" style={{ width: '100%' }}>
                {ORDER_SOURCES.filter(s => s !== 'website').map(s => (
                  <option key={s} value={s}>{sourceLabel(s, 'ko')}</option>
                ))}
                <option value="website">{sourceLabel('website', 'ko')}</option>
              </select>
            </div>
            <div>
              <label className="adm-label" htmlFor="manual-source-detail">채널 메모 (예: IG 아이디)</label>
              <input id="manual-source-detail" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} className="adm-input" placeholder="예: @noeul.seoul" maxLength={200} />
            </div>
          </div>

          <div className="adm-card" style={{ padding: '14px' }}>
            <label className="adm-label" htmlFor="manual-customer-search">
              회원 연결 (선택) {customerId && <span style={{ color: '#16a34a' }}>✓ 연결됨</span>}
            </label>
            <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
              <Search size={15} color="#999" aria-hidden style={{ position: 'absolute', top: '11px', left: '10px' }} />
              <input id="manual-customer-search" value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} className="adm-input" placeholder="이름 / 이메일 / 연락처 검색" style={{ paddingLeft: '32px' }} />
              {customerId && <button type="button" className="adm-btn" onClick={clearLinkedCustomer}>해제</button>}
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
              <div><label className="adm-label" htmlFor="manual-name">받는 분 *</label><input id="manual-name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="adm-input" maxLength={60} /></div>
              <div><label className="adm-label" htmlFor="manual-phone">연락처 *</label><input id="manual-phone" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="adm-input" placeholder="010-0000-0000" maxLength={30} /></div>
              <div className="full"><label className="adm-label" htmlFor="manual-email">이메일</label><input id="manual-email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="adm-input" maxLength={120} /></div>
              <div><label className="adm-label" htmlFor="manual-postal">우편번호 *</label><input id="manual-postal" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="adm-input" maxLength={20} /></div>
              <div><label className="adm-label" htmlFor="manual-addr">주소 *</label><input id="manual-addr" required value={address} onChange={(e) => setAddress(e.target.value)} className="adm-input" maxLength={200} /></div>
              <div className="full"><label className="adm-label" htmlFor="manual-addr-detail">상세 주소</label><input id="manual-addr-detail" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} className="adm-input" maxLength={200} /></div>
              <div className="full"><label className="adm-label" htmlFor="manual-memo">배송 메모</label><input id="manual-memo" value={shippingMemo} onChange={(e) => setShippingMemo(e.target.value)} className="adm-input" maxLength={300} /></div>
            </div>
          </div>

          <div className="adm-card" style={{ padding: '14px' }}>
            <label className="adm-label" htmlFor="manual-product-search">주문 상품 *</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#999" aria-hidden style={{ position: 'absolute', top: '11px', left: '10px' }} />
              <input id="manual-product-search" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className="adm-input" placeholder="상품 검색 (2글자 이상)" style={{ paddingLeft: '32px' }} />
            </div>
            {searchingProducts && <p style={{ fontSize: '0.75rem', color: '#888' }}>검색 중…</p>}
            {productResults.length > 0 && !selectedProduct && (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '6px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {productResults.filter(p => totalAvailable(p) > 0).map(p => (
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
                    <label className="adm-label" htmlFor="manual-color">색상</label>
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
                    <label className="adm-label" htmlFor="manual-size">사이즈</label>
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
                    <label className="adm-label" htmlFor="manual-qty">수량</label>
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
              {items.length === 0 && <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>아직 추가된 상품이 없습니다.</p>}
              {items.map(i => (
                <div key={i.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: '0.85rem', background: '#fafafa', border: '1px solid #f0f0f2', borderRadius: '6px', padding: '8px 12px' }}>
                  <span><strong>{i.product_name}</strong> <span style={{ color: '#71717a' }}>{i.variant_label} × {i.quantity}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <strong>{formatKRW(i.unit_price * i.quantity)}</strong>
                    <button type="button" onClick={() => removeItem(i.key)} aria-label="항목 삭제" className="adm-icon-btn" style={{ color: '#dc2626', width: 28, height: 28 }}><Trash2 size={14} aria-hidden /></button>
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
              <span>총 결제 금액</span><span>{formatKRW(total)}</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label className="adm-label" htmlFor="manual-coupon">쿠폰 코드 (선택)</label>
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }}>
                  <span><strong style={{ color: '#15803d' }}>✓ {appliedCoupon.code}</strong> <span style={{ color: '#15803d' }}>−{formatKRW(appliedCoupon.discount)}</span></span>
                  <button type="button" onClick={clearCoupon} aria-label="쿠폰 제거" className="adm-icon-btn" style={{ width: 28, height: 28 }}>✕</button>
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
                    {checkingCoupon ? '확인 중...' : '확인'}
                  </button>
                </div>
              )}
              {couponError && <p role="alert" style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '6px', marginBottom: 0 }}>{couponError}</p>}
            </div>
          </div>

          <div className="adm-modal-actions" style={{ marginTop: 0 }}>
            <button type="button" onClick={onClose} className="adm-btn" style={{ flex: 1 }} disabled={saving}>취소</button>
            <button type="submit" className="adm-btn adm-btn-primary" style={{ flex: 1 }} disabled={saving || items.length === 0}>
              {saving ? '등록 중...' : '주문 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
