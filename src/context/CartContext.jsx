import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext.jsx';
import { api } from '../utils/api.js';

const CartContext = createContext();

const STORAGE_KEY = 'noeul_cart';
const BUYNOW_KEY = 'noeul_buynow';
const STORAGE_VERSION = 2;

const DEFAULT_SHIPPING_POLICY = { threshold: 0, fee: 0, socks_fee: 3000, socks_free_pairs: 3 };

function isSocksCartItem(item) {
  const category = String(item?.category || item?.product_category || '').toLowerCase();
  if (category === 'socks' || category === 'sock') return true;
  const name = `${item?.name_ko || ''} ${item?.name_en || ''}`.toLowerCase();
  return name.includes('sock') || name.includes('양말') || name.includes('삭스');
}

// Resolve variant_id from product.variants when available (authoritative stock SKU)
function resolveVariant(product, sizeVal, colorNameKo, colorNameEn, colorRaw, lengthVal) {
  const variants = Array.isArray(product.variants) ? product.variants : Array.isArray(product.product_variants) ? product.product_variants : [];
  if (variants.length === 0) return null;
  const norm = (s) => String(s || '').trim().toUpperCase();
  const colorRawName = typeof colorRaw === 'object' ? (colorRaw.name || colorRaw.name_en || colorRaw.name_ko) : colorRaw;
  // 1. Exact match by size and any color representation
  const lenOk = (x) => !lengthVal || norm(x.length_type) === norm(lengthVal);
  const match = variants.find(x =>
    norm(x.size) === norm(sizeVal) &&
    (norm(x.color) === norm(colorNameKo) || norm(x.color) === norm(colorNameEn) || norm(x.color) === norm(colorRawName)) &&
    lenOk(x)
  );
  if (match) return match;
  // If the store only offers one variant, it is safe to use it. Otherwise a
  // loose size-only/color-only fallback could add a different SKU than the
  // customer selected, so return null and let the caller ask again.
  const active = variants.filter(x => x.active !== false);
  return active.length === 1 ? active[0] : null;
}

/**
 * Build a single cart line for a product option. Shared by "장바구니 담기" and
 * "바로 구매하기" so both flows validate the variant, price and stock the same
 * way — the only difference is where the resulting line is stored.
 */
function buildLine(product, size, color, quantity = 1, length = null) {
  if (!product) return { ok: false, message: '상품 정보를 확인할 수 없습니다.' };

  const sizeVal = size || (product.sizes?.[0] || 'FREE');
  const colorObj = color || (product.colors?.[0] || { name_ko: '단일상품', name_en: 'Default' });
  const colorNameKo = typeof colorObj === 'object' ? (colorObj.name_ko || colorObj.name || colorObj.name_en) : colorObj;
  const colorNameEn = typeof colorObj === 'object' ? (colorObj.name_en || colorObj.name || colorObj.name_ko) : colorObj;
  const hex = typeof colorObj === 'object' ? colorObj.hex : undefined;

  const variant = resolveVariant(product, sizeVal, colorNameKo, colorNameEn, colorObj, length);
  const variant_id = variant?.id || variant?.variant_id || null;
  const variant_sku = variant?.sku || product.sku;

  // Products that have variants must resolve to a real SKU. Adding a line
  // without variant_id would only fail later at checkout, so block it here and
  // ask the customer to re-select.
  const hasVariants = (Array.isArray(product.variants) && product.variants.length > 0)
    || (Array.isArray(product.product_variants) && product.product_variants.length > 0);
  if (hasVariants && !variant_id) {
    return { ok: false, message: '선택하신 사이즈/색상 조합을 찾을 수 없습니다. 다시 선택해주세요.' };
  }

  const unitPrice = variant ? Math.max(1, (product.discount_price || product.price || 0) + (variant.price_delta || 0)) : (product.discount_price || product.price);
  const cartItemId = variant_id ? `${variant_id}` : `${product.id}-${sizeVal}-${colorNameKo}`;

  return {
    ok: true,
    line: {
      id: cartItemId,
      variant_id,
      product_id: product.id,
      category: product.categories?.slug || product.category || product.subcategory || '',
      sku: variant_sku,
      name_ko: product.name_ko,
      name_en: product.name_en,
      price: product.price,
      discount_price: product.discount_price,
      unit_price: unitPrice,
      image_url: Array.isArray(product.images) ? product.images[0] : (product.image_url || ''),
      size: sizeVal,
      length_type: variant?.length_type || length || null,
      color_ko: colorNameKo,
      color_en: colorNameEn,
      color_hex: hex,
      quantity: Math.max(1, Number(quantity) || 1),
      max_stock: variant?.stock ?? product.stock ?? 99,
    },
  };
}

