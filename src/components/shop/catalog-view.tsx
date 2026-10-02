import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { type CatalogParams, activeFilterCount } from "@/lib/catalog-params";
import type { Product } from "@/lib/types";
import { CatalogControls } from "./catalog-controls";
import { ProductCardSkeleton } from "./product-card";
import { ProductGrid } from "./section";

interface CatalogViewProps {
  products: Product[];
  total: number;
  params: CatalogParams;
  rawParams: Record<string, string | string[] | undefined>;
  basePath: string;
  options: { sizes: string[]; colors: { name: string; hex: string | null }[] };
  emptyHref?: string;
}

export function CatalogView({ products, total, params, rawParams, basePath, options, emptyHref = "/" }: CatalogViewProps) {
  const active = activeFilterCount(params);

  const moreParams = new URLSearchParams();
  for (const [k, v] of Object.entries(rawParams)) if (typeof v === "string" && k !== "show") moreParams.set(k, v);
  moreParams.set("show", String(params.show + 12));

  return (
    <div>
      <Suspense fallback={<div className="h-[66px] border-y border-line" />}>
        <CatalogControls options={options} total={total} activeCount={active} />
      </Suspense>

      <div className="pt-8 lg:pt-10">
        {products.length === 0 ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <p className="font-serif text-[30px]">Nothing matches just yet</p>
            <p className="mt-2 text-[15px] text-muted">
              {active > 0
                ? "Try removing a filter or two."
                : "New pieces are on their way. Have a look at what else we have in the meantime."}
            </p>
            <Link href={active > 0 ? basePath : emptyHref} className={buttonClass("secondary", "md", "mt-6")}>
              {active > 0 ? "Clear filters" : "Keep browsing"}
            </Link>
          </div>
        ) : (
          <>
            <ProductGrid products={products} priorityCount={4} />
            <div className="mt-14 flex flex-col items-center gap-4">
              <p className="text-[13px] text-muted">
                Showing {products.length} of {total}
              </p>
              {products.length < total && (
                <Link href={`${basePath}?${moreParams.toString()}`} scroll={false} className={buttonClass("secondary", "md")}>
                  Show more
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="h-[66px] border-y border-line" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-9 pt-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:pt-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
