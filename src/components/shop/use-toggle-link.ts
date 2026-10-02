"use client";

import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

/**
 * Icon links that behave like toggles: tapping the icon for the page you're already on
 * takes you back to where you were (e.g. Account, Search, Wishlist).
 */
export function useToggleLink() {
  const pathname = usePathname();
  const router = useRouter();

  return (href: string) => ({
    href,
    "aria-current": pathname === href ? ("page" as const) : undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (pathname !== href) return;
      event.preventDefault();
      if (window.history.length > 1) router.back();
      else router.push("/");
    },
  });
}
