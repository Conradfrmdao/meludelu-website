"use client";

import { useEffect } from "react";
import { useStore } from "./store-provider";

/** Empties the bag once, after an order has been placed. */
export function ClearCart() {
  const { clearCart, ready } = useStore();
  useEffect(() => {
    if (ready) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return null;
}