// Buy-now is a one-off purchase intent: it must never touch the cart, and it
// must survive a checkout refresh (but not a browser restart).
function readBuyNow() {
  try {
    const raw = sessionStorage.getItem(BUYNOW_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.variant_id ? parsed : null;
  } catch { return null; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      // Migration: drop pre-variant_id entries (old schema v1 -> v2)
      if (Array.isArray(parsed) && parsed.some(i => !i.variant_id)) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [buyNowItem, setBuyNowItem] = useState(readBuyNow);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingPolicy, setShippingPolicy] = useState(DEFAULT_SHIPPING_POLICY);
  // Coupon applied on the cart page. Kept in context (and sessionStorage) so
  // checkout can send the same code; previously the discount preview was lost
  // as soon as the customer navigated to checkout.
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const raw = sessionStorage.getItem('noeul_coupon');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.code ? parsed : null;
    } catch { return null; }
  });
  const { showToast } = useToast();

  useEffect(() => {
    try {
      if (appliedCoupon?.code) sessionStorage.setItem('noeul_coupon', JSON.stringify(appliedCoupon));
      else sessionStorage.removeItem('noeul_coupon');
    } catch { /* storage unavailable */ }
  }, [appliedCoupon]);

  useEffect(() => {
    try {
      if (buyNowItem) sessionStorage.setItem(BUYNOW_KEY, JSON.stringify(buyNowItem));
      else sessionStorage.removeItem(BUYNOW_KEY);
    } catch { /* storage unavailable */ }
  }, [buyNowItem]);

  useEffect(() => {
    let active = true;
    api.get('/store/settings/public')
      .then((r) => {
        if (active && r?.success) {
          const sp = r.data?.shipping_policy || {};
          setShippingPolicy({
            threshold: Number(sp.threshold ?? 0),
            fee: Number(sp.fee ?? 0),
            socks_fee: Number(sp.socks_fee ?? 3000),
            socks_free_pairs: Number(sp.socks_free_pairs ?? 3),
          });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Add Item to Cart — now stores variant_id for backend checkout compatibility
  const addToCart = (product, size, color, quantity = 1, length = null) => {
    const { ok, line, message } = buildLine(product, size, color, quantity, length);
    if (!ok) {
      showToast(message, 'error');
      return false;
    }

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === line.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + line.quantity,
        };
        // Keep variant_id stable if already stored
        if (line.variant_id && !updated[existingIndex].variant_id) updated[existingIndex].variant_id = line.variant_id;
        if (!updated[existingIndex].category) updated[existingIndex].category = line.category;
        if (line.length_type && !updated[existingIndex].length_type) updated[existingIndex].length_type = line.length_type;
        return updated;
      }
      return [...prevItems, line];
    });

    const prodName = product.name_ko || product.name || product.name_en || '상품';
    showToast(`[${prodName}] 상품이 장바구니에 담겼습니다.`, 'success');
    return true;
  };

  // Buy Now: build a one-off line without mutating the cart.
  const startBuyNow = (product, size, color, quantity = 1, length = null) => {
    const { ok, line, message } = buildLine(product, size, color, quantity, length);
    if (!ok) {
      showToast(message, 'error');
      return false;
    }
    setBuyNowItem(line);
    return true;
  };

  const clearBuyNow = () => setBuyNowItem(null);

  // Remove Item
  const removeFromCart = (cartItemId) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  // Update Quantity
  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const clampedQty = Math.min(newQty, item.max_stock ?? 99);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  // Clear Cart
  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setBuyNowItem(null);
  };
  const clearAppliedCoupon = () => setAppliedCoupon(null);

  // Computations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [items]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const shippingFee = useMemo(() => {
    if (items.length === 0) return 0;
    const sockQty = items.reduce((sum, item) => (isSocksCartItem(item) ? sum + (item.quantity || 0) : sum), 0);
    const hasOther = items.some((item) => !isSocksCartItem(item));
    if (!hasOther) {
      const threshold = shippingPolicy.socks_free_pairs || 3;
      return (sockQty >= 1 && sockQty < threshold) ? (shippingPolicy.socks_fee || 0) : 0;
    }
    const net = subtotal;
    return net >= (shippingPolicy.threshold || 0) ? 0 : (shippingPolicy.fee || 0);
  }, [items, subtotal, shippingPolicy]);

  const totalAmount = useMemo(() => {
    return subtotal + shippingFee;
  }, [subtotal, shippingFee]);

  const hasOtherItems = useMemo(() => items.some((item) => !isSocksCartItem(item)), [items]);
  const freeShippingRemaining = useMemo(() => {
    if (!hasOtherItems || !shippingPolicy.threshold) return 0;
    return Math.max(0, shippingPolicy.threshold - subtotal);
  }, [hasOtherItems, shippingPolicy.threshold, subtotal]);

  const freeShippingProgress = useMemo(() => {
    if (!hasOtherItems || !shippingPolicy.threshold) return 100;
    return Math.min(100, Math.round((subtotal / shippingPolicy.threshold) * 100));
  }, [hasOtherItems, shippingPolicy.threshold, subtotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        shippingFee,
        totalAmount,
        freeShippingRemaining,
        freeShippingProgress,
        freeShippingThreshold: shippingPolicy.threshold,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        startBuyNow,
        buyNowItem,
        clearBuyNow,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        setAppliedCoupon,
        clearAppliedCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
