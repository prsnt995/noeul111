import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ORDER_SOURCES, sourceLabel } from '../../utils/orderSources.js';
import { X, Search, Plus, Trash2 } from 'lucide-react';

// Manual / external order modal: Instagram, WhatsApp, phone, other.
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
  const [couponCode, setCouponCode] = useState('');
  const [items, setItems] = useState([]);

  // Customer search (link if exists)
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Product / variant picker
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
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
        setProductResults(res.data || []);
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

  // Variants come from the Supabase shape (product_variants via composeAdminProduct)
  // or legacy shape (sizes/colors arrays). Support both.
  const variantOptions = (p) => {
    if (!p) return [];
    if (Array.isArray(p.variants) && p.variants.length) {
      return p.variants.map(v => ({
        id: v.id,
        label: `${v.color || ''} / ${v.size || ''} (재고 ${Math.max(0, (v.stock || 0) - (v.reserved || 0))})`,
        available: Math.max(0, (v.stock || 0) - (v.reserved || 0)),
      }));
    }
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['FREE'];
    const colors = p.colors && p.colors.length ? p.colors : ['DEFAULT'];
    const stock = Number(p.stock ?? 0);
    const opts = [];
    for (const color of colors) {
      for (const size of sizes) {
        const c = typeof color === 'string' ? color : (color.name_ko || color.name_en || 'DEFAULT');
        const s = typeof size === 'string' ? size : 'FREE';
        opts.push({ id: null, productId: p.id, color: c, size: s, label: `${c} / ${s} (재고 ${stock})`, available: stock });
      }
    }
    return opts;
  };

  const variantKey = (o) => (o.id ? `id:${o.id}` : `combo:${o.color}|||${o.size}`);

  const addItem = () => {
    if (!selectedProduct) return;
    const opts = variantOptions(selectedProduct);
    const opt = opts.find(o => variantKey(o) === String(selectedVariant)) || opts[0];
    if (!opt) return;
    const qty = Math.max(1, Math.min(99, Number(pickQty) || 1));
    const unit = Number(selectedProduct.discount_price || selectedProduct.price || 0);
    setItems(prev => [...prev, {
      key: `${selectedProduct.id}-${opt.id || `${opt.color}-${opt.size}`}-${Date.now()}`,
      product_id: selectedProduct.id,
      variant_id: opt.id || null,
      variant_label: opt.label,
      color: opt.color || '',
      size: opt.size || '',
      product_name: selectedProduct.name_ko || selectedProduct.name_en || '',
      unit_price: unit,
      quantity: qty,
    }]);
    setSelectedProduct(null);
    setSelectedVariant('');
    setPickQty(1);
    setProductQuery('');
    setProductResults([]);
  };

  const removeItem = (key) => setItems(prev => prev.filter(i => i.key !== key));

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const shipping = items.length === 0 ? 0 : (subtotal >= 70000 ? 0 : 3000);
  const total = subtotal + shipping;

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
        coupon_code: couponCode.trim() || undefined,
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
              {lang === 'en' ? 'New Manual Order' : '외부 주문 등록'} <span style={{ fontSize: '0.8rem', color: '#71717a' }}>(Instagram / WhatsApp / Phone)</span>
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
                  <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); const first = variantOptions(p)[0]; setSelectedVariant(first ? (first.id ? `id:${first.id}` : `combo:${first.color}|||${first.size}`) : ''); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f2', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <strong>{p.name_ko}</strong> <span style={{ color: '#71717a' }}>{formatKRW(p.discount_price || p.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedProduct.name_ko}</span>
                <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} className="form-select" style={{ flex: 1, minWidth: '200px' }}>
                  {variantOptions(selectedProduct).map(o => (
                    <option key={variantKey(o)} value={variantKey(o)}>{o.label}</option>
                  ))}
                </select>
                <input type="number" min={1} max={99} value={pickQty} onChange={(e) => setPickQty(e.target.value)} className="form-input" style={{ width: '80px' }} />
                <button type="button" className="btn-secondary" onClick={addItem}><Plus size={14} /> 추가</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>배송비</span><span>{formatKRW(shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>{lang === 'en' ? 'Total' : '합계'}</span><span>{formatKRW(total)}</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label className="form-label">쿠폰 코드 (선택)</label>
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="form-input" placeholder="SAVE10" maxLength={40} />
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
