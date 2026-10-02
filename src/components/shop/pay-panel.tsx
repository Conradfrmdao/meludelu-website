"use client";

import { useActionState, useState } from "react";
import { type ReportState, reportPayment } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, PhoneIcon } from "@/components/ui/icons";
import { formatUGX } from "@/lib/format";
import type { PaymentInstructions } from "@/lib/payments/provider";

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-[12.5px] text-muted">{label}</p>
        <p className="text-[17px] font-medium tabular-nums tracking-wide">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // Clipboard blocked: the value is visible to copy by hand.
          }
        }}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[12.5px] hover:border-line-strong"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function PayPanel({
  instructions,
  orderNumber,
  accessKey,
  reported,
  contactPhone,
}: {
  instructions: PaymentInstructions;
  orderNumber: string;
  accessKey: string;
  reported: boolean;
  contactPhone: string;
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportPayment, {
    status: reported ? "done" : "idle",
    message: reported ? "You've told us you've paid. We'll confirm by phone shortly." : "",
  });

  if (instructions.kind === "manual") {
    return (
      <div className="rounded-[var(--radius-panel)] bg-white p-6 ring-1 ring-line">
        <h2 className="font-serif text-[28px]">How to pay</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          We&apos;ll call you shortly on the number you gave us to arrange your {instructions.label} payment of{" "}
          <strong className="font-medium">{formatUGX(instructions.amount)}</strong>. Please keep your phone close.
          {contactPhone && <> You can also call us on {contactPhone}.</>}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-panel)] bg-white p-6 ring-1 ring-line sm:p-8">
      <h2 className="font-serif text-[30px] leading-tight">Pay with {instructions.label}</h2>
      <p className="mt-2 text-[14.5px] text-muted">Your order is reserved. Pay now so we can get it ready.</p>

      <a
        href={instructions.telHref ?? undefined}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-charcoal text-[15.5px] font-medium text-ivory transition-colors hover:bg-ink-soft active:scale-[0.99]"
      >
        <PhoneIcon size={20} />
        Dial {instructions.dialString}
      </a>
      <p className="mt-2 text-center text-[12.5px] text-muted">Opens your phone&apos;s dialler. Press call to continue.</p>

      <div className="mt-6 divide-y divide-line border-y border-line">
        <CopyValue label="Merchant code" value={instructions.merchantCode} />
        {instructions.merchantName && (
          <div className="py-3">
            <p className="text-[12.5px] text-muted">Pay to</p>
            <p className="text-[15px]">{instructions.merchantName}</p>
          </div>
        )}
        <CopyValue label="Amount (UGX)" value={String(instructions.amount)} />
        <CopyValue label="Reference" value={instructions.reference} />
      </div>

      <ol className="mt-6 space-y-2.5 text-[14px] leading-relaxed text-ink-soft">
        {instructions.steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream text-[12px] font-medium">{i + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
        Ordering on a computer? Dial {instructions.dialString} from your phone and use the details above. Never share your PIN
        with anyone, including us.
      </p>

      <div className="mt-7 rounded-2xl bg-cream/70 p-5">
        {state.status === "done" ? (
          <p role="status" className="flex items-start gap-2 text-[14.5px]">
            <CheckIcon size={20} className="mt-0.5 shrink-0 text-success" />
            {state.message}
          </p>
        ) : (
          <form action={action} className="space-y-3">
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <input type="hidden" name="key" value={accessKey} />
            <p className="text-[14.5px] font-medium">Paid already?</p>
            <label htmlFor="reference" className="block text-[13px] text-muted">
              Transaction ID from your confirmation SMS (optional, helps us find it faster)
            </label>
            <div className="flex gap-2">
              <input
                id="reference"
                name="reference"
                maxLength={60}
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-[14px] focus:border-charcoal focus:outline-none"
              />
              <Button type="submit" disabled={pending}>
                {pending ? "Sending…" : "I've paid"}
              </Button>
            </div>
            {state.status === "error" && (
              <p role="alert" className="text-[13px] text-danger">
                {state.message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
