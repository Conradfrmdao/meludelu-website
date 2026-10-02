"use client";

import { useActionState } from "react";
import { lookupOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

export function OrderLookupForm() {
  const [state, action, pending] = useActionState(lookupOrder, { error: null });
  return (
    <form action={action} className="mt-8 space-y-4">
      <TextField id="orderNumber" label="Order number" placeholder="MD10001" autoCapitalize="characters" required />
      <TextField id="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0772 123 456" required />
      {state.error && (
        <p role="alert" className="text-[13.5px] text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Looking…" : "Find my order"}
      </Button>
    </form>
  );
}
