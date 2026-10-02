import { discountPercent, formatUGX } from "@/lib/format";

interface PriceProps {
  price: number;
  compareAtPrice?: number | null;
  from?: boolean;
  size?: "sm" | "lg";
}

export function Price({ price, compareAtPrice = null, from = false, size = "sm" }: PriceProps) {
  const off = discountPercent(price, compareAtPrice);
  const main = size === "lg" ? "text-xl" : "text-[15px]";
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`${main} font-medium tabular-nums text-charcoal`}>
        {from && <span className="mr-1 text-[13px] font-normal text-muted">From</span>}
        {formatUGX(price)}
      </span>
      {off !== null && compareAtPrice && (
        <>
          <span className="sr-only">, was </span>
          <s className="text-[13px] tabular-nums text-muted">{formatUGX(compareAtPrice)}</s>
          <span className="text-[12px] font-medium text-danger">−{off}%</span>
        </>
      )}
    </p>
  );
}
