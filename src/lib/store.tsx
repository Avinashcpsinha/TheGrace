"use client";

/**
 * Cart + wishlist store — React context persisted to localStorage.
 * Wrap the app in <StoreProvider>; consume with useCart() / useWishlist().
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "./types";
import { cartTotals, type CartTotals } from "./pricing";
import { toast } from "./events";

const CART_KEY = "tg-cart-v1";
const WISH_KEY = "tg-wishlist-v1";

interface StoreShape {
  cart: CartItem[];
  totals: CartTotals;
  addToCart: (item: CartItem) => void;
  removeFromCart: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clearCart: () => void;
  wishlist: string[]; // product slugs
  toggleWishlist: (slug: string, name?: string) => void;
  hydrated: boolean;
}

const StoreCtx = createContext<StoreShape | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setCart(readJSON<CartItem[]>(CART_KEY, []));
    setWishlist(readJSON<string[]>(WISH_KEY, []));
    loaded.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (loaded.current) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.slug === item.slug && p.size === item.size);
      if (i >= 0) {
        const next = [...prev];
        next[i] = {
          ...next[i],
          qty: next[i].qty + item.qty,
          engraving: item.engraving || next[i].engraving,
        };
        return next;
      }
      return [...prev, item];
    });
    toast(`Added to cart — ${item.name}`);
  }, []);

  const removeFromCart = useCallback((slug: string, size: string) => {
    setCart((prev) => prev.filter((p) => !(p.slug === slug && p.size === size)));
  }, []);

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((p) => !(p.slug === slug && p.size === size))
        : prev.map((p) => (p.slug === slug && p.size === size ? { ...p, qty } : p))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((slug: string, name?: string) => {
    setWishlist((prev) => {
      const has = prev.includes(slug);
      if (!has && name) toast(`Saved to wishlist — ${name}`);
      return has ? prev.filter((s) => s !== slug) : [...prev, slug];
    });
  }, []);

  const totals = useMemo(() => cartTotals(cart), [cart]);

  const value = useMemo(
    () => ({ cart, totals, addToCart, removeFromCart, setQty, clearCart, wishlist, toggleWishlist, hydrated }),
    [cart, totals, addToCart, removeFromCart, setQty, clearCart, wishlist, toggleWishlist, hydrated]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export const useCart = () => {
  const { cart, totals, addToCart, removeFromCart, setQty, clearCart, hydrated } = useStore();
  return { cart, totals, addToCart, removeFromCart, setQty, clearCart, hydrated };
};

export const useWishlist = () => {
  const { wishlist, toggleWishlist, hydrated } = useStore();
  return { wishlist, toggleWishlist, hydrated };
};
