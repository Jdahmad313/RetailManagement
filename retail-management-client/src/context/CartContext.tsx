import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mbk_cart') || localStorage.getItem('apex_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mbk_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.variant?.id === variant?.id
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }

      return [...prev, { product, variant, quantity }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.variant?.id === variantId))
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId && i.variant?.id === variantId) {
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subTotal = items.reduce((acc, i) => {
    const price = i.variant?.priceOverride ?? i.product.effectivePrice;
    return acc + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
