"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { StockBadge } from "@/components/ui/stock-badge";
import { formatUGX } from "@/lib/format";
import type { CartLine } from "@/lib/types";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = "sm",
}: {
  value: number;
  max: number | null;
  onChange: (next: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const ceiling = max === null ? 20 : Math.min(max, 20);
  const h = size === "md" ? "h-12" : "h-9";
  const w = size === "md" ? "w-11" : "w-9";
  return (
    <div className={`inline-flex ${h} items-center rounded-full border border-line bg-white`} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className={`grid ${h} ${w} place-items-center rounded-full disabled:opacity-35`}
      >
        <MinusIcon size={16} />
      </button>
      <span className="min-w-6 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= ceiling}
        aria-label="Increase quantity"
        className={`grid ${h} ${w} place-items-center rounded-full disabled:opacity-35`}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { setQuantity, removeLine } = useStore();
  const variantText = [line.colorName, line.size].filter(Boolean).join(" · ");
  const external = line.stockStatus === "ships_from_china" || line.stockStatus === "available_to_order";

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.productSlug}`} onClick={onNavigate} className="w-[84px] shrink-0 sm:w-24">
        <ProductImage image={line.image} sizes="96px" className="rounded-xl" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.productSlug}`} onClick={onNavigate} className="text-[14.5px] leading-snug hover:underline">
              {line.name}
            </Link>
            {variantText && <p className="mt-0.5 text-[13px] text-muted">{variantText}</p>}
            <p className="mt-0.5 text-[13px] tabular-nums text-muted">{formatUGX(line.price)} each</p>
          </div>
          <p className="shrink-0 text-[14.5px] font-medium tabular-nums">{formatUGX(line.price * line.quantity)}</p>
        </div>
        {external && <StockBadge status={line.stockStatus} className="mt-2 self-start" />}
        {line.stockStatus === "out_of_stock" && (
          <p className="mt-2 text-[13px] text-danger">This piece has sold out. Please remove it to check out.</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            value={line.quantity}
            max={line.maxQuantity}
            onChange={(q) => setQuantity(line.variantId, q)}
            label={`Quantity for ${line.name}`}
          />
          <button
            type="button"
            onClick={() => removeLine(line.variantId)}
            className="text-[13px] text-muted underline-offset-4 hover:text-charcoal hover:underline"
          >
            Remove
          </button>
        </div>
        {line.maxQuantity !== null && line.quantity >= line.maxQuantity && line.maxQuantity > 0 && (
          <p className="mt-2 text-[12.5px] text-muted">That&apos;s all we have of this size.</p>
        )}
      </div>
    </li>
  );
}
