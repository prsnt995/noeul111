import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext.jsx';
import { api } from '../utils/api.js';

const CartContext = createContext();

const STORAGE_KEY = 'noeul_cart';
const STORAGE_VERSION = 2;

const DEFAULT_SHIPPING_POLICY = { threshold: 0, fee: 0, socks_fee: 3000, socks_free_pairs: 3 };

function isSocksCartItem(item) {
  const category = String(item?.category || item?.product_category || '').toLowerCase();
  if (category === 'socks' || category === 'sock') return true;
  const name = `${item?.name_ko || ''} ${item?.name_en || ''}`.toLowerCase();
  return name.includes('sock') || name.includes('양말') || name.includes('삭스');
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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingPolicy, setShippingPolicy] = useState(DEFAULT_SHIPPING_POLICY);
  const { showToast } = useToast();

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

  // Resolve variant_id from product.variants when available (authoritative stock SKU)
  const resolveVariant = (product, sizeVal, colorNameKo, colorNameEn, colorRaw) => {
    const variants = Array.isArray(product.variants) ? product.variants : Array.isArray(product.product_variants) ? product.product_variants : [];
    if (variants.length === 0) return null;
    const norm = (s) => String(s || '').trim().toUpperCase();
    const colorRawName = typeof colorRaw === 'object' ? (colorRaw.name || colorRaw.name_en || colorRaw.name_ko) : colorRaw;
    // 1. Exact match by size and any color representation
    const match = variants.find(x =>
      norm(x.size) === norm(sizeVal) &&
      (norm(x.color) === norm(colorNameKo) || norm(x.color) === norm(colorNameEn) || norm(x.color) === norm(colorRawName))
    );
    if (match) return match;
    // 2. Match by size
    const sizeMatch = variants.find(x => norm(x.size) === norm(sizeVal));
    if (sizeMatch) return sizeMatch;
    // 3. Match by color
    const colorMatch = variants.find(x =>
      norm(x.color) === norm(colorNameKo) || norm(x.color) === norm(colorNameEn) || norm(x.color) === norm(colorRawName)
    );
    if (colorMatch) return colorMatch;
    // 4. Fallback to active variant or first variant
    return variants.find(x => x.active !== false) || variants[0];
  };

  // Add Item to Cart — now stores variant_id for backend checkout compatibility
  const addToCart = (product, size, color, quantity = 1) => {
    if (!product) return;

    const sizeVal = size || (product.sizes?.[0] || 'FREE');
    const colorObj = color || (product.colors?.[0] || { name_ko: '단일상품', name_en: 'Default' });
    const colorNameKo = typeof colorObj === 'object' ? (colorObj.name_ko || colorObj.name || colorObj.name_en) : colorObj;
    const colorNameEn = typeof colorObj === 'object' ? (colorObj.name_en || colorObj.name || colorObj.name_ko) : colorObj;
    const hex = typeof colorObj === 'object' ? colorObj.hex : undefined;

    const variant = resolveVariant(product, sizeVal, colorNameKo, colorNameEn, colorObj);
    const variant_id = variant?.id || variant?.variant_id || null;
    const variant_sku = variant?.sku || product.sku;

    // If backend has variants but none matched, still allow but warn — checkout will validate stock via quote
    const unitPrice = variant ? Math.max(1, (product.discount_price || product.price || 0) + (variant.price_delta || 0)) : (product.discount_price || product.price);

    const cartItemId = variant_id ? `${variant_id}` : `${product.id}-${sizeVal}-${colorNameKo}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        // Keep variant_id stable if already stored
        if (variant_id && !updated[existingIndex].variant_id) updated[existingIndex].variant_id = variant_id;
        if (!updated[existingIndex].category) updated[existingIndex].category = product.categories?.slug || product.category || product.subcategory || '';
        return updated;
      } else {
        return [
          ...prevItems,
          {
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
            color_ko: colorNameKo,
            color_en: colorNameEn,
            color_hex: hex,
            quantity: quantity,
            max_stock: variant?.stock ?? product.stock ?? 99,
          },
        ];
      }
    });

    const prodName = product.name_ko || product.name || product.name_en || '상품';
    const msg = `[${prodName}] 상품이 장바구니에 담겼습니다.`;
    showToast(msg, 'success');
  };

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
  };

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
        removeFromCart,
        updateQuantity,
        clearCart,
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
