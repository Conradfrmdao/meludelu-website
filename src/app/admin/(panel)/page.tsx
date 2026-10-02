import Link from "next/link";
import { AdminHeader, Panel } from "@/components/admin/layout-bits";
import { OrderStatusPill, PaymentPill } from "@/components/admin/pills";
import { getDashboard } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatUGX } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 font-serif text-[34px] leading-none tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[12.5px] text-muted">{note}</p>}
    </>
  );
  const cls = "block rounded-[var(--radius-card)] bg-ivory p-5 ring-1 ring-line";
  return href ? (
    <Link href={href} className={`${cls} transition-shadow hover:shadow-[var(--shadow-soft)]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const d = await getDashboard(admin);
  const attentionCount = d.attention.awaiting + d.attention.reported;

  return (
    <>
      <AdminHeader title={`Hello, ${admin.name.split(" ")[0]}`} intro="Here's how the shop is doing." />
      {sp.denied && (
        <p className="mb-6 rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">Only the owner can open that page.</p>
      )}

      {d.attention.reported > 0 && (
        <Link
          href="/admin/orders?filter=pending_payment"
          className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-charcoal px-5 py-4 text-ivory"
        >
          <span className="text-[14.5px]">
            {d.attention.reported} {d.attention.reported === 1 ? "customer says they've" : "customers say they've"} paid.
            Check your merchant account and confirm.
          </span>
          <span className="shrink-0 text-[13.5px] underline underline-offset-4">Review</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Paid sales, last 30 days" value={formatUGX(d.revenue30)} note={`${formatUGX(d.revenueAll)} all time`} />
        {d.margin30 !== null ? (
          <Stat label="Gross margin, last 30 days" value={formatUGX(d.margin30)} note="Paid sales minus supplier cost" />
        ) : (
          <Stat label="Orders, all time" value={String(d.ordersAll)} />
        )}
        <Stat label="Orders, last 30 days" value={String(d.orders30)} note={`${d.ordersAll} all time`} href="/admin/orders?filter=all" />
        <Stat
          label="Need attention"
          value={String(attentionCount + d.attention.to_fulfil)}
          note={`${attentionCount} awaiting payment · ${d.attention.to_fulfil} to fulfil`}
          href="/admin/orders"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Recent orders"
          action={
            <Link href="/admin/orders?filter=all" className="text-[13px] text-muted hover:text-charcoal">
              All orders
            </Link>
          }
        >
          {d.recent.length === 0 ? (
            <p className="py-6 text-[14px] text-muted">No orders yet. They&apos;ll appear here as soon as someone checks out.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.recent.map((o) => (
                <li key={o.order_number}>
                  <Link href={`/admin/orders/${o.order_number}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-cream/50">
                    <span className="w-20 text-[13.5px] font-medium tabular-nums">{o.order_number}</span>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{o.customer_name}</span>
                    <PaymentPill status={o.payment_status} />
                    <OrderStatusPill status={o.status} />
                    <span className="w-28 text-right text-[14px] tabular-nums">{formatUGX(o.total)}</span>
                    <span className="hidden w-24 text-right text-[12.5px] text-muted sm:block">{formatDate(o.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Low stock"
            action={
              <Link href="/admin/inventory" className="text-[13px] text-muted hover:text-charcoal">
                Manage stock
              </Link>
            }
          >
            {d.lowStock.length === 0 ? (
              <p className="text-[14px] text-muted">Everything in the studio is well stocked.</p>
            ) : (
              <ul className="space-y-2.5">
                {d.lowStock.map((v, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-[14px]">
                    <Link href={`/admin/products/${v.product_id}`} className="min-w-0 truncate hover:underline">
                      {v.name}
                      <span className="text-muted"> · {[v.color_name, v.size].filter(Boolean).join(" · ")}</span>
                    </Link>
                    <span className={`shrink-0 tabular-nums ${v.quantity_on_hand === 0 ? "text-danger" : "text-warning"}`}>
                      {v.quantity_on_hand === 0 ? "Sold out" : `${v.quantity_on_hand} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Best sellers, last 90 days">
            {d.top.length === 0 ? (
              <p className="text-[14px] text-muted">Not enough orders yet.</p>
            ) : (
              <ol className="space-y-2.5">
                {d.top.map((t) => (
                  <li key={t.name} className="flex justify-between gap-3 text-[14px]">
                    <span className="truncate">{t.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {t.units} sold · {formatUGX(t.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
