import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext.jsx';
import { useLanguage } from './LanguageContext.jsx';

const CartContext = createContext();

const FREE_SHIPPING_THRESHOLD = 70000;
const DEFAULT_SHIPPING_FEE = 3000;
const STORAGE_KEY = 'noeul_cart';
const STORAGE_VERSION = 2;

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
  const { showToast } = useToast();
  const { lang } = useLanguage();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Resolve variant_id from product.variants when available (authoritative stock SKU)
  const resolveVariant = (product, sizeVal, colorNameKo, colorNameEn) => {
    const variants = Array.isArray(product.variants) ? product.variants : Array.isArray(product.product_variants) ? product.product_variants : [];
    if (variants.length > 0) {
      // Prefer exact match on size+color
      let v = variants.find(x => x.size === sizeVal && (x.color === colorNameKo || x.color === colorNameEn));
      if (v) return v;
      v = variants.find(x => x.size === sizeVal);
      if (v) return v;
      v = variants.find(x => x.color === colorNameKo || x.color === colorNameEn);
      if (v) return v;
      return variants[0];
    }
    return null;
  };

  // Add Item to Cart — now stores variant_id for backend checkout compatibility
  const addToCart = (product, size, color, quantity = 1) => {
    if (!product) return;

    const sizeVal = size || (product.sizes?.[0] || 'FREE');
    const colorObj = color || (product.colors?.[0] || { name_ko: '단일상품', name_en: 'Default' });
    const colorNameKo = typeof colorObj === 'object' ? colorObj.name_ko : colorObj;
    const colorNameEn = typeof colorObj === 'object' ? colorObj.name_en : colorObj;
    const hex = typeof colorObj === 'object' ? colorObj.hex : undefined;

    const variant = resolveVariant(product, sizeVal, colorNameKo, colorNameEn);
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
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: cartItemId,
            variant_id,
            product_id: product.id,
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

    const msg = lang === 'ko'
      ? `[${product.name_ko}] 상품이 장바구니에 담겼습니다.`
      : `[${product.name_en}] has been added to your cart.`;
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
          const clampedQty = Math.min(newQty, item.max_stock || 99);
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
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  }, [subtotal, items.length]);

  const totalAmount = useMemo(() => {
    return subtotal + shippingFee;
  }, [subtotal, shippingFee]);

  const freeShippingRemaining = useMemo(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  }, [subtotal]);

  const freeShippingProgress = useMemo(() => {
    return Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotal]);

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
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
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
