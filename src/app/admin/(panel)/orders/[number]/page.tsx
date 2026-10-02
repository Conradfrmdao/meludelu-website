import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/layout-bits";
import { InternalNoteForm, OrderActions } from "@/components/admin/order-actions";
import { OrderStatusPill, PaymentPill } from "@/components/admin/pills";
import { ProductImage } from "@/components/shop/product-image";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getAdminOrder } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { displayPhone, formatDate, formatUGX, orderStatusLabels } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[number]">): Promise<Metadata> {
  const { number } = await params;
  return { title: `Order ${number}` };
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  const admin = await requireAdmin();
  const { number } = await params;
  const order = await getAdminOrder(admin, number);
  if (!order) notFound();

  const owner = admin.role === "owner";
  const cost = order.items.reduce((sum, i) => sum + (i.unit_cost ?? 0) * i.quantity, 0);
  const hasCost = order.items.some((i) => i.unit_cost !== null);
  const firstName = order.customerName.split(" ")[0];
  const message = `Hello ${firstName}, this is Meludelu about your order ${order.orderNumber} (${formatUGX(order.total)}).`;
  const customerLink = `${siteUrl()}/order/${order.orderNumber}?key=${order.accessKey}`;

  return (
    <>
      <Link href="/admin/orders" className="text-[13px] text-muted hover:text-charcoal">
        ← Orders
      </Link>
      <AdminHeader
        title={order.orderNumber}
        intro={`Placed ${formatDate(order.createdAt, true)} · ${order.paymentMethod === "mtn" ? "MTN Mobile Money" : "Airtel Money"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <PaymentPill status={order.paymentStatus} />
            <OrderStatusPill status={order.status} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-4 py-3">
                  <div className="w-14 shrink-0">
                    <ProductImage image={item.image_url ? { url: item.image_url, alt: item.product_name } : null} sizes="56px" className="rounded-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px]">
                      {item.product_id ? (
                        <Link href={`/admin/products/${item.product_id}`} className="hover:underline">
                          {item.product_name}
                        </Link>
                      ) : (
                        item.product_name
                      )}
                    </p>
                    <p className="text-[13px] text-muted">
                      {[item.color, item.size].filter(Boolean).join(" · ")} · {item.sku}
                    </p>
                    {item.supplier_type === "EXTERNAL_SUPPLIER" && (
                      <p className="mt-1 text-[12.5px] font-medium text-warning">Order from supplier</p>
                    )}
                  </div>
                  <div className="text-right text-[14px] tabular-nums">
                    <p>
                      {item.quantity} × {formatUGX(item.unit_price)}
                    </p>
                    {owner && item.unit_cost !== null && (
                      <p className="text-[12.5px] text-muted">cost {formatUGX(item.unit_cost)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatUGX(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery ({order.deliveryZone})</dt>
                <dd className="tabular-nums">{formatUGX(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-[15.5px] font-medium">
                <dt>Total to collect</dt>
                <dd className="tabular-nums">{formatUGX(order.total)}</dd>
              </div>
              {owner && hasCost && (
                <div className="flex justify-between text-[13px] text-muted">
                  <dt>Margin on items</dt>
                  <dd className="tabular-nums">{formatUGX(order.subtotal - cost)}</dd>
                </div>
              )}
            </dl>
          </Panel>

          <Panel title="Timeline">
            <ol className="space-y-3">
              {order.history.map((h, i) => (
                <li key={i} className="flex gap-3 text-[14px]">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-taupe" aria-hidden="true" />
                  <div>
                    <p>
                      {orderStatusLabels[h.status as OrderStatus] ?? h.status}
                      {h.note && <span className="text-muted"> · {h.note}</span>}
                    </p>
                    <p className="text-[12.5px] text-muted">
                      {formatDate(h.created_at, true)} · {h.changed_by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Next step">
            {order.paymentStatus === "reported" && (
              <p className="mb-4 rounded-xl bg-warning-soft px-3 py-2.5 text-[13.5px] text-warning">
                Customer says they&apos;ve paid
                {order.providerReference ? (
                  <>
                    . Transaction ID: <strong className="font-medium tabular-nums">{order.providerReference}</strong>
                  </>
                ) : (
                  " (no transaction ID given)"
                )}
                .
              </p>
            )}
            <OrderActions
              orderNumber={order.orderNumber}
              status={order.status}
              paymentStatus={order.paymentStatus}
              hasExternalItems={order.hasExternalItems}
              total={order.total}
              paymentLabel={order.paymentMethod === "mtn" ? "MTN Mobile Money" : "Airtel Money"}
            />
          </Panel>

          <Panel title="Customer">
            <p className="text-[15px]">{order.customerName}</p>
            <p className="text-[14px] tabular-nums text-muted">{displayPhone(order.customerPhone)}</p>
            {order.customerEmail && <p className="text-[14px] text-muted">{order.customerEmail}</p>}
            <p className="mt-1 text-[12.5px] text-muted">
              {order.customerOrderCount > 1 ? `${order.customerOrderCount} orders with us` : "First order"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={`tel:+${order.customerPhone}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-charcoal text-[13.5px] text-ivory"
              >
                <PhoneIcon size={17} /> Call
              </a>
              <a
                href={`https://wa.me/${order.customerPhone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line-strong text-[13.5px]"
              >
                <WhatsAppIcon size={17} /> WhatsApp
              </a>
            </div>
            <div className="mt-5 border-t border-line pt-4 text-[14px] leading-relaxed">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-taupe">Deliver to</p>
              <p className="mt-1.5">{order.deliveryAddress}</p>
              <p>
                {order.deliveryCityArea}, {order.deliveryZone}
              </p>
              {order.deliveryNotes && <p className="mt-2 text-muted">“{order.deliveryNotes}”</p>}
            </div>
            <details className="mt-4 text-[13px] text-muted">
              <summary className="cursor-pointer">Customer&apos;s order page link</summary>
              <p className="mt-2 break-all">{customerLink}</p>
            </details>
          </Panel>

          <Panel title="Internal notes">
            <InternalNoteForm orderNumber={order.orderNumber} value={order.internalNotes ?? ""} />
          </Panel>
        </div>
      </div>
    </>
  );
}
