import Link from "next/link";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { discountPercent } from "@/lib/format";
import type { Product, StockStatus } from "@/lib/types";
import { ProductImage } from "./product-image";
import { WishlistButton } from "./wishlist-button";

function cardStatus(product: Product): StockStatus | null {
  // Only show stock when it matters to the decision.
  if (!product.isAvailable) return "out_of_stock";
  const statuses = product.variants.map((v) => v.stockStatus);
  if (statuses.every((s) => s === "ships_from_china")) return "ships_from_china";
  if (statuses.every((s) => s === "available_to_order")) return "available_to_order";
  if (statuses.some((s) => s === "low_stock") && !statuses.some((s) => s === "in_stock")) return "low_stock";
  return null;
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cheapest = product.variants.reduce<Product["variants"][number] | null>(
    (best, v) => (!best || v.price < best.price ? v : best),
    null,
  );
  const prices = new Set(product.variants.map((v) => v.price));
  const off = cheapest ? discountPercent(cheapest.price, cheapest.compareAtPrice) : null;
  const status = cardStatus(product);
  const soldOut = status === "out_of_stock";

  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];
  const colors = [
    ...new Map(product.variants.filter((v) => v.colorHex).map((v) => [v.colorName, v.colorHex as string])),
  ];

  return (
    <article className="group relative">
      <Link
        href={`/product/${product.slug}`}
        className="block rounded-[var(--radius-card)] focus-visible:outline-offset-4"
      >
        <div className="relative overflow-hidden rounded-[var(--radius-card)]">
          <ProductImage
            image={product.images[0]}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className={`transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-[1.025] ${soldOut ? "opacity-70" : ""}`}
          />
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut ? (
              <span className="rounded-full bg-ivory/90 px-2.5 py-1 text-[11.5px] font-medium tracking-wide text-charcoal">
                Sold out
              </span>
            ) : off ? (
              <span className="rounded-full bg-ivory/90 px-2.5 py-1 text-[11.5px] font-medium tracking-wide text-danger">
                −{off}%
              </span>
            ) : product.isNew ? (
              <span className="rounded-full bg-ivory/90 px-2.5 py-1 text-[11.5px] font-medium tracking-wide text-charcoal">
                New
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 space-y-1 px-0.5">
          <h3 className="text-[14.5px] leading-snug text-charcoal">{product.name}</h3>
          {cheapest && (
            <Price price={cheapest.price} compareAtPrice={cheapest.compareAtPrice} from={prices.size > 1} />
          )}
          <div className="flex min-h-5 items-center gap-2 pt-0.5">
            {colors.length > 0 && (
              <span className="flex items-center gap-1" aria-label={`Colours: ${colors.map(([n]) => n).join(", ")}`}>
                {colors.slice(0, 4).map(([name, hex]) => (
                  <span
                    key={name}
                    className="size-3 rounded-full ring-1 ring-black/10 ring-inset"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
            )}
            {sizes.length > 0 && sizes[0] !== "One size" && (
              <span className="truncate text-[12px] text-muted">{sizes.join(" · ")}</span>
            )}
          </div>
          {status && status !== "out_of_stock" && <StockBadge status={status} className="mt-1" />}
        </div>
      </Link>
      <WishlistButton slug={product.slug} name={product.name} className="absolute right-3 top-3" />
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[4/5] rounded-[var(--radius-card)]" />
      <div className="skeleton mt-3 h-4 w-3/4 rounded-full" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded-full" />
    </div>
  );
}
