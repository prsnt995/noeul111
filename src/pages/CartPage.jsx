import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '../context/CartContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Trash2, Plus, Minus, ArrowRight, Truck, ShoppingBag, Tag } from 'lucide-react';

export function CartPage() {
  const {
    items,
    subtotal,
    shippingFee,
    totalAmount,
    freeShippingRemaining,
    freeShippingProgress,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { lang, t, formatKRW } = useLanguage();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'WELCOME10' || couponCode.trim().toUpperCase() === 'NOEUL10') {
      const disc = Math.round(subtotal * 0.1);
      setAppliedDiscount(disc);
      showToast(lang === 'ko' ? '10% 할인 쿠폰이 적용되었습니다!' : '10% Welcome Coupon Applied!', 'success');
    } else {
      showToast(lang === 'ko' ? '유효하지 않은 쿠폰 코드입니다. (WELCOME10을 입력해보세요)' : 'Invalid code. (Try WELCOME10)', 'error');
    }
  };

  const finalTotal = Math.max(0, totalAmount - appliedDiscount);

  if (items.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 20px' }}>
        <ShoppingBag size={56} strokeWidth={1} style={{ margin: '0 auto 20px', opacity: 0.4 }} />
        <h2 className="font-serif" style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '8px' }}>
          {t('cart.empty')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {t('cart.empty_desc')}
        </p>
        <Link href="/shop" className="btn-primary" style={{ padding: '14px 32px' }}>
          {t('cart.continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1 className="font-serif" style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: '32px' }}>
          {t('cart.title')}
        </h1>

        {/* Free Shipping Banner */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '18px 24px',
            border: '1px solid var(--border-light)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
            <Truck size={18} color="var(--accent-sunset)" />
            <span>
              {freeShippingRemaining > 0
                ? t('cart.free_shipping_hint', { amount: formatKRW(freeShippingRemaining) })
                : t('cart.free_shipping_reached')}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${freeShippingProgress}%`,
                height: '100%',
                backgroundColor: freeShippingProgress >= 100 ? '#16a34a' : 'var(--accent-sunset)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Main Grid: Cart Items & Order Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'start' }}>
          {/* Left: Items Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {lang === 'ko' ? '상품 정보' : 'Product Details'}
              </span>
              <button
                onClick={clearCart}
                style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                {t('cart.clear_cart')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.name_ko}
                    style={{ width: '90px', height: '115px', objectFit: 'cover', borderRadius: '4px' }}
                  />

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Link href={`/product/${item.product_id}`} style={{ fontWeight: 600, fontSize: '1rem' }}>
                          {lang === 'ko' ? item.name_ko : item.name_en}
                        </Link>
                        <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', margin: '6px 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '3px' }}>
                          {item.size}
                        </span>
                        <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '3px' }}>
                          {lang === 'ko' ? item.color_ko : item.color_en}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '0 10px', fontWeight: 600, fontSize: '0.875rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                        {formatKRW(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>
              {t('checkout.order_summary')}
            </h3>

            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Tag size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={lang === 'ko' ? '쿠폰 코드 (WELCOME10)' : 'Promo code (WELCOME10)'}
                  className="form-input"
                  style={{ paddingLeft: '36px', textTransform: 'uppercase' }}
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ padding: '0 18px', whiteSpace: 'nowrap' }}>
                {lang === 'ko' ? '적용' : 'Apply'}
              </button>
            </form>

            {/* Summary lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                <span>{t('cart.subtotal')}</span>
                <span>{formatKRW(subtotal)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', color: 'var(--accent-sunset)' }}>
                  <span>{lang === 'ko' ? '쿠폰 할인 (10%)' : 'Coupon Discount'}</span>
                  <span>-{formatKRW(appliedDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                <span>{t('cart.shipping_fee')}</span>
                <span>{shippingFee === 0 ? t('cart.free') : formatKRW(shippingFee)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <span>{t('cart.total')}</span>
                <span style={{ color: 'var(--accent-sunset)' }}>{formatKRW(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => setLocation('/checkout')}
              className="btn-primary btn-accent"
              style={{ width: '100%', padding: '16px', fontSize: '1.0625rem' }}
            >
              <span>{t('cart.checkout')}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
