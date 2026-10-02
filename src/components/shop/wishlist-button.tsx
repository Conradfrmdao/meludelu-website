"use client";

import { HeartIcon } from "@/components/ui/icons";
import { useStore } from "./store-provider";

export function WishlistButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { isWishlisted, toggleWishlist, ready } = useStore();
  const saved = ready && isWishlisted(slug);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`grid size-10 place-items-center rounded-full bg-ivory/85 text-charcoal backdrop-blur-sm transition-transform duration-200 hover:scale-105 active:scale-95 ${className}`}
    >
      <HeartIcon size={19} filled={saved} className={saved ? "text-[#b5574b]" : ""} />
    </button>
  );
}
