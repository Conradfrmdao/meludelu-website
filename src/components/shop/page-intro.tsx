import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  href: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-ink-soft">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-charcoal">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageIntro({
  title,
  intro,
  crumbs,
  children,
}: {
  title: string;
  intro?: string | null;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <div className="pb-8 pt-6 lg:pb-10 lg:pt-12">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <h1 className="mt-4 font-serif text-[48px] leading-none lg:text-[76px]">{title}</h1>
      {intro && <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">{intro}</p>}
      {children}
    </div>
  );
}

export function CategoryTabs({ items, activeHref }: { items: Crumb[]; activeHref: string }) {
  return (
    <nav aria-label="Categories" className="no-scrollbar -mx-5 mt-7 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center rounded-full border px-4 text-[13.5px] transition-colors ${
                  active ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white/60 hover:border-line-strong"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
