"use client";

import { useEffect, useRef, useState } from "react";
import { refreshCart } from "@/app/actions/checkout";
import { useStore } from "./store-provider";

/** Re-checks prices and stock for the bag against the server. Returns a note if anything changed. */
export function useCartSync() {
  const { lines, replaceLines, ready } = useStore();
  const [note, setNote] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    Promise.resolve(lines.length ? refreshCart(lines.map((l) => l.variantId)) : [])
      .then((fresh) => {
        const changes: string[] = [];
        const next = lines.map((line) => {
          const f = fresh.find((x) => x.variantId === line.variantId);
          if (!f) return line;
          if (!f.available) changes.push(`${line.name} has sold out`);
          else if (f.price !== line.price) changes.push(`the price of ${line.name} has changed`);
          const quantity = f.maxQuantity !== null && f.maxQuantity > 0 ? Math.min(line.quantity, f.maxQuantity) : line.quantity;
          if (f.available && quantity < line.quantity) changes.push(`we only have ${quantity} of ${line.name} left`);
          return { ...line, price: f.price || line.price, stockStatus: f.stockStatus, maxQuantity: f.maxQuantity, quantity };
        });
        replaceLines(next);
        if (changes.length) setNote(`Since you added them, ${changes.join(", ")}. Your bag has been updated.`);
      })
      .catch(() => {
        // Checkout re-checks on the server anyway; nothing else to do here.
      })
      .finally(() => setChecking(false));
  }, [ready, lines, replaceLines]);

  return { note, checking };
}
