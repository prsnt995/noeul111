import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getOptimizedImageUrl, getProductPlaceholder } from '../utils/imageHelper.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { SizeGuideModal } from '../components/common/SizeGuideModal.jsx';
import { CommercePolicyNotice } from '../components/common/CommercePolicyNotice.jsx';
import { ProductReviews } from '../components/common/ProductReviews.jsx';
import { DetailContentBand } from '../components/product/DetailContentBand.jsx';
import {
  Heart,
  Plus,
  Minus,
  Truck,
  RefreshCw,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function ProductDetailPage() {
  const [, params] = useRoute('/product/:id');
  const [, setLocation] = useLocation();
  const { lang, t, formatKRW } = useLanguage();
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // Slider & interaction states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // 1. Fetch the canonical product — API supports both numeric id and slug.
  // No fixture fallback: failures render not-found explicitly (audit #24).
  useEffect(() => {
    async function loadProduct() {
      if (!params?.id) return;
      setLoading(true);
      // Clear all selection state up-front so nothing stale survives an ID change.
      setSelectedImageIndex(0);
      setSelectedSize('');
      setSelectedColor(null);
      setQuantity(1);
      setRelated([]);
      try {
        const { api } = await import('../utils/api.js');
        const data = await api.get(`/catalog/products/${encodeURIComponent(params.id)}`);
        if (data.success && data.data) {
          setProduct(data.data);
          setRelated(data.related || []);
          if (data.data.sizes?.length > 0) setSelectedSize(data.data.sizes[0]);
          if (data.data.colors?.length > 0) setSelectedColor(data.data.colors[0]);
          return;
        }
        throw new Error('not found');
      } catch (err) {
        setProduct(null);
        setRelated([]);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    window.scrollTo(0, 0);
  }, [params?.id]);

  // Normalized product images array (all 5, e.g., 2 blue + 3 green)
  const images = (() => {
    if (!product) return [];
    let list = [];
    if (Array.isArray(product.images)) list = product.images.filter(Boolean);
    else if (typeof product.images === 'string') {
      try {
        list = JSON.parse(product.images);
      } catch {}
      if (list.length === 0 && product.images) list = [product.images];
    }
    if (list.length === 0 && product.image_url) list = [product.image_url];
    if (list.length === 0) {
      list = [getProductPlaceholder(product)];
    }
    return list;
  })();

  // Reorder plan: show all 5 but move selected color's images first (e.g., blue 2 first, green 3 after)
  const orderedImages = useMemo(() => {
    if (!product || !selectedColor) return images;
    const colorName = selectedColor.name_en || selectedColor.name || selectedColor.name_ko;
    const media = product.media || product.product_media || [];
    const colorUrls = media.filter(m => m.color === colorName).map(m => m.url);
    if (colorUrls.length === 0) return images;
    const others = images.filter(url => !colorUrls.includes(url));
    return [...colorUrls, ...others];
  }, [images, selectedColor, product]);

  useEffect(() => {
    // When color changes, reset to first image of that color (reordered position 0)
    setSelectedImageIndex(0);
  }, [selectedColor]);

  const sizes = product && Array.isArray(product.sizes) ? product.sizes : ['FREE'];
  const colors = product && Array.isArray(product.colors) ? product.colors : [];
  const details = product?.details || {};
  const isWish = product ? isWishlisted(product.id) : false;
  const productName = product ? (lang === 'ko' ? (product.name_ko || product.name_en) : (product.name_en || product.name_ko)) : '';
  const variants = product ? (Array.isArray(product.variants) ? product.variants : Array.isArray(product.product_variants) ? product.product_variants : []) : [];
  // Price/URL may fall back to any same-color variant (older products), but
  // availability must match the exact color+size combo — unoffered combos
  // (no variant row) are never purchasable.
  const getVariant = (colorObj, sizeVal) => {
    const cName = colorObj?.name_en || colorObj?.name || colorObj;
    return variants.find(v => v.color === cName && v.size === sizeVal) || variants.find(v => v.color === cName) || variants.find(v => v.size === sizeVal) || null;
  };
  const currentVariant = getVariant(selectedColor, selectedSize) || variants[0] || null;
  const basePrice = product ? (product.discount_price || product.price) : 0;
  const finalPrice = currentVariant ? Math.max(1, basePrice + (currentVariant.price_delta || 0)) : basePrice;
  const isVariantAvailable = (colorObj, sizeVal) => {
    const cName = colorObj?.name_en || colorObj?.name || colorObj?.name_ko || colorObj;
    const sz = sizeVal ?? selectedSize;
    const v = variants.find(x => x.color === cName && x.size === sz && x.active !== false);
    if (!v) return false;
    const stock = (v.stock ?? 0);
    const reserved = (v.reserved ?? 0);
    return (stock - reserved) > 0;
  };

  // Sync variant to URL ?variant=uuid for shareable links
  useEffect(() => {
    if (!currentVariant?.id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', currentVariant.id);
    window.history.replaceState({}, '', url.toString());
  }, [currentVariant?.id]);

  // Initialize from ?variant= on load
  useEffect(() => {
    if (!product || variants.length===0) return;
    const vid = new URLSearchParams(window.location.search).get('variant');
    if (vid) {
      const v = variants.find(x=> x.id===vid);
      if (v) {
        if (v.size) setSelectedSize(v.size);
        const col = colors.find(c=> (c.name_en||c.name)===v.color);
        if (col) setSelectedColor(col);
        const mediaIdx = product.product_media ? product.product_media.findIndex(m=> m.variant_id===v.id) : -1;
        if (mediaIdx>=0) setSelectedImageIndex(mediaIdx);
      }
    }
  }, [product?.id]);

  // Show slug in URL instead of numeric id for SEO / shareability
  useEffect(() => {
    if (!product?.slug) return;
    const raw = String(params?.id || '');
    if (/^\d+$/.test(raw) && raw !== String(product.slug)) {
      const url = new URL(window.location.href);
      url.pathname = `/product/${product.slug}`;
      window.history.replaceState({}, '', url.toString());
    }
  }, [product?.slug, product?.id]);

  // Material extraction
  const productMaterial =
    product?.material ||
    details.fabric ||
    details.fabric_ko ||
    (lang === 'ko' ? '상품 상세 및 제품 라벨을 확인해주세요.' : 'Refer to the product description and label.');

  const currentMainImage = orderedImages[selectedImageIndex] || orderedImages[0] || images[0];

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
        <p>{t('product.loading_details')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
        <h2>{t('product.not_found')}</h2>
        <Link href="/shop" className="btn-primary" style={{ marginTop: '20px' }}>
          {t('cart.continue_shopping')}
        </Link>
      </div>
    );
  }



  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setLocation('/checkout');
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '90vh', padding: '32px 0 80px' }}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div
          style={{
            fontSize: '0.8125rem',
            color: '#8c8984',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: '#8c8984' }}>HOME</Link>
          <ChevronRight size={12} />
          <Link
            href={`/?gender=${product.gender || 'all'}`}
            style={{ textDecoration: 'none', color: '#8c8984', textTransform: 'uppercase' }}
          >
            {product.gender || 'ALL'}
          </Link>
          <ChevronRight size={12} />
          <Link
            href={`/?gender=${product.gender || 'all'}&category=${product.category || product.subcategory || 'all'}`}
            style={{ textDecoration: 'none', color: '#8c8984', textTransform: 'capitalize' }}
          >
            {product.category || product.subcategory || 'Collection'}
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: '#18181b', fontWeight: 500 }}>{productName}</span>
        </div>

        {/* Main Product Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '56px',
            alignItems: 'start',
            marginBottom: '80px',
          }}
        >
          {/* =========================================================
              LEFT: STATIC PRODUCT IMAGE & THUMBNAIL SELECTOR
              ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main Product Image Frame */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3 / 4',
                backgroundColor: '#f7f7f8',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                boxSizing: 'border-box',
              }}
            >
              <img
                src={getOptimizedImageUrl(currentMainImage, 1200)}
                alt={productName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* Clickable Thumbnails — shows all 5 but reordered by color (e.g., 2 blue first when blue selected) */}
            {orderedImages.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {orderedImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    style={{
                      width: '68px',
                      height: '84px',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      backgroundColor: '#f7f7f8',
                      border: selectedImageIndex === idx ? '2px solid #18181b' : '1px solid #e4e4e7',
                      opacity: selectedImageIndex === idx ? 1 : 0.65,
                      padding: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={getOptimizedImageUrl(img, 240)}
                      loading="lazy"
                      decoding="async"
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================
              RIGHT: PRODUCT DETAILS, SIZES, ACTIONS
              ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Category tag & Wishlist */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#8c8984',
                }}
              >
                {product.gender ? `${product.gender.toUpperCase()} • ` : ''}
                {product.category || product.subcategory || 'COLLECTION'}
              </span>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isWish ? '#ef4444' : '#71717a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8125rem',
                }}
              >
                <Heart size={18} fill={isWish ? '#ef4444' : 'none'} />
                <span>{isWish ? t('product.saved') : t('nav.wishlist')}</span>
              </button>
            </div>

            {/* Product Name */}
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                color: '#18181b',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}
            >
              {productName}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#18181b' }}>
                {formatKRW(finalPrice)}
              </span>

              {product.discount_price && (
                <span style={{ fontSize: '1rem', color: '#a1a1aa', textDecoration: 'line-through' }}>
                  {formatKRW(product.price)}
                </span>
              )}

              {product.discount_rate > 0 && (
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ef4444' }}>
                  {product.discount_rate}% OFF
                </span>
              )}
            </div>

            {/* Key Short Specs (Color • Material) */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#fafafa',
                border: '1px solid #f0f0f1',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                color: '#52525b',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div>
                <strong style={{ color: '#18181b' }}>{t('product.material')}:</strong>{' '}
                {productMaterial}
              </div>
              <div>
                <strong style={{ color: '#18181b' }}>{t('product.color_label')}:</strong>{' '}
                {product.color || (colors[0]?.name_en || 'Black')}
              </div>
            </div>

            {/* Color Swatch Selector */}
            {colors.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#18181b' }}>
                    {t('product.select_color')}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                    {selectedColor ? (lang === 'ko' ? (selectedColor.name_ko || selectedColor.name) : (selectedColor.name_en || selectedColor.name)) : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap:'wrap' }}>
                  {colors.map((c, idx) => {
                    const isSelected = selectedColor?.name === c.name || selectedColor?.hex === c.hex;
                    const available = isVariantAvailable(c, selectedSize);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!available}
                        onClick={() => { if(available) setSelectedColor(c); }}
                        title={`${c.name || c.name_en}${!available ? ' (품절)' : ''}${getVariant(c, selectedSize)?.price_delta ? ` +${formatKRW(getVariant(c, selectedSize).price_delta)}` : ''}`}
                        aria-label={`${c.name || c.name_en}${!available ? ' 품절' : ''}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: c.hex || '#111',
                          border: isSelected ? '2px solid #18181b' : '1px solid rgba(0,0,0,0.15)',
                          outline: isSelected ? '2px solid #18181b' : 'none',
                          outlineOffset: '2px',
                          cursor: available ? 'pointer' : 'not-allowed',
                          opacity: available ? 1 : 0.35,
                          position:'relative',
                        }}
                      >
                        {!available && <span style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#991b1b'}}>×</span>}
                      </button>
                    );
                  })}
                </div>
                {currentVariant?.price_delta ? <span style={{fontSize:'0.75rem', color:'#52525b', marginTop:6, display:'inline-block'}}>{currentVariant.price_delta>0?`+${formatKRW(currentVariant.price_delta)}`:`${formatKRW(currentVariant.price_delta)}`} (옵션 추가금)</span> : null}
              </div>
            )}

            {/* Available Sizes & Size Selector */}
            {sizes.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#18181b' }}>
                    {lang === 'ko' ? '사이즈 선택' : 'Available Sizes'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#71717a',
                      textDecoration: 'underline',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Ruler size={13} />
                    <span>{lang === 'ko' ? '사이즈 가이드' : 'Size Guide'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {sizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    const available = isVariantAvailable(selectedColor, sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!available}
                        onClick={() => { if(available) setSelectedSize(sz); }}
                        aria-disabled={!available}
                        title={!available ? '품절' : ''}
                        style={{
                          minWidth: '54px',
                          padding: '8px 14px',
                          fontSize: '0.8125rem',
                          fontWeight: isSelected ? 700 : 500,
                          borderRadius: '2px',
                          border: isSelected ? '1.5px solid #18181b' : '1px solid #e4e4e7',
                          backgroundColor: !available ? '#f4f4f5' : isSelected ? '#18181b' : '#ffffff',
                          color: !available ? '#a1a1aa' : isSelected ? '#ffffff' : '#18181b',
                          cursor: available ? 'pointer' : 'not-allowed',
                          opacity: available ? 1 : 0.6,
                          textDecoration: available ? 'none' : 'line-through',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#18181b', marginBottom: '8px' }}>
                {lang === 'ko' ? '수량' : 'Quantity'}
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #e4e4e7',
                  borderRadius: '3px',
                  backgroundColor: '#ffffff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#52525b' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ padding: '0 12px', fontWeight: 600, minWidth: '32px', textAlign: 'center', fontSize: '0.875rem' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#52525b' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Variant-aware out of stock warning */}
            {(!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️ {lang === 'ko' ? '선택한 옵션은 현재 일시 품절 상태입니다. (Out of Stock)' : 'Selected option is out of stock.'}</span>
              </div>
            )}

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                disabled={!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0}
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  backgroundColor: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? '#f4f4f5' : '#ffffff',
                  color: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? '#a1a1aa' : '#18181b',
                  border: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? '1px solid #d4d4d8' : '1.5px solid #18181b',
                  borderRadius: '2px',
                  cursor: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {(!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0)
                  ? (lang === 'ko' ? '품절 (Out of Stock)' : 'Out of Stock')
                  : (lang === 'ko' ? '장바구니 담기' : 'Add to Cart')}
              </button>

              <button
                type="button"
                disabled={!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0}
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  backgroundColor: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? '#e4e4e7' : '#18181b',
                  color: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? '#a1a1aa' : '#ffffff',
                  border: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? '1px solid #d4d4d8' : '1.5px solid #18181b',
                  borderRadius: '2px',
                  cursor: (!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {(!isVariantAvailable(selectedColor, selectedSize) || product?.stock <= 0)
                  ? (lang === 'ko' ? '품절 (Out of Stock)' : 'Out of Stock')
                  : (lang === 'ko' ? '바로 구매하기' : 'Buy Now')}
              </button>
            </div>

            {/* Shipping & Return Policy Highlights */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingTop: '16px',
                borderTop: '1px solid #f0f0f1',
                fontSize: '0.8125rem',
                color: '#52525b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={16} color="#18181b" />
                <span>
                  <strong>{lang === 'ko' ? '배송 정보' : 'Shipping'}:</strong>{' '}
                  {lang === 'ko' ? '배송비와 공급 일정은 아래 배송 안내에서 확인해주세요.' : 'See shipping information below for fees and dispatch timing.'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} color="#18181b" />
                <span>
                  <strong>{lang === 'ko' ? '교환 및 반품' : 'Returns'}:</strong>{' '}
                  {lang === 'ko' ? '수령 후 7일 이내 청약철회 가능. 상세 조건은 반품 안내를 확인해주세요.' : 'Withdrawal within 7 days of delivery; see the return conditions below.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            PRODUCT INFORMATION TABS (Description, Material, Shipping, Reviews)
            ========================================================= */}
        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '36px', marginBottom: (product?.detail_blocks || []).length ? '24px' : '80px' }}>
          <div style={{ display: 'flex', gap: '28px', borderBottom: '1px solid #f0f0f1', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              style={{
                paddingBottom: '12px',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'details' ? 700 : 500,
                color: activeTab === 'details' ? '#18181b' : '#71717a',
                borderBottom: activeTab === 'details' ? '2px solid #18181b' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
              }}
            >
              {lang === 'ko' ? '상품 상세 설명' : 'Description'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fabric')}
              style={{
                paddingBottom: '12px',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'fabric' ? 700 : 500,
                color: activeTab === 'fabric' ? '#18181b' : '#71717a',
                borderBottom: activeTab === 'fabric' ? '2px solid #18181b' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
              }}
            >
              {lang === 'ko' ? '소재 및 관리 (Material)' : 'Material & Care'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              style={{
                paddingBottom: '12px',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'shipping' ? 700 : 500,
                color: activeTab === 'shipping' ? '#18181b' : '#71717a',
                borderBottom: activeTab === 'shipping' ? '2px solid #18181b' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
              }}
            >
              {lang === 'ko' ? '배송 & 교환/반품 안내' : 'Shipping & Returns'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              style={{
                paddingBottom: '12px',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'reviews' ? 700 : 500,
                color: activeTab === 'reviews' ? '#18181b' : '#71717a',
                borderBottom: activeTab === 'reviews' ? '2px solid #18181b' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
              }}
            >
              {lang === 'ko' ? '고객 리뷰' : 'Reviews'}
            </button>
          </div>

          {/* Tab Content Display */}
          <div style={{ maxWidth: '820px', lineHeight: 1.8, fontSize: '0.9375rem', color: '#3f3f46' }}>
            {activeTab === 'details' && (
              <div>
                <p style={{ marginBottom: '16px' }}>
                  {lang === 'ko' ? (product.description_ko || product.description) : (product.description || product.description_ko)}
                </p>
                <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f0f0f1', padding: '16px 20px', borderRadius: '4px' }}>
                  <p style={{ margin: '4px 0' }}>• <strong>SKU:</strong> {product.sku}</p>
                  <p style={{ margin: '4px 0' }}>• <strong>Gender:</strong> {product.gender ? product.gender.toUpperCase() : 'UNISEX'}</p>
                  {(details.origin || product.origin) && <p style={{ margin: '4px 0' }}>• <strong>Origin:</strong> {details.origin || product.origin}</p>}
                </div>
              </div>
            )}

            {activeTab === 'fabric' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
                  {lang === 'ko' ? '소재 구성' : 'Fabric & Material Composition'}
                </h4>
                <p style={{ marginBottom: '16px' }}>{productMaterial}</p>
                <h4 style={{ fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
                  {lang === 'ko' ? '세탁 및 취급 주의사항' : 'Care Instructions'}
                </h4>
                <p>
                  {lang === 'ko'
                    ? (details.care_ko || details.care || '제품 라벨에 표시된 세탁·취급 방법을 따라주세요.')
                    : (details.care || details.care_ko || 'Follow the washing and care instructions on the product label.')}
                </p>
              </div>
            )}

            {activeTab === 'shipping' && <CommercePolicyNotice />}

            {activeTab === 'reviews' && (
              <ProductReviews productId={product.id} />
            )}
          </div>
        </div>

        {/* Rich content band (admin-managed detail_blocks) — below tabs */}
        <DetailContentBand blocks={product?.detail_blocks || []} />

        {/* Related Products Recommendation */}
        {related.length > 0 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', color: '#8c8984', textTransform: 'uppercase' }}>
                YOU MAY ALSO LIKE
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#18181b', marginTop: '2px' }}>
                {lang === 'ko' ? '함께 매치하기 좋은 상품' : 'Recommended Pieces'}
              </h2>
            </div>
            <div className="noeul-product-grid">
              {related.map((rel) => (
                <ProductCard key={rel.id} product={rel} variant="overlay" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        categorySlug={product.category || product.subcategory}
      />
    </div>
  );
}
