import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext.jsx';
import { useLanguage } from './LanguageContext.jsx';

const CartContext = createContext();

const FREE_SHIPPING_THRESHOLD = 70000; // ₩70,000 KRW
const DEFAULT_SHIPPING_FEE = 3000;     // ₩3,000 KRW

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('noeul_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();
  const { lang } = useLanguage();

  useEffect(() => {
    localStorage.setItem('noeul_cart', JSON.stringify(items));
  }, [items]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Add Item to Cart
  const addToCart = (product, size, color, quantity = 1) => {
    if (!product) return;

    const unitPrice = product.discount_price || product.price;
    const sizeVal = size || (product.sizes?.[0] || 'FREE');
    const colorObj = color || (product.colors?.[0] || { name_ko: '단일상품', name_en: 'Default' });
    const colorNameKo = typeof colorObj === 'object' ? colorObj.name_ko : colorObj;
    const colorNameEn = typeof colorObj === 'object' ? colorObj.name_en : colorObj;

    const cartItemId = `${product.id}-${sizeVal}-${colorNameKo}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: cartItemId,
            product_id: product.id,
            sku: product.sku,
            name_ko: product.name_ko,
            name_en: product.name_en,
            price: product.price,
            discount_price: product.discount_price,
            unit_price: unitPrice,
            image_url: Array.isArray(product.images) ? product.images[0] : '',
            size: sizeVal,
            color_ko: colorNameKo,
            color_en: colorNameEn,
            quantity: quantity,
            max_stock: product.stock || 99,
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
