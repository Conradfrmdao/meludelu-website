"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { formatUGX } from "@/lib/format";
import type { Product, Variant } from "@/lib/types";
import { QuantityStepper } from "./cart-line-item";
import { useStore } from "./store-provider";
import { WishlistButton } from "./wishlist-button";

function unique<T>(values: (T | null)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== null))];
}

export function ProductPurchase({ product, leadTime }: { product: Product; leadTime: string }) {
  const router = useRouter();
  const { addLine, openDrawer } = useStore();
  const colors = unique(product.variants.map((v) => v.colorName));
  const sizes = unique(product.variants.map((v) => v.size));
  const firstAvailable = product.variants.find((v) => v.stockStatus !== "out_of_stock") ?? product.variants[0];

  const [color, setColor] = useState<string | null>(firstAvailable?.colorName ?? null);
  // With several sizes, ask the shopper to choose rather than guessing for them.
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const variantFor = (c: string | null, s: string | null): Variant | undefined =>
    product.variants.find((v) => (colors.length === 0 || v.colorName === c) && (sizes.length === 0 || v.size === s));

  const selected = useMemo(() => variantFor(color, size), [color, size]); // eslint-disable-line react-hooks/exhaustive-deps
  const display = selected ?? product.variants.find((v) => v.colorName === color) ?? firstAvailable;
  const soldOut = selected?.stockStatus === "out_of_stock";
  const max = selected?.maxQuantity ?? null;

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function add(goToCheckout: boolean) {
    if (sizes.length > 1 && !size) {
      setMessage("Please choose a size.");
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!selected || soldOut) return;
    addLine({
      variantId: selected.id,
      productSlug: product.slug,
      name: product.name,
      image: product.images[0] ?? null,
      size: selected.size,
      colorName: selected.colorName,
      price: selected.price,
      quantity,
      maxQuantity: selected.maxQuantity,
      stockStatus: selected.stockStatus,
    });
    setMessage(null);
    if (goToCheckout) router.push("/checkout");
    else openDrawer();
  }

  const external = product.supplierType === "EXTERNAL_SUPPLIER";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-[38px] leading-[1.02] lg:text-[48px]">{product.name}</h1>
        <WishlistButton slug={product.slug} name={product.name} className="mt-1 shrink-0 border border-line" />
      </div>
      <div className="mt-3">
        {display && <Price price={display.price} compareAtPrice={display.compareAtPrice} size="lg" />}
      </div>

      {colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="text-[13px] text-ink-soft">
            Colour: <span className="font-medium text-charcoal">{color}</span>
          </legend>
          {colors.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {colors.map((c) => {
                const hex = product.variants.find((v) => v.colorName === c)?.colorHex ?? "#ddd";
                const anyLeft = product.variants.some((v) => v.colorName === c && v.stockStatus !== "out_of_stock");
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-pressed={color === c}
                    aria-label={`${c}${anyLeft ? "" : ", sold out"}`}
                    className={`relative grid size-10 place-items-center rounded-full ring-1 transition ${
                      color === c ? "ring-charcoal ring-offset-2 ring-offset-ivory" : "ring-line hover:ring-line-strong"
                    }`}
                  >
                    <span className="size-8 rounded-full ring-1 ring-black/10 ring-inset" style={{ backgroundColor: hex }} />
                    {!anyLeft && <span className="absolute h-px w-9 rotate-45 bg-charcoal/50" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      {sizes.length > 0 && !(sizes.length === 1 && sizes[0] === "One size") && (
        <fieldset className="mt-7">
          <div className="flex items-center justify-between">
            <legend className="text-[13px] text-ink-soft">
              Size{size && <>: <span className="font-medium text-charcoal">{size}</span></>}
            </legend>
            <Link href="/help/size-guide" className="text-[13px] text-muted underline underline-offset-4 hover:text-charcoal">
              Size guide
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {sizes.map((s) => {
              const v = variantFor(color, s);
              const unavailable = !v || v.stockStatus === "out_of_stock";
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setQuantity(1);
                    setMessage(null);
                  }}
                  aria-pressed={size === s}
                  aria-describedby={unavailable ? "size-soldout-note" : undefined}
                  className={`relative h-12 rounded-xl border text-[13.5px] transition-colors ${
                    size === s
                      ? "border-charcoal bg-charcoal text-ivory"
                      : unavailable
                        ? "border-line bg-transparent text-muted line-through decoration-muted/60"
                        : "border-line bg-white hover:border-line-strong"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {product.variants.some((v) => v.stockStatus === "out_of_stock") && (
            <p id="size-soldout-note" className="mt-2 text-[12.5px] text-muted">
              Crossed-out sizes have sold out. They may come back; we don&apos;t take orders for them in the meantime.
            </p>
          )}
        </fieldset>
      )}

      <div className="mt-6 min-h-6" aria-live="polite">
        {selected && (
          <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-soft">
            <StockBadge status={selected.stockStatus} />
            {selected.stockStatus === "low_stock" && max !== null && <span>{max} left in this size</span>}
            {external && selected.stockStatus !== "out_of_stock" && <span>Arrives in about {leadTime}</span>}
          </div>
        )}
        {message && <p className="mt-2 text-[13.5px] text-danger">{message}</p>}
      </div>

      <div ref={actionsRef} className="mt-5 flex items-stretch gap-3">
        <QuantityStepper value={quantity} max={max} onChange={(q) => setQuantity(Math.max(1, q))} label="Quantity" size="lg" />
        <Button size="lg" className="h-14 min-w-0 flex-1 text-[15.5px]" onClick={() => add(false)} disabled={soldOut}>
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
      </div>
      <Button variant="secondary" size="lg" className="mt-3 h-14 w-full text-[15.5px]" onClick={() => add(true)} disabled={soldOut}>
        Buy now
      </Button>

      {/* Sticky bar on phones once the main buttons scroll out of view */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px]">{product.name}</p>
            <p className="text-[13px] tabular-nums text-muted">
              {display ? formatUGX(display.price) : ""}
              {size ? ` · ${size}` : ""}
            </p>
          </div>
          <Button size="lg" className="h-12 shrink-0" onClick={() => add(false)} disabled={soldOut} tabIndex={showSticky ? 0 : -1}>
            {soldOut ? "Sold out" : sizes.length > 1 && !size ? "Choose size" : "Add to bag"}
          </Button>
        </div>
      </div>
    </div>
  );
}
