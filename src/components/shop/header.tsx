"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { MobileMenu } from "./mobile-menu";
import { primaryNav } from "./nav-links";
import { useStore } from "./store-provider";
import { useToggleLink } from "./use-toggle-link";
import { Wordmark } from "./wordmark";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count, openDrawer, ready } = useStore();
  const toggle = useToggleLink();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-charcoal px-4 py-2 text-sm text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <header
        className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled ? "border-b border-line/80 bg-ivory/80 backdrop-blur-xl backdrop-saturate-150" : "border-b border-transparent bg-ivory"
        }`}
      >
        <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:h-[72px] lg:px-10">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="-ml-2 grid size-10 place-items-center rounded-full lg:hidden"
            >
              <MenuIcon />
            </button>
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {primaryNav.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative text-[13.5px] tracking-[0.02em] transition-colors hover:text-charcoal ${
                          active ? "text-charcoal" : "text-ink-soft"
                        } after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-charcoal after:transition-all after:duration-300 ${
                          active ? "after:w-full" : "after:w-0 hover:after:w-full"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <Wordmark className="text-[22px] lg:text-[26px]" />

          <div className="flex items-center justify-end gap-0.5 lg:gap-1.5">
            <Link {...toggle("/search")} aria-label="Search" className="grid size-10 place-items-center rounded-full hover:bg-cream aria-[current=page]:bg-cream">
              <SearchIcon />
            </Link>
            <Link
              {...toggle("/account")}
              aria-label="Track an order"
              className="hidden size-10 place-items-center rounded-full hover:bg-cream aria-[current=page]:bg-cream lg:grid"
            >
              <UserIcon />
            </Link>
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
              className="relative -mr-2 hidden size-10 place-items-center rounded-full hover:bg-cream lg:mr-0 lg:grid"
            >
              <BagIcon />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-charcoal px-1 text-[10.5px] font-medium leading-[18px] text-ivory">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
