import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";

  return (
    <main className="grid min-h-dvh place-items-center bg-cream/60 px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-[30px] tracking-[0.22em]">MELUDELU</p>
        <div className="mt-8 rounded-[var(--radius-panel)] bg-ivory p-7 shadow-[var(--shadow-soft)] ring-1 ring-line">
          <h1 className="font-serif text-[30px] leading-none">Shop admin</h1>
          <p className="mt-2 text-[14px] text-muted">Sign in to manage orders and products.</p>
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
