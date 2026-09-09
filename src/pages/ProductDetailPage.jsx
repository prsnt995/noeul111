import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { SizeGuideModal } from '../components/common/SizeGuideModal.jsx';
import { ProductReviews } from '../components/common/ProductReviews.jsx';
import { getProductById, getRelatedProducts } from '../data/products.js';
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
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  // 1. Fetch product by ID (API with graceful local dataset fallback)
  useEffect(() => {
    async function loadProduct() {
      if (!params?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
          setRelated(data.related || getRelatedProducts(data.data));
          if (data.data.sizes?.length > 0) setSelectedSize(data.data.sizes[0]);
          if (data.data.colors?.length > 0) setSelectedColor(data.data.colors[0]);
        } else {
          // Fallback to master dataset
          const localItem = getProductById(params.id);
          if (localItem) {
            setProduct(localItem);
            setRelated(getRelatedProducts(localItem));
            if (localItem.sizes?.length > 0) setSelectedSize(localItem.sizes[0]);
            if (localItem.colors?.length > 0) setSelectedColor(localItem.colors[0]);
          }
        }
      } catch (err) {
        const localItem = getProductById(params.id);
        if (localItem) {
          setProduct(localItem);
          setRelated(getRelatedProducts(localItem));
          if (localItem.sizes?.length > 0) setSelectedSize(localItem.sizes[0]);
          if (localItem.colors?.length > 0) setSelectedColor(localItem.colors[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    setSelectedImageIndex(0);
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [params?.id]);

  // Normalized 5 images
  const images = (() => {
    if (!product) return [];
    let list = [];
    if (Array.isArray(product.images)) list = product.images.filter(Boolean);
    else if (typeof product.images === 'string') {
      try {
        list = JSON.parse(product.images);
      } catch {}
    }
    if (list.length === 0) {
      list = ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'];
    }
    const result = [...list];
    let padIdx = 0;
    while (result.length < 5) {
      result.push(list[padIdx % list.length]);
      padIdx++;
    }
    return result.slice(0, 5);
  })();

  // 2. Automatic slide change every 3 seconds on the large product image
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length, isHovered]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
        <p>{lang === 'ko' ? '상품 정보를 불러오는 중입니다...' : 'Loading product details...'}</p>
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

  const sizes = Array.isArray(product.sizes) ? product.sizes : ['FREE'];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const details = product.details || {};
  const isWish = isWishlisted(product.id);
  const finalPrice = product.discount_price || product.price;
  const productName = lang === 'ko' ? (product.name_ko || product.name_en) : (product.name_en || product.name_ko);

  // Material extraction
  const productMaterial =
    product.material ||
    details.fabric ||
    details.fabric_ko ||
    (lang === 'ko' ? '100% 최고급 코튼' : '100% Combed Cotton');

  // Manual image slider handlers
  const handlePrevImage = (e) => {
    e?.preventDefault();
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e) => {
    e?.preventDefault();
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 35) {
      handleNextImage();
    } else if (diff < -35) {
      handlePrevImage();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

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
            href={`/shop?gender=${product.gender || 'all'}`}
            style={{ textDecoration: 'none', color: '#8c8984', textTransform: 'uppercase' }}
          >
            {product.gender || 'ALL'}
          </Link>
          <ChevronRight size={12} />
          <Link
            href={`/shop?category=${product.category || product.subcategory || 'all'}`}
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
              LEFT: 5-IMAGE LARGE SLIDER & THUMBNAILS
              ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Large Product Image Frame */}
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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
              }}
            >
              {/* Slider Track with Smooth Transition */}
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  transform: `translateX(-${selectedImageIndex * 100}%)`,
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform',
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      minWidth: '100%',
                      width: '100%',
                      height: '100%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <img
                      src={img}
                      alt={`${productName} view ${idx + 1}`}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        userSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Slider Left Chevron Arrow */}
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous image"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#18181b',
                  cursor: 'pointer',
                  zIndex: 5,
                }}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Slider Right Chevron Arrow */}
              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next image"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#18181b',
                  cursor: 'pointer',
                  zIndex: 5,
                }}
              >
                <ChevronRight size={20} />
              </button>

              {/* Slide Counter Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(24, 24, 27, 0.75)',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  zIndex: 5,
                }}
              >
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails Row (All 5 thumbnails clickable) */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
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
                    src={img}
                    alt="Thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
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
                <span>{isWish ? (lang === 'ko' ? '위시리스트 담김' : 'Saved') : (lang === 'ko' ? '위시리스트' : 'Wishlist')}</span>
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
                <strong style={{ color: '#18181b' }}>{lang === 'ko' ? '소재' : 'Material'}:</strong>{' '}
                {productMaterial}
              </div>
              <div>
                <strong style={{ color: '#18181b' }}>{lang === 'ko' ? '색상' : 'Color'}:</strong>{' '}
                {product.color || (colors[0]?.name_en || 'Black')}
              </div>
            </div>

            {/* Color Swatch Selector */}
            {colors.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#18181b' }}>
                    {lang === 'ko' ? '색상 선택' : 'Select Color'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                    {selectedColor ? (lang === 'ko' ? (selectedColor.name_ko || selectedColor.name) : (selectedColor.name_en || selectedColor.name)) : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {colors.map((c, idx) => {
                    const isSelected = selectedColor?.name === c.name || selectedColor?.hex === c.hex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        title={c.name || c.name_en}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: c.hex || '#111',
                          border: isSelected ? '2px solid #18181b' : '1px solid rgba(0,0,0,0.15)',
                          outline: isSelected ? '2px solid #18181b' : 'none',
                          outlineOffset: '2px',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>
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
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        style={{
                          minWidth: '54px',
                          padding: '8px 14px',
                          fontSize: '0.8125rem',
                          fontWeight: isSelected ? 700 : 500,
                          borderRadius: '2px',
                          border: isSelected ? '1.5px solid #18181b' : '1px solid #e4e4e7',
                          backgroundColor: isSelected ? '#18181b' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#18181b',
                          cursor: 'pointer',
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

            {/* Out of stock warning banner */}
            {product?.stock <= 0 && (
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
                <span>⚠️ {lang === 'ko' ? '이 상품은 현재 일시 품절 상태입니다. (Out of Stock)' : 'This item is currently out of stock.'}</span>
              </div>
            )}

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                disabled={product?.stock <= 0}
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  backgroundColor: product?.stock <= 0 ? '#f4f4f5' : '#ffffff',
                  color: product?.stock <= 0 ? '#a1a1aa' : '#18181b',
                  border: product?.stock <= 0 ? '1px solid #d4d4d8' : '1.5px solid #18181b',
                  borderRadius: '2px',
                  cursor: product?.stock <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {product?.stock <= 0
                  ? (lang === 'ko' ? '품절 (Out of Stock)' : 'Out of Stock')
                  : (lang === 'ko' ? '장바구니 담기' : 'Add to Cart')}
              </button>

              <button
                type="button"
                disabled={product?.stock <= 0}
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  backgroundColor: product?.stock <= 0 ? '#e4e4e7' : '#18181b',
                  color: product?.stock <= 0 ? '#a1a1aa' : '#ffffff',
                  border: product?.stock <= 0 ? '1px solid #d4d4d8' : '1.5px solid #18181b',
                  borderRadius: '2px',
                  cursor: product?.stock <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {product?.stock <= 0
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
                  {lang === 'ko' ? '전국 무료배송 (₩70,000 이상 결제 시) / 기본 배송비 ₩3,000' : 'Complimentary shipping on orders over ₩70,000.'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} color="#18181b" />
                <span>
                  <strong>{lang === 'ko' ? '교환 및 반품' : 'Returns'}:</strong>{' '}
                  {lang === 'ko' ? '수령 후 7일 이내 간편 반품 및 교환 가능' : '7-day hassle-free returns and exchanges.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            PRODUCT INFORMATION TABS (Description, Material, Shipping, Reviews)
            ========================================================= */}
        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '36px', marginBottom: '80px' }}>
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
                  <p style={{ margin: '4px 0' }}>• <strong>Origin:</strong> Made in Seoul, Republic of Korea</p>
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
                    ? '첫 세탁은 드라이클리닝을 권장합니다. 찬물 단독 손세탁 또는 중성세제를 이용한 울코스 세탁을 추천하며 직사광선을 피해 그늘에서 건조하십시오.'
                    : 'Machine wash cold delicate cycle with mild detergent. Lay flat to dry away from direct sunlight. Dry clean recommended for initial cleaning.'}
                </p>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
                  {lang === 'ko' ? '배송 안내 (Shipping)' : 'Shipping Information'}
                </h4>
                <p style={{ marginBottom: '16px' }}>
                  {lang === 'ko'
                    ? '우체국택배 및 CJ대한통운을 통해 평일 오후 2시 이전 결제 완료 시 당일 출고됩니다. ₩70,000 이상 구매 시 무료배송(기본 배송비 ₩3,000, 제주/도서산간 ₩3,000 추가) 혜택이 적용됩니다.'
                    : 'Orders placed before 2:00 PM KST ship the same business day via standard courier. Complimentary delivery for orders over ₩70,000.'}
                </p>
                <h4 style={{ fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
                  {lang === 'ko' ? '교환 및 반품 안내 (Returns & Exchanges)' : 'Return & Exchange Policy'}
                </h4>
                <p>
                  {lang === 'ko'
                    ? '상품 수령 후 7일 이내 마이페이지 주문조회 또는 고객센터를 통해 접수 가능합니다. 착용 흔적, 향수 냄새, 택 제거가 없는 온전한 상태여야 합니다.'
                    : 'Returns and exchanges are accepted within 7 days of delivery. Items must be unworn, undamaged, with all original tags intact.'}
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviews productId={product.id} />
            )}
          </div>
        </div>

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
        categorySlug={product.category || product.subcategory}
      />
    </div>
  );
}
