"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { useStore } from "./store-provider";

export function WishlistView() {
  const { wishlist, ready } = useStore();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const key = wishlist.join(",");

  useEffect(() => {
    if (!ready || !key) return;
    let cancelled = false;
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { products: Product[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, key]);

  if (ready && wishlist.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-[30px]">Nothing saved yet</p>
        <p className="mt-2 text-[15px] text-muted">Tap the heart on a piece you like and it will appear here.</p>
        <Link href="/new-arrivals" className={buttonClass("secondary", "md", "mt-6")}>
          See new arrivals
        </Link>
      </div>
    );
  }

  if (failed) {
    return <p className="mt-10 text-[15px] text-danger">We couldn&apos;t load your wishlist. Please refresh the page.</p>;
  }

  // Keep only pieces that are still saved (the heart can be toggled on this page).
  const visible = products?.filter((p) => wishlist.includes(p.slug));

  return (
    <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {visible
        ? visible.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))
        : Array.from({ length: Math.max(wishlist.length, 2) }).map((_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
    </ul>
  );
}
