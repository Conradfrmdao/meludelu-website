"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type CheckoutState, placeOrder } from "@/app/actions/checkout";
import { Button, buttonClass } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { formatUGX } from "@/lib/format";
import type { DeliveryZone } from "@/lib/settings";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";
import { useCartSync } from "./use-cart-sync";

const empty: CheckoutState = {
  errors: {},
  values: { name: "", phone: "", email: "", zone: "", address: "", cityArea: "", notes: "", payment: "" },
};

const methodStyle: Record<string, { dot: string; note: string }> = {
  mtn: { dot: "bg-[#ffcb05]", note: "Pay from your MTN line" },
  airtel: { dot: "bg-[#e40000]", note: "Pay from your Airtel line" },
};

function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  note,
  aside,
  leading,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  title: string;
  note?: string;
  aside?: string;
  leading?: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white px-4 py-4 transition-colors ${
        checked ? "border-charcoal ring-1 ring-charcoal" : "border-line hover:border-line-strong"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${checked ? "border-charcoal" : "border-line-strong"}`} aria-hidden="true">
        {checked && <span className="size-2.5 rounded-full bg-charcoal" />}
      </span>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px]">{title}</span>
        {note && <span className="block text-[13px] text-muted">{note}</span>}
      </span>
      {aside && <span className="text-[14px] tabular-nums">{aside}</span>}
    </label>
  );
}

export function CheckoutForm({
  zones,
  freeOver,
  methods,
  leadTime,
}: {
  zones: DeliveryZone[];
  freeOver: number | null;
  methods: { id: string; label: string }[];
  leadTime: string;
}) {
  const { lines, subtotal, ready } = useStore();
  const { note, checking } = useCartSync();
  const [state, action, pending] = useActionState(placeOrder, empty);
  const [zone, setZone] = useState(state.values.zone || zones[0]?.id || "");
  const [payment, setPayment] = useState(state.values.payment || "");

  const selectedZone = zones.find((z) => z.id === zone);
  const free = freeOver !== null && subtotal >= freeOver;
  const shipping = selectedZone ? (free ? 0 : selectedZone.fee) : 0;
  const external = lines.filter((l) => l.stockStatus === "ships_from_china" || l.stockStatus === "available_to_order");
  const soldOut = lines.some((l) => l.stockStatus === "out_of_stock");
  const e = state.errors;
  const v = state.values;

  if (!ready) return <div className="skeleton mt-10 h-96 rounded-[var(--radius-panel)]" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-[30px]">Your bag is empty</p>
        <Link href="/" className={buttonClass("secondary", "md", "mt-6")}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })))} />

      <div className="space-y-12">
        {(e.form || e.items) && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">
            {e.form ?? e.items}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-5 font-serif text-[28px]">Your details</legend>
          <TextField id="name" label="Full name" autoComplete="name" required defaultValue={v.name} error={e.name} />
          <TextField
            id="phone"
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="0772 123 456"
            defaultValue={v.phone}
            error={e.phone}
            hint="We'll call this number to confirm your order and delivery."
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            optional
            defaultValue={v.email}
            error={e.email}
          />
        </fieldset>

        <fieldset>
          <legend className="mb-5 font-serif text-[28px]">Delivery</legend>
          <div className="grid gap-2.5" role="radiogroup" aria-label="Delivery area">
            {zones.map((z) => (
              <OptionCard
                key={z.id}
                name="zone"
                value={z.id}
                checked={zone === z.id}
                onChange={setZone}
                title={z.label}
                note={z.eta}
                aside={free ? "Free" : formatUGX(z.fee)}
              />
            ))}
          </div>
          {e.zone && <p className="mt-2 text-[13px] text-danger">{e.zone}</p>}
          <div className="mt-5 space-y-4">
            <TextField
              id="address"
              label="Street, building or landmark"
              autoComplete="street-address"
              required
              placeholder="e.g. Plot 12, Kira Road, opposite the petrol station"
              defaultValue={v.address}
              error={e.address}
            />
            <TextField
              id="cityArea"
              label="Town or area"
              autoComplete="address-level2"
              required
              placeholder="e.g. Kamwokya"
              defaultValue={v.cityArea}
              error={e.cityArea}
            />
            <TextAreaField
              id="notes"
              label="Notes for us or the rider"
              optional
              rows={3}
              defaultValue={v.notes}
              error={e.notes}
              placeholder="Gate colour, best time to call, a name for a gift card…"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-serif text-[28px]">Payment</legend>
          <p className="mb-5 text-[14px] leading-relaxed text-muted">
            After you place the order we&apos;ll show you the merchant code and amount. On a phone, one tap opens your
            dialler with the code ready. Your PIN is only ever entered on your own phone.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {methods.map((m) => (
              <OptionCard
                key={m.id}
                name="payment"
                value={m.id}
                checked={payment === m.id}
                onChange={setPayment}
                title={m.label}
                note={methodStyle[m.id]?.note}
                leading={<span className={`size-3 shrink-0 rounded-full ${methodStyle[m.id]?.dot}`} aria-hidden="true" />}
              />
            ))}
          </div>
          {e.payment && <p className="mt-2 text-[13px] text-danger">{e.payment}</p>}
        </fieldset>
      </div>

      <aside className="h-fit space-y-5 lg:sticky lg:top-28">
        <div className="rounded-[var(--radius-panel)] bg-cream/70 p-6">
          <h2 className="font-serif text-[26px]">Your order</h2>
          {note && (
            <p role="status" className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-[13px] text-warning">
              {note}
            </p>
          )}
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 py-3">
                <div className="relative w-14 shrink-0">
                  <ProductImage image={l.image} sizes="56px" className="rounded-lg" />
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-charcoal text-[11px] text-ivory">
                    {l.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]">{l.name}</p>
                  <p className="text-[12.5px] text-muted">{[l.colorName, l.size].filter(Boolean).join(" · ")}</p>
                  {l.stockStatus === "out_of_stock" && <p className="text-[12.5px] text-danger">Sold out</p>}
                </div>
                <p className="text-[14px] tabular-nums">{formatUGX(l.price * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-4 text-[14.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums">{formatUGX(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery{selectedZone ? `, ${selectedZone.label}` : ""}</dt>
              <dd className="tabular-nums">{free ? "Free" : formatUGX(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-[16px] font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatUGX(subtotal + shipping)}</dd>
            </div>
          </dl>
        </div>

        {external.length > 0 && (
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[14px] font-medium">Some pieces are ordered in for you</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              {external.map((l) => l.name).join(", ")} {external.length === 1 ? "comes" : "come"} from our makers abroad and
              usually {external.length === 1 ? "arrives" : "arrive"} in {leadTime}. Everything is delivered together unless
              you ask us to split it.
            </p>
            <label className="mt-3 flex items-start gap-3 text-[13.5px]">
              <input type="checkbox" name="leadTimeOk" className="mt-0.5 size-4 accent-charcoal" />
              <span>I&apos;m happy to wait for these pieces.</span>
            </label>
            {e.leadTime && <p className="mt-2 text-[13px] text-danger">{e.leadTime}</p>}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending || checking || soldOut}>
          {pending ? "Placing your order…" : `Place order · ${formatUGX(subtotal + shipping)}`}
        </Button>
        {soldOut && <p className="text-center text-[13px] text-danger">Remove sold-out pieces from your bag to continue.</p>}
        <p className="text-center text-[12.5px] leading-relaxed text-muted">
          Placing the order doesn&apos;t take any money. You pay by Mobile Money on the next screen, and we confirm by
          phone. See our <Link href="/help/returns" className="underline underline-offset-2">exchange policy</Link>.
        </p>
      </aside>
    </form>
  );
}
