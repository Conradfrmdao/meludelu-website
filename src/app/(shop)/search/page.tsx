import type { Metadata } from "next";
import Link from "next/link";
import { Container, ProductGrid } from "@/components/shop/section";
import { SearchIcon } from "@/components/ui/icons";
import { listProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

const suggestions = ["Linen", "Dress", "Cardigan", "Bodysuit", "Knit", "Coat"];

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, 80) : "";
  const result = q ? await listProducts({ search: q, limit: 48 }) : null;

  return (
    <Container className="pb-24 pt-8 lg:pt-14">
      <h1 className="sr-only">Search</h1>
      <form action="/search" role="search" className="mx-auto max-w-2xl">
        <label htmlFor="q" className="sr-only">
          Search Meludelu
        </label>
        <div className="flex h-14 items-center gap-3 rounded-full border border-line-strong bg-white px-5 transition-[border-color,box-shadow] focus-within:border-charcoal focus-within:ring-1 focus-within:ring-charcoal">
          <SearchIcon className="shrink-0 text-muted" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            placeholder="Search dresses, knits, bodysuits…"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </form>

      {!q && (
        <div className="mx-auto mt-8 max-w-2xl">
          <p className="text-[13px] text-muted">Try</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <Link
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-[13.5px] hover:border-line-strong"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-12">
          <p className="mb-8 text-[14px] text-muted" aria-live="polite">
            {result.total === 0
              ? `Nothing found for “${q}”.`
              : `${result.total} ${result.total === 1 ? "result" : "results"} for “${q}”`}
          </p>
          {result.total === 0 ? (
            <div className="flex gap-3">
              <Link href="/women" className="underline underline-offset-4">
                Browse women
              </Link>
              <span className="text-muted">or</span>
              <Link href="/baby" className="underline underline-offset-4">
                browse baby
              </Link>
            </div>
          ) : (
            <ProductGrid products={result.products} priorityCount={4} />
          )}
        </div>
      )}
    </Container>
  );
}
