import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/shop/clear-cart";
import { PayPanel } from "@/components/shop/pay-panel";
import { ProductImage } from "@/components/shop/product-image";
import { Container } from "@/components/shop/section";
import { WhatsAppIcon } from "@/components/ui/icons";
import { displayPhone, formatDate, formatUGX, orderStatusLabels } from "@/lib/format";
import { getCustomerOrder } from "@/lib/orders";
import { createMobileMoneyUssdProvider } from "@/lib/payments/mobile-money-ussd";
import { getSettings } from "@/lib/settings";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

const journey: OrderStatus[] = ["pending_payment", "paid", "processing", "shipped", "delivered"];

function Progress({ status, external }: { status: OrderStatus; external: boolean }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <p className="rounded-2xl bg-cream px-4 py-3 text-[14.5px]">
        This order was {status === "cancelled" ? "cancelled" : "refunded"}. Questions? Message us and quote your order number.
      </p>
    );
  }
  const steps = journey.map((s) => (s === "processing" && external ? "ordered_from_supplier" : s));
  const current = Math.max(steps.indexOf(status), status === "processing" || status === "ordered_from_supplier" ? 2 : 0);
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Order progress">
      {steps.map((s, i) => (
        <li key={s}>
          <span className={`block h-1 rounded-full ${i <= current ? "bg-charcoal" : "bg-line"}`} aria-hidden="true" />
          <span className={`mt-2 block text-[11.5px] leading-tight ${i === current ? "font-medium text-charcoal" : "text-muted"}`}>
            {orderStatusLabels[s]}
            {i === current && <span className="sr-only"> (current)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const sp = await searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  const placed = sp.placed === "1";

  const [order, settings] = await Promise.all([getCustomerOrder(number, key), getSettings()]);
  if (!order) notFound();

  const methodSettings = settings.payments[order.paymentMethod];
  const instructions = createMobileMoneyUssdProvider(methodSettings).createPayment({
    orderNumber: order.orderNumber,
    amount: order.total,
    method: order.paymentMethod,
    payerPhone: order.customerPhone,
  });
  const awaitingPayment = order.status === "pending_payment";
  const whatsapp = settings.contact.whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello Meludelu, this is ${order.customerName} about order ${order.orderNumber}.`)}`
    : null;

  return (
    <Container className="pb-24 pt-8 lg:pt-14">
      {placed && <ClearCart />}
      <div className="max-w-2xl">
        <p className="text-[13px] tabular-nums text-muted">
          Order {order.orderNumber} · {formatDate(order.createdAt, true)}
        </p>
        <h1 className="mt-3 font-serif text-[44px] leading-[1.02] lg:text-[64px]">
          {placed ? `Thank you, ${order.customerName.split(" ")[0]}.` : orderStatusLabels[order.status]}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
          {awaitingPayment
            ? "Your order is in. Once your payment comes through, we'll call you to confirm and arrange delivery."
            : `Current status: ${orderStatusLabels[order.status].toLowerCase()}. We'll call you if we need anything.`}
        </p>
        <div className="mt-8">
          <Progress status={order.status} external={order.hasExternalItems} />
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div className="order-2 lg:order-1">
          <h2 className="font-serif text-[28px]">What you ordered</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((item, i) => (
              <li key={i} className="flex gap-4 py-4">
                <Link href={`/product/${item.productSlug}`} className="w-16 shrink-0">
                  <ProductImage image={item.imageUrl ? { url: item.imageUrl, alt: item.productName } : null} sizes="64px" className="rounded-lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px]">{item.productName}</p>
                  <p className="text-[13px] text-muted">
                    {[item.color, item.size].filter(Boolean).join(" · ")} · Qty {item.quantity}
                  </p>
                  {item.supplierType === "EXTERNAL_SUPPLIER" && (
                    <p className="mt-1 text-[12.5px] text-taupe">Ordered in for you, about {settings.delivery.internationalLeadTime}</p>
                  )}
                </div>
                <p className="text-[14.5px] tabular-nums">{formatUGX(item.unitPrice * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-[14.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums">{formatUGX(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery, {order.deliveryZone}</dt>
              <dd className="tabular-nums">{order.shippingFee === 0 ? "Free" : formatUGX(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-[16px] font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatUGX(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-taupe">Delivering to</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed">
                {order.customerName}
                <br />
                {order.deliveryAddress}
                <br />
                {order.deliveryCityArea}, {order.deliveryZone}
              </p>
              {order.deliveryNotes && <p className="mt-2 text-[13.5px] text-muted">“{order.deliveryNotes}”</p>}
            </div>
            <div>
              <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-taupe">We&apos;ll call</h3>
              <p className="mt-2 text-[14.5px] tabular-nums">{displayPhone(order.customerPhone)}</p>
            </div>
          </div>

          <p className="mt-10 text-[13.5px] text-muted">
            Keep this page&apos;s link to check on your order later, or find it any time from{" "}
            <Link href="/account" className="underline underline-offset-4">
              Track an order
            </Link>{" "}
            with your order number and phone.
          </p>
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          {awaitingPayment ? (
            <PayPanel
              instructions={instructions}
              orderNumber={order.orderNumber}
              accessKey={key}
              reported={order.paymentStatus === "reported"}
              contactPhone={settings.contact.phone}
            />
          ) : (
            order.paymentStatus === "confirmed" && (
              <p className="rounded-2xl bg-success-soft px-5 py-4 text-[14.5px] text-success">
                Payment received. Thank you.
              </p>
            )
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-line-strong px-5 py-3 text-[14px] hover:border-charcoal"
            >
              <WhatsAppIcon size={19} />
              Message us on WhatsApp
            </a>
          )}
        </div>
      </div>
    </Container>
  );
}
