"use client";

import { useActionState, useState } from "react";
import { type FormResult, saveSettings } from "@/app/actions/admin-store";
import { Button } from "@/components/ui/button";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { buildDialString } from "@/lib/payments/mobile-money-ussd";
import type { MobileMoneySettings, StoreSettings } from "@/lib/settings";

const input = "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] focus:border-charcoal focus:outline-none";
const label = "mb-1.5 block text-[13px] text-ink-soft";

function Section({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] bg-ivory p-5 ring-1 ring-line lg:p-6">
      <h2 className="text-[15px] font-medium">{title}</h2>
      {intro && <div className="mt-1 text-[13px] leading-relaxed text-muted">{intro}</div>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MoneyFields({
  id,
  value,
  onChange,
}: {
  id: "mtn" | "airtel";
  value: MobileMoneySettings;
  onChange: (v: MobileMoneySettings) => void;
}) {
  const preview = value.merchantCode ? buildDialString(value.ussdTemplate, value.merchantCode, 145000) : null;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <label className="flex items-center gap-3 text-[14.5px] font-medium">
        <input type="checkbox" checked={value.enabled} onChange={(e) => onChange({ ...value, enabled: e.target.checked })} className="size-4 accent-charcoal" />
        Offer {id === "mtn" ? "MTN Mobile Money" : "Airtel Money"} at checkout
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-code`} className={label}>
            Merchant code
          </label>
          <input id={`${id}-code`} value={value.merchantCode} onChange={(e) => onChange({ ...value, merchantCode: e.target.value.trim() })} className={input} placeholder="e.g. 123456" />
        </div>
        <div>
          <label htmlFor={`${id}-name`} className={label}>
            Name customers see when paying
          </label>
          <input id={`${id}-name`} value={value.merchantName} onChange={(e) => onChange({ ...value, merchantName: e.target.value })} className={input} placeholder="MELUDELU" />
        </div>
        <div>
          <label htmlFor={`${id}-ussd`} className={label}>
            USSD to dial
          </label>
          <input id={`${id}-ussd`} value={value.ussdTemplate} onChange={(e) => onChange({ ...value, ussdTemplate: e.target.value.trim() })} className={`${input} font-mono`} />
        </div>
        <div>
          <label htmlFor={`${id}-label`} className={label}>
            Label at checkout
          </label>
          <input id={`${id}-label`} value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} className={input} />
        </div>
      </div>
      <p className="mt-3 text-[12.5px] text-muted">
        {preview ? (
          <>
            For a UGX 145,000 order the button will dial <span className="font-mono text-charcoal">{preview}</span>
          </>
        ) : (
          "Add the merchant code to show the Dial button. Until then, customers are told you'll call them."
        )}
      </p>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: StoreSettings }) {
  const [s, setS] = useState<StoreSettings>(initial);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(saveSettings, null);

  const setZone = (i: number, patch: Partial<StoreSettings["delivery"]["zones"][number]>) =>
    setS((cur) => ({
      ...cur,
      delivery: { ...cur.delivery, zones: cur.delivery.zones.map((z, j) => (j === i ? { ...z, ...patch } : z)) },
    }));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(s)} />

      <Section
        title="Mobile Money"
        intro={
          <>
            The order page shows a Dial button that opens the customer&apos;s phone dialler with this code. Use{" "}
            <code className="font-mono text-charcoal">{"{merchant}"}</code> and <code className="font-mono text-charcoal">{"{amount}"}</code>{" "}
            if your network supports a one-step code, for example{" "}
            <code className="font-mono text-charcoal">{"*165*3*{merchant}*{amount}#"}</code>. Check the exact code with MTN
            and Airtel before going live.
          </>
        }
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <MoneyFields id="mtn" value={s.payments.mtn} onChange={(mtn) => setS({ ...s, payments: { ...s.payments, mtn } })} />
          <MoneyFields id="airtel" value={s.payments.airtel} onChange={(airtel) => setS({ ...s, payments: { ...s.payments, airtel } })} />
        </div>
      </Section>

      <Section title="Delivery" intro="Customers pick one of these areas at checkout. The fee is added to their order.">
        <ul className="space-y-3">
          {s.delivery.zones.map((z, i) => (
            <li key={z.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1.4fr_1fr_1.2fr_auto] sm:items-end">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={`z${i}-label`} className={label}>
                  Area
                </label>
                <input id={`z${i}-label`} value={z.label} onChange={(e) => setZone(i, { label: e.target.value })} className={input} />
              </div>
              <div>
                <label htmlFor={`z${i}-fee`} className={label}>
                  Fee (UGX)
                </label>
                <input
                  id={`z${i}-fee`}
                  inputMode="numeric"
                  value={z.fee}
                  onChange={(e) => setZone(i, { fee: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor={`z${i}-eta`} className={label}>
                  Delivery time
                </label>
                <input id={`z${i}-eta`} value={z.eta} onChange={(e) => setZone(i, { eta: e.target.value })} className={input} />
              </div>
              <button
                type="button"
                aria-label={`Remove ${z.label}`}
                disabled={s.delivery.zones.length === 1}
                onClick={() => setS({ ...s, delivery: { ...s.delivery, zones: s.delivery.zones.filter((_, j) => j !== i) } })}
                className="grid size-11 place-items-center rounded-full text-muted hover:bg-cream disabled:opacity-30"
              >
                <CloseIcon size={17} />
              </button>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() =>
            setS({
              ...s,
              delivery: {
                ...s.delivery,
                zones: [...s.delivery.zones, { id: `zone-${Date.now().toString(36)}`, label: "", fee: 0, eta: "2–3 working days" }],
              },
            })
          }
        >
          <PlusIcon size={15} /> Add area
        </Button>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="free-over" className={label}>
              Free delivery on orders over (UGX)
            </label>
            <input
              id="free-over"
              inputMode="numeric"
              value={s.delivery.freeOver ?? ""}
              placeholder="Leave empty for no free delivery"
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                setS({ ...s, delivery: { ...s.delivery, freeOver: e.target.value.trim() === "" ? null : n } });
              }}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="lead" className={label}>
              Delivery time for ordered-in pieces
            </label>
            <input
              id="lead"
              value={s.delivery.internationalLeadTime}
              onChange={(e) => setS({ ...s, delivery: { ...s.delivery, internationalLeadTime: e.target.value } })}
              className={input}
            />
          </div>
        </div>
      </Section>

      <Section title="Contact" intro="Shown to customers on their order page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-wa" className={label}>
              WhatsApp number
            </label>
            <input
              id="c-wa"
              value={s.contact.whatsapp}
              placeholder="256772123456"
              onChange={(e) => setS({ ...s, contact: { ...s.contact, whatsapp: e.target.value } })}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="c-phone" className={label}>
              Phone number
            </label>
            <input
              id="c-phone"
              value={s.contact.phone}
              placeholder="0772 123 456"
              onChange={(e) => setS({ ...s, contact: { ...s.contact, phone: e.target.value } })}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="c-email" className={label}>
              Email
            </label>
            <input id="c-email" type="email" value={s.contact.email} onChange={(e) => setS({ ...s, contact: { ...s.contact, email: e.target.value } })} className={input} />
          </div>
          <div>
            <label htmlFor="c-city" className={label}>
              Studio city
            </label>
            <input id="c-city" value={s.contact.city} onChange={(e) => setS({ ...s, contact: { ...s.contact, city: e.target.value } })} className={input} />
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state && (
          <p role="status" className={`text-[14px] ${state.ok ? "text-success" : "text-danger"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
