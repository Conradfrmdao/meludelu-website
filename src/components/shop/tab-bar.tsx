"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BagIcon, DressIcon, HeartIcon, HomeIcon, OnesieIcon } from "@/components/ui/icons";
import { useStore } from "./store-provider";
import { useToggleLink } from "./use-toggle-link";

// Floating bottom tab bar for phones. Hidden where a page has its own sticky action bar.
const HIDDEN_ON = ["/product/", "/checkout", "/cart"];

function Tab({
  href,
  label,
  active,
  children,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  children: ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] tracking-wide transition-colors ${
        active ? "text-charcoal" : "text-muted"
      }`}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const { count, openDrawer, ready, wishlist } = useStore();
  const toggle = useToggleLink();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const is = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch rounded-[22px] border border-white/60 bg-ivory/85 px-1 shadow-[var(--shadow-lift)] backdrop-blur-xl backdrop-saturate-150">
        <Tab href="/" label="Home" active={is("/")}>
          <HomeIcon size={21} />
        </Tab>
        <Tab href="/women" label="Women" active={is("/women")}>
          <DressIcon size={21} />
        </Tab>
        <Tab href="/baby" label="Baby" active={is("/baby")}>
          <OnesieIcon size={21} />
        </Tab>
        <Tab href="/wishlist" label="Wishlist" active={is("/wishlist")} onClick={toggle("/wishlist").onClick}>
          <span className="relative">
            <HeartIcon size={21} />
            {ready && wishlist.length > 0 && (
              <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-[#b5574b]" aria-hidden="true" />
            )}
          </span>
        </Tab>
        <button
          type="button"
          onClick={openDrawer}
          aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
          className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] tracking-wide text-muted"
        >
          <span className="relative">
            <BagIcon size={21} />
            {ready && count > 0 && (
              <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-charcoal px-1 text-[9.5px] font-medium leading-4 text-ivory">
                {count}
              </span>
            )}
          </span>
          <span>Bag</span>
        </button>
      </div>
    </nav>
  );
}
