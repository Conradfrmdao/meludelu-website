"use client";

import { useActionState } from "react";
import { subscribe, type NewsletterState } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";

const initial: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(subscribe, initial);
  const dark = tone === "dark";

  if (state.status === "success") {
    return (
      <p role="status" className={`text-[15px] ${dark ? "text-ivory" : "text-charcoal"}`}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="w-full max-w-md">
      <div
        className={`flex h-13 items-center rounded-full border p-1 pl-5 ${
          dark ? "border-white/25 bg-white/5" : "border-line-strong bg-white"
        }`}
      >
        <label htmlFor={`newsletter-${tone}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-${tone}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email"
          className={`h-full min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none ${
            dark ? "text-ivory placeholder:text-ivory/55" : "placeholder:text-muted/80"
          }`}
        />
        <Button
          type="submit"
          disabled={pending}
          className={dark ? "!bg-ivory !text-charcoal hover:!bg-cream" : ""}
        >
          {pending ? "Joining…" : "Join"}
        </Button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="mt-2 pl-5 text-[13px] text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
