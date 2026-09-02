import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { SizeGuideModal } from '../components/common/SizeGuideModal.jsx';
import { ProductReviews } from '../components/common/ProductReviews.jsx';
import { Heart, Plus, Minus, Share2, Shield, Truck, RefreshCw, Ruler, Check } from 'lucide-react';

export function ProductDetailPage() {
  const [, params] = useRoute('/product/:id');
  const [, setLocation] = useLocation();
  const { lang, t, formatKRW } = useLanguage();
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!params?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
          setRelated(data.related || []);
          if (data.data.sizes?.length > 0) setSelectedSize(data.data.sizes[0]);
          if (data.data.colors?.length > 0) setSelectedColor(data.data.colors[0]);
          setSelectedImageIndex(0);
          setQuantity(1);
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    window.scrollTo(0, 0);
  }, [params?.id]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
        <p>{lang === 'ko' ? '상품 정보를 불러오는 중입니다...' : 'Loading product...'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
        <h2>{lang === 'ko' ? '상품을 찾을 수 없습니다.' : 'Product not found.'}</h2>
        <Link href="/shop" className="btn-primary" style={{ marginTop: '20px' }}>
          {t('cart.continue_shopping')}
        </Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=900&auto=format&fit=crop'];

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const details = product.details || {};
  const isWish = isWishlisted(product.id);
  const finalPrice = product.discount_price || product.price;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setLocation('/checkout');
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Breadcrumbs */}
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <Link href="/">{t('nav.home')}</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category_slug}`}>
            {lang === 'ko' ? product.category_name_ko : product.category_name_en}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {lang === 'ko' ? product.name_ko : product.name_en}
          </span>
        </div>

        {/* Product Main Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '56px',
            alignItems: 'start',
            marginBottom: '80px',
          }}
        >
          {/* Left: Multi-image Gallery */}
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'row-reverse' }} className="gallery-container">
            {/* Main Active Image */}
            <div
              style={{
                flex: 1,
                aspectRatio: '3 / 4',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <img
                src={images[selectedImageIndex]}
                alt={product.name_ko}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.2s ease',
                }}
              />
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {product.is_new ? <span className="badge badge-new">NEW</span> : null}
                {product.is_best ? <span className="badge badge-best">BEST</span> : null}
                {product.discount_rate > 0 ? <span className="badge badge-sale">-{product.discount_rate}%</span> : null}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  width: '80px',
                }}
              >
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      aspectRatio: '3 / 4',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: selectedImageIndex === idx ? '2px solid var(--text-primary)' : '1px solid var(--border-light)',
                      opacity: selectedImageIndex === idx ? 1 : 0.6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'ko' ? product.category_name_ko : product.category_name_en} • SKU: {product.sku}
                </span>
                <button
                  onClick={() => toggleWishlist(product)}
                  style={{
                    color: isWish ? 'var(--accent-sunset)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <Heart size={18} fill={isWish ? 'var(--accent-sunset)' : 'none'} />
                  <span>{isWish ? t('product.wishlist_remove') : t('product.wishlist_add')}</span>
                </button>
              </div>

              <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.25, marginBottom: '16px' }}>
                {lang === 'ko' ? product.name_ko : product.name_en}
              </h1>

              {/* Pricing in KRW */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
                {product.discount_price && (
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-sunset)' }}>
                    {product.discount_rate}%
                  </span>
                )}
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatKRW(finalPrice)}
                </span>
                {product.discount_price && (
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {formatKRW(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              {lang === 'ko' ? product.description_ko : product.description_en}
            </p>

            {/* Color Swatch Selection */}
            {colors.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('product.select_color')}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {lang === 'ko' ? selectedColor?.name_ko : selectedColor?.name_en}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {colors.map((c, idx) => {
                    const isSelected = selectedColor?.name_ko === c.name_ko;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(c)}
                        title={lang === 'ko' ? c.name_ko : c.name_en}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: c.hex === '#FFFFFF' ? '1px solid #ccc' : 'none',
                          outline: isSelected ? '2px solid var(--accent-sunset)' : 'none',
                          outlineOffset: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <Check size={14} color={c.hex === '#FFFFFF' ? '#111' : '#fff'} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection & Size Guide Trigger */}
            {sizes.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('product.select_size')}</span>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'underline',
                    }}
                  >
                    <Ruler size={14} />
                    <span>{t('product.size_guide')}</span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '4px',
                        border: selectedSize === sz ? '1.5px solid var(--text-primary)' : '1px solid var(--border-light)',
                        backgroundColor: selectedSize === sz ? 'var(--text-primary)' : '#ffffff',
                        color: selectedSize === sz ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                  {t('product.quantity')}
                </span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: '0 12px', fontWeight: 600, minWidth: '32px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Stock Indicator */}
              <div style={{ marginTop: '24px' }}>
                {product.stock <= 0 ? (
                  <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: 600 }}>
                    {t('product.out_of_stock')}
                  </span>
                ) : product.stock <= 10 ? (
                  <span style={{ color: 'var(--accent-sunset)', fontSize: '0.875rem', fontWeight: 600 }}>
                    {t('product.low_stock', { count: product.stock })}
                  </span>
                ) : (
                  <span style={{ color: '#16a34a', fontSize: '0.875rem', fontWeight: 500 }}>
                    ● {t('product.in_stock')}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="btn-secondary"
                style={{ flex: 1, padding: '16px', fontSize: '1rem', opacity: product.stock <= 0 ? 0.5 : 1 }}
              >
                {t('product.add_to_cart')}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="btn-primary btn-accent"
                style={{ flex: 1, padding: '16px', fontSize: '1rem', opacity: product.stock <= 0 ? 0.5 : 1 }}
              >
                {t('product.buy_now')}
              </button>
            </div>

            {/* Service & Guarantee Badges */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={16} color="var(--accent-sunset)" />
                <span>{lang === 'ko' ? '₩70,000 이상 무료배송' : 'Free Shipping over ₩70,000'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} color="var(--accent-sunset)" />
                <span>{lang === 'ko' ? '7일 이내 안심 반품' : '7-Day Return Policy'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Tabs */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '40px', marginBottom: '80px' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-light)', marginBottom: '32px' }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                paddingBottom: '12px',
                fontSize: '1rem',
                fontWeight: activeTab === 'details' ? 600 : 400,
                color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'details' ? '2px solid var(--text-primary)' : '2px solid transparent',
              }}
            >
              {t('product.tab_details')}
            </button>

            <button
              onClick={() => setActiveTab('fabric')}
              style={{
                paddingBottom: '12px',
                fontSize: '1rem',
                fontWeight: activeTab === 'fabric' ? 600 : 400,
                color: activeTab === 'fabric' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'fabric' ? '2px solid var(--text-primary)' : '2px solid transparent',
              }}
            >
              {t('product.tab_fabric')}
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              style={{
                paddingBottom: '12px',
                fontSize: '1rem',
                fontWeight: activeTab === 'shipping' ? 600 : 400,
                color: activeTab === 'shipping' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'shipping' ? '2px solid var(--text-primary)' : '2px solid transparent',
              }}
            >
              {t('product.tab_shipping')}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                paddingBottom: '12px',
                fontSize: '1rem',
                fontWeight: activeTab === 'reviews' ? 600 : 400,
                color: activeTab === 'reviews' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'reviews' ? '2px solid var(--text-primary)' : '2px solid transparent',
              }}
            >
              {lang === 'ko' ? '고객 리뷰' : 'Reviews'}
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ maxWidth: '800px', lineHeight: 1.8, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            {activeTab === 'reviews' && (
              <ProductReviews productId={product.id} />
            )}
            {activeTab === 'details' && (
              <div>
                <p style={{ marginBottom: '16px' }}>
                  {lang === 'ko' ? product.description_ko : product.description_en}
                </p>
                {details.model_info_ko && (
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '12px' }}>
                    • {lang === 'ko' ? details.model_info_ko : details.model_info_en}
                  </p>
                )}
                {details.fit_ko && (
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    • {lang === 'ko' ? `실루엣: ${details.fit_ko}` : `Fit: ${details.fit}`}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'fabric' && (
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{lang === 'ko' ? '원단 구성' : 'Composition'}</h4>
                <p style={{ marginBottom: '16px' }}>{lang === 'ko' ? details.fabric_ko || details.fabric : details.fabric}</p>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{lang === 'ko' ? '세탁 및 취급 주의사항' : 'Care Instructions'}</h4>
                <p>{lang === 'ko' ? details.care_ko || details.care_en : details.care_en}</p>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{lang === 'ko' ? '배송 안내' : 'Shipping Info'}</h4>
                <p style={{ marginBottom: '16px' }}>
                  {lang === 'ko'
                    ? '• CJ대한통운을 통해 평일 기준 1~3일 이내에 출고됩니다. ₩70,000 이상 결제 시 무료 배송이며, 미만 주문 시 ₩3,000의 배송비가 부과됩니다.'
                    : '• Dispatched within 1-3 business days via CJ Logistics. Free shipping on orders ₩70,000 and above.'}
                </p>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{lang === 'ko' ? '교환 및 반품' : 'Exchange & Returns'}</h4>
                <p>
                  {lang === 'ko'
                    ? '• 상품 수령일로부터 7일 이내에 마이페이지에서 교환/반품 신청이 가능합니다. 왕복 배송비는 6,000원입니다.'
                    : '• Eligible for exchange or return within 7 days of delivery. Return shipping fee is ₩6,000.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Recommendation */}
        {related.length > 0 && (
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '28px' }}>
              {t('product.related_products')}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '24px',
              }}
            >
              {related.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        categorySlug={product.category_slug}
      />
    </div>
  );
}
