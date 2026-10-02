import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/layout-bits";
import { OrderStatusPill, PaymentPill } from "@/components/admin/pills";
import { ORDER_FILTERS, type OrderFilter, listOrders } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { displayPhone, formatDate, formatUGX } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = (typeof sp.filter === "string" && sp.filter in ORDER_FILTERS ? sp.filter : "attention") as OrderFilter;
  const q = typeof sp.q === "string" ? sp.q : "";
  const orders = await listOrders(filter, q);

  return (
    <>
      <AdminHeader title="Orders" intro="Confirm payments, then move each order along until it's delivered." />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Order filters" className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          <ul className="flex gap-1.5">
            {(Object.keys(ORDER_FILTERS) as OrderFilter[]).map((key) => (
              <li key={key} className="shrink-0">
                <Link
                  href={`/admin/orders?filter=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  aria-current={filter === key ? "page" : undefined}
                  className={`inline-flex h-9 items-center rounded-full px-3.5 text-[13px] ${
                    filter === key ? "bg-charcoal text-ivory" : "bg-ivory text-ink-soft ring-1 ring-line hover:ring-line-strong"
                  }`}
                >
                  {ORDER_FILTERS[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="flex gap-2" role="search">
          <input type="hidden" name="filter" value={filter} />
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <input
            id="order-q"
            name="q"
            defaultValue={q}
            placeholder="Order number, name or phone"
            className="h-10 w-full rounded-full border border-line bg-white px-4 text-[14px] focus:border-charcoal focus:outline-none lg:w-72"
          />
        </form>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-ivory px-6 py-16 text-center ring-1 ring-line">
          <p className="font-serif text-[26px]">Nothing here</p>
          <p className="mt-1 text-[14px] text-muted">
            {filter === "attention" ? "No orders are waiting on you right now." : "No orders match this view."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-ivory ring-1 ring-line">
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o.order_number}>
                <Link
                  href={`/admin/orders/${o.order_number}`}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 px-5 py-4 hover:bg-cream/50 lg:grid-cols-[90px_1.4fr_1fr_auto_auto_120px_110px] lg:items-center"
                >
                  <span className="text-[14px] font-medium tabular-nums">{o.order_number}</span>
                  <span className="text-right text-[14px] tabular-nums lg:order-6">{formatUGX(o.total)}</span>
                  <span className="min-w-0 lg:order-2">
                    <span className="block truncate text-[14px]">{o.customer_name}</span>
                    <span className="block text-[12.5px] tabular-nums text-muted">{o.customer_phone && displayPhone(o.customer_phone)}</span>
                  </span>
                  <span className="hidden text-[13px] text-muted lg:order-3 lg:block">
                    {o.delivery_zone}
                    {o.has_external_items && " · ordered-in items"}
                  </span>
                  <span className="flex flex-wrap gap-1.5 lg:order-4">
                    <PaymentPill status={o.payment_status} />
                    <span className="text-[12px] uppercase text-muted">{o.payment_method}</span>
                  </span>
                  <span className="lg:order-5">
                    <OrderStatusPill status={o.status} />
                  </span>
                  <span className="text-right text-[12.5px] text-muted lg:order-7">{formatDate(o.created_at, true)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
