import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await Api.getCart());
    } catch {
      /* header badge just stays stale; pages surface their own errors */
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId, qty = 1) => {
    await Api.addToCart(productId, qty);
    await refresh();
  };
  const setQuantity = async (item, qty) => {
    if (qty <= 0) await Api.removeCartItem(item.id);
    else await Api.updateCartItem(item.id, qty);
    await refresh();
  };
  const removeItem = async (itemId) => {
    await Api.removeCartItem(itemId);
    await refresh();
  };

  const value = useMemo(
    () => ({
      items,
      loading,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + Number(i.subtotal), 0),
      refresh,
      addItem,
      setQuantity,
      removeItem,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, loading, refresh]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
