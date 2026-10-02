"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { formatUGX } from "@/lib/format";
import { CartLineItem } from "./cart-line-item";
import { useStore } from "./store-provider";
import { useCartSync } from "./use-cart-sync";

export function CartPageView() {
  const { lines, subtotal, ready } = useStore();
  const { note } = useCartSync();
  const blocked = lines.some((l) => l.stockStatus === "out_of_stock");

  if (!ready) {
    return <div className="skeleton mt-10 h-40 rounded-[var(--radius-card)]" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-[30px]">Your bag is empty</p>
        <p className="mt-2 text-[15px] text-muted">Have a look around. Anything you add will wait here.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/women" className={buttonClass("primary")}>
            Shop women
          </Link>
          <Link href="/baby" className={buttonClass("secondary")}>
            Shop baby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
      <div>
        {note && (
          <p role="status" className="mb-4 rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning">
            {note}
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((line) => (
            <CartLineItem key={line.variantId} line={line} />
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-[var(--radius-panel)] bg-cream/70 p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-[26px]">Summary</h2>
        <dl className="mt-5 space-y-2 text-[14.5px]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums">{formatUGX(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery</dt>
            <dd className="text-muted">Chosen at checkout</dd>
          </div>
        </dl>
        <Link
          href="/checkout"
          aria-disabled={blocked}
          className={buttonClass("primary", "lg", `mt-6 w-full ${blocked ? "pointer-events-none opacity-45" : ""}`)}
        >
          Checkout
        </Link>
        {blocked && <p className="mt-3 text-[13px] text-danger">Remove sold-out pieces to continue.</p>}
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
          You&apos;ll pay with MTN or Airtel Mobile Money after placing your order. No account needed.
        </p>
      </aside>
    </div>
  );
}
