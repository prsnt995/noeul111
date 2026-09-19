import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { useLanguage } from './LanguageContext.jsx';
import { api } from '../utils/api.js';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem('noeul_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const { lang } = useLanguage();

  // Sync with backend if logged in
  useEffect(() => {
    async function syncWishlist() {
      if (isLoggedIn) {
        try {
          const res = await api.get('/wishlist');
          if (res.success && Array.isArray(res.data)) {
            setWishlist(res.data);
          }
        } catch (err) {
          console.error('Wishlist sync failed:', err);
        }
      }
    }
    syncWishlist();
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('noeul_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const isWishlisted = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product) => {
    if (!product) return;

    const exists = isWishlisted(product.id);

    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      const msg = lang === 'ko' ? '위시리스트에서 삭제되었습니다.' : 'Removed from your wishlist.';
      showToast(msg, 'info');
    } else {
      setWishlist((prev) => [...prev, product]);
      const msg = lang === 'ko' ? '위시리스트에 담았습니다.' : 'Added to your wishlist.';
      showToast(msg, 'success');
    }

    if (isLoggedIn) {
      try {
        await api.post('/wishlist/toggle', { product_id: product.id });
      } catch (err) {
        console.error('Toggle backend wishlist failed:', err);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isWishlisted,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
