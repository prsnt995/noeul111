import React from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '../../context/CartContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    subtotal,
    shippingFee,
    totalAmount,
    freeShippingRemaining,
    freeShippingProgress,
    freeShippingThreshold,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const { lang, t, formatKRW } = useLanguage();
  const [, setLocation] = useLocation();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    closeCart();
    setLocation('/checkout');
  };

  return (
    <div className="backdrop" onClick={closeCart}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 101,
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('cart.title')}</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              ({items.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>
          <button onClick={closeCart} style={{ padding: '4px', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Tracker */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.8125rem', fontWeight: 500 }}>
            <Truck size={16} color="var(--accent-sunset)" />
            <span>
              {freeShippingRemaining > 0
                ? t('cart.free_shipping_hint', { amount: formatKRW(freeShippingRemaining) })
                : t('cart.free_shipping_reached')}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '5px',
              backgroundColor: '#e5e2db',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
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

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('cart.empty')}
              </p>
              <p style={{ fontSize: '0.875rem', marginBottom: '24px' }}>
                {t('cart.empty_desc')}
              </p>
              <button
                onClick={() => { closeCart(); setLocation('/shop'); }}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                {t('cart.continue_shopping')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '100px',
                      borderRadius: '4px',
                      backgroundColor: '#f7f7f8',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name_ko}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  {/* Item Details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3 }}>
                          {lang === 'ko' ? item.name_ko : item.name_en}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ color: 'var(--text-muted)', padding: '2px' }}
                          title={t('cart.remove')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Variant tags */}
                      <div style={{ display: 'flex', gap: '6px', margin: '6px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '3px' }}>
                          {item.size}
                        </span>
                        <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '3px' }}>
                          {lang === 'ko' ? item.color_ko : item.color_en}
                        </span>
                      </div>
                    </div>

                    {/* Price & Quantity Adjuster */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 8px', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {formatKRW(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Summary & Checkout CTA */}
        {items.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--border-light)',
              backgroundColor: '#faf9f7',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <span>{t('cart.subtotal')}</span>
              <span>{formatKRW(subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>
              <span>{t('cart.shipping_fee')}</span>
              <span>{shippingFee === 0 ? t('cart.free') : formatKRW(shippingFee)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', paddingTop: '10px', borderTop: '1px dashed var(--border-light)' }}>
              <span>{t('cart.total')}</span>
              <span style={{ color: 'var(--accent-sunset)' }}>{formatKRW(totalAmount)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-primary btn-accent"
              style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
            >
              <span>{t('cart.checkout')}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                href="/cart"
                onClick={closeCart}
                style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                {t('cart.view_full')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
