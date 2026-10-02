"use client";

import { useActionState, useState } from "react";
import { adjustStock, type FormResult } from "@/app/actions/admin-store";
import { Button } from "@/components/ui/button";

export function StockAdjust({ variantId, label }: { variantId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(adjustStock, null);

  if (!open) {
    return (
      <div className="flex items-center justify-end gap-3">
        {state?.ok && <span className="text-[12.5px] text-success">{state.message}</span>}
        <button type="button" onClick={() => setOpen(true)} className="text-[13px] text-ink-soft underline underline-offset-4">
          Adjust
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2" aria-label={`Adjust stock for ${label}`}>
      <input type="hidden" name="variantId" value={variantId} />
      <label className="sr-only" htmlFor={`chg-${variantId}`}>
        Change
      </label>
      <input
        id={`chg-${variantId}`}
        name="change"
        type="number"
        placeholder="+5 or -1"
        required
        autoFocus
        className="h-9 w-24 rounded-full border border-line bg-white px-3 text-[13.5px]"
      />
      <label className="sr-only" htmlFor={`rsn-${variantId}`}>
        Reason
      </label>
      <select id={`rsn-${variantId}`} name="reason" className="h-9 rounded-full border border-line bg-white px-3 text-[13.5px]">
        <option value="restock">New stock arrived</option>
        <option value="return">Customer return</option>
        <option value="adjustment">Correction / damaged</option>
      </select>
      <label className="sr-only" htmlFor={`note-${variantId}`}>
        Note
      </label>
      <input id={`note-${variantId}`} name="note" placeholder="Note" className="h-9 w-32 rounded-full border border-line bg-white px-3 text-[13.5px]" />
      <Button type="submit" size="sm" disabled={pending}>
        Save
      </Button>
      <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-muted">
        Cancel
      </button>
      {state && !state.ok && <span className="w-full text-right text-[12.5px] text-danger">{state.message}</span>}
    </form>
  );
}
