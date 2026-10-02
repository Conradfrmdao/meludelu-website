"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, { error: null, email: "" });
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <TextField id="email" label="Email" type="email" autoComplete="username" required defaultValue={state.email} />
      <TextField id="password" label="Password" type="password" autoComplete="current-password" required />
      {state.error && (
        <p role="alert" className="text-[13.5px] text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
