import { stockLabels } from "@/lib/format";
import type { StockStatus } from "@/lib/types";

const tone: Record<StockStatus, string> = {
  in_stock: "bg-success-soft text-success",
  low_stock: "bg-warning-soft text-warning",
  out_of_stock: "bg-cream text-muted",
  available_to_order: "bg-cream text-ink-soft",
  ships_from_china: "bg-blush-soft text-ink-soft",
};

export function StockBadge({ status, className = "" }: { status: StockStatus; className?: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium tracking-wide ${tone[status]} ${className}`}
    >
      {stockLabels[status]}
    </span>
  );
}
