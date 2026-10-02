"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/types";

// Cart and wishlist live in this browser (guest shopping, no account needed).
// Prices here are for display only: checkout re-reads every price and stock level on the server.

const CART_KEY = "meludelu.cart.v1";
const WISHLIST_KEY = "meludelu.wishlist.v1";
const MAX_PER_LINE = 20;

interface StoreContextValue {
  ready: boolean;
  lines: CartLine[];
  count: number;
  subtotal: number;
  addLine: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  replaceLines: (lines: CartLine[]) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or full storage: the cart still works for this visit.
  }
}

function clampQuantity(quantity: number, max: number | null) {
  const ceiling = max === null ? MAX_PER_LINE : Math.min(max, MAX_PER_LINE);
  return Math.max(1, Math.min(quantity, ceiling));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISHLIST_KEY, []));
    setReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) setLines(read<CartLine[]>(CART_KEY, []));
      if (event.key === WISHLIST_KEY) setWishlist(read<string[]>(WISHLIST_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) write(CART_KEY, lines);
  }, [lines, ready]);

  useEffect(() => {
    if (ready) write(WISHLIST_KEY, wishlist);
  }, [wishlist, ready]);

  const addLine = useCallback((line: CartLine) => {
    setLines((current) => {
      const existing = current.find((l) => l.variantId === line.variantId);
      if (existing) {
        return current.map((l) =>
          l.variantId === line.variantId
            ? { ...line, quantity: clampQuantity(l.quantity + line.quantity, line.maxQuantity) }
            : l,
        );
      }
      return [...current, { ...line, quantity: clampQuantity(line.quantity, line.maxQuantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) =>
      current.map((l) => (l.variantId === variantId ? { ...l, quantity: clampQuantity(quantity, l.maxQuantity) } : l)),
    );
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((current) => current.filter((l) => l.variantId !== variantId));
  }, []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current]));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      addLine,
      setQuantity,
      removeLine,
      replaceLines: setLines,
      clearCart: () => setLines([]),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      wishlist,
      toggleWishlist,
      isWishlisted: (slug: string) => wishlist.includes(slug),
    }),
    [ready, lines, addLine, setQuantity, removeLine, drawerOpen, wishlist, toggleWishlist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
