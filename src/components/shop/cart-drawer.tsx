"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { formatUGX } from "@/lib/format";
import { CartLineItem } from "./cart-line-item";
import { useStore } from "./store-provider";
import { useDialog } from "./use-dialog";

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, subtotal, count } = useStore();
  const panelRef = useDialog(drawerOpen, closeDrawer);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close bag"
        onClick={closeDrawer}
        className="absolute inset-0 animate-fade-in bg-charcoal/25 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-[440px] animate-slide-in-right flex-col bg-ivory shadow-[var(--shadow-lift)] outline-none sm:inset-y-3 sm:right-3 sm:rounded-[var(--radius-panel)]"
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 id="bag-title" className="font-serif text-[28px]">
            Your bag {count > 0 && <span className="font-sans text-sm text-muted">({count})</span>}
          </h2>
          <button type="button" onClick={closeDrawer} aria-label="Close bag" className="-mr-2 grid size-10 place-items-center">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-serif text-2xl">Nothing here yet</p>
            <p className="mt-2 text-[14px] text-muted">Pieces you add will wait here while you browse.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/women" onClick={closeDrawer} className={buttonClass("secondary")}>
                Shop women
              </Link>
              <Link href="/baby" onClick={closeDrawer} className={buttonClass("secondary")}>
                Shop baby
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((line) => (
                <CartLineItem key={line.variantId} line={line} onNavigate={closeDrawer} />
              ))}
            </ul>
            <div className="border-t border-line px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] text-ink-soft">Subtotal</span>
                <span className="text-lg font-medium tabular-nums">{formatUGX(subtotal)}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-muted">Delivery is added at checkout, based on your area.</p>
              <div className="mt-4 grid gap-2">
                <Link href="/checkout" onClick={closeDrawer} className={buttonClass("primary", "lg", "w-full")}>
                  Checkout
                </Link>
                <Link href="/cart" onClick={closeDrawer} className={buttonClass("quiet", "md", "justify-center py-2 text-[13.5px]")}>
                  View full bag
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
