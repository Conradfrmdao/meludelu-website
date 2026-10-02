"use client";

import { useActionState } from "react";
import { addTeamMember, changePassword, type FormResult } from "@/app/actions/admin-store";
import { Button } from "@/components/ui/button";

const input = "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] focus:border-charcoal focus:outline-none";
const label = "mb-1.5 block text-[13px] text-ink-soft";

function Result({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-[13.5px] ${state.ok ? "text-success" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

export function AddTeamMemberForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(addTeamMember, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="tm-name" className={label}>
          Name
        </label>
        <input id="tm-name" name="name" required className={input} />
      </div>
      <div>
        <label htmlFor="tm-email" className={label}>
          Email
        </label>
        <input id="tm-email" name="email" type="email" required className={input} />
      </div>
      <div>
        <label htmlFor="tm-password" className={label}>
          Temporary password
        </label>
        <input id="tm-password" name="password" type="text" minLength={10} required autoComplete="new-password" className={input} />
      </div>
      <div>
        <label htmlFor="tm-role" className={label}>
          Access
        </label>
        <select id="tm-role" name="role" className={input} defaultValue="staff">
          <option value="staff">Staff: orders, products, stock (no costs)</option>
          <option value="owner">Owner: everything</option>
        </select>
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding…" : "Give access"}
        </Button>
        <Result state={state} />
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(changePassword, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="pw-current" className={label}>
          Current password
        </label>
        <input id="pw-current" name="current" type="password" required autoComplete="current-password" className={input} />
      </div>
      <div>
        <label htmlFor="pw-next" className={label}>
          New password
        </label>
        <input id="pw-next" name="next" type="password" minLength={10} required autoComplete="new-password" className={input} />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
        <Result state={state} />
      </div>
    </form>
  );
}
