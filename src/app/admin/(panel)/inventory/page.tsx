import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, Panel } from "@/components/admin/layout-bits";
import { StockAdjust } from "@/components/admin/stock-adjust";
import { listInventory } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Stock" };
export const dynamic = "force-dynamic";

const reasonLabels: Record<string, string> = {
  sale: "Sold",
  restock: "Restocked",
  adjustment: "Adjusted",
  return: "Returned",
  cancellation: "Order cancelled",
};

export default async function InventoryPage() {
  await requireAdmin();
  const { variants, movements } = await listInventory();

  return (
    <>
      <AdminHeader
        title="Stock"
        intro="Pieces held in the studio. Ordered-in items aren't counted here; set their availability on the product."
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          {variants.length === 0 ? (
            <p className="py-6 text-[14px] text-muted">No stocked products yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {variants.map((v) => {
                const label = `${v.name} ${[v.color_name, v.size].filter(Boolean).join(" ")}`;
                const tone = v.quantity_on_hand === 0 ? "text-danger" : v.quantity_on_hand <= v.low_stock_threshold ? "text-warning" : "";
                return (
                  <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${v.product_id}`} className="text-[14px] hover:underline">
                        {v.name}
                      </Link>
                      <p className="text-[12.5px] text-muted">
                        {[v.color_name, v.size].filter(Boolean).join(" · ")} · {v.sku}
                      </p>
                    </div>
                    <p className={`w-20 text-right text-[15px] font-medium tabular-nums ${tone}`}>{v.quantity_on_hand}</p>
                    <div className="w-full sm:w-auto sm:min-w-24">
                      <StockAdjust variantId={v.id} label={label} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Recent movements">
          {movements.length === 0 ? (
            <p className="text-[14px] text-muted">Nothing yet.</p>
          ) : (
            <ul className="space-y-3">
              {movements.map((m, i) => (
                <li key={i} className="text-[13.5px]">
                  <div className="flex justify-between gap-3">
                    <span className="truncate">
                      {m.name} <span className="text-muted">{[m.color_name, m.size].filter(Boolean).join(" ")}</span>
                    </span>
                    <span className={`shrink-0 tabular-nums ${m.change < 0 ? "text-danger" : "text-success"}`}>
                      {m.change > 0 ? `+${m.change}` : m.change}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted">
                    {reasonLabels[m.reason] ?? m.reason}
                    {m.order_number && ` · ${m.order_number}`} · {m.actor} · {formatDate(m.created_at, true)}
                    {m.note && ` · ${m.note}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
