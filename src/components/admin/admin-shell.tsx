"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/admin-auth";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Stock" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ admin, children }: { admin: { name: string; role: string }; children: ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-cream/40 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur-xl lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-5 lg:h-20">
          <Link href="/admin" className="font-serif text-[20px] tracking-[0.2em]">
            MELUDELU
          </Link>
          <Link href="/" target="_blank" className="text-[12.5px] text-muted hover:text-charcoal lg:hidden">
            View shop
          </Link>
        </div>
        <nav aria-label="Admin" className="no-scrollbar overflow-x-auto px-3 pb-3 lg:px-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {nav.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active(item.href) ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-[14px] transition-colors lg:rounded-xl ${
                    active(item.href) ? "bg-charcoal text-ivory" : "text-ink-soft hover:bg-cream"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-line p-5 lg:block">
          <p className="text-[13.5px]">{admin.name}</p>
          <p className="text-[12px] capitalize text-muted">{admin.role}</p>
          <div className="mt-3 flex gap-4 text-[13px]">
            <Link href="/" target="_blank" className="text-muted hover:text-charcoal">
              View shop
            </Link>
            <form action={logout}>
              <button type="submit" className="text-muted hover:text-charcoal">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-5 py-6 lg:px-10 lg:py-10">
        {children}
        <form action={logout} className="mt-16 lg:hidden">
          <button type="submit" className="text-[13px] text-muted">
            Sign out ({admin.name})
          </button>
        </form>
      </main>
    </div>
  );
}
