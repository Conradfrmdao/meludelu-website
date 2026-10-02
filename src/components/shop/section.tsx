import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-5 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function SectionHeader({
  title,
  intro,
  href,
  linkLabel,
}: {
  title: string;
  intro?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6 lg:mb-10">
      <div className="max-w-xl">
        <h2 className="font-serif text-[34px] leading-[1.05] lg:text-[46px]">{title}</h2>
        {intro && <p className="mt-2 text-[15px] leading-relaxed text-muted">{intro}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2 text-[14px] text-ink-soft hover:text-charcoal sm:inline-flex"
        >
          {linkLabel ?? "View all"}
          <ArrowRightIcon size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Swipeable row on phones, a plain grid from tablet up. */
export function ProductRail({ products, href, linkLabel }: { products: Product[]; href?: string; linkLabel?: string }) {
  return (
    <>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {href && (
        <Link href={href} className="mt-6 inline-flex items-center gap-2 text-[14px] text-ink-soft sm:hidden">
          {linkLabel ?? "View all"} <ArrowRightIcon size={16} />
        </Link>
      )}
    </>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-12">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
