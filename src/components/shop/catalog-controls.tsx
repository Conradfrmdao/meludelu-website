"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CloseIcon, FilterIcon } from "@/components/ui/icons";
import { priceRanges, sortOptions } from "@/lib/catalog-params";
import { useDialog } from "./use-dialog";

interface Options {
  sizes: string[];
  colors: { name: string; hex: string | null }[];
}

function useParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("show");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  const toggleInList = (key: string, value: string) =>
    update((params) => {
      const current = (params.get(key) ?? "").split(",").filter(Boolean);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      if (next.length) params.set(key, next.join(","));
      else params.delete(key);
    });

  const setValue = (key: string, value: string | null) =>
    update((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

  const clear = () =>
    update((params) => {
      ["size", "color", "price", "available"].forEach((k) => params.delete(k));
    });

  return { searchParams, toggleInList, setValue, clear, pending };
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13.5px] transition-colors ${
        active ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white text-charcoal hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroups({ options }: { options: Options }) {
  const { searchParams, toggleInList, setValue } = useParamUpdater();
  const sizes = (searchParams.get("size") ?? "").split(",").filter(Boolean);
  const colors = (searchParams.get("color") ?? "").split(",").filter(Boolean);
  const price = searchParams.get("price");
  const available = searchParams.get("available") === "1";

  return (
    <div className="space-y-8">
      {options.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-[13px] font-medium text-ink-soft">Size</legend>
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((s) => (
              <Chip key={s} active={sizes.includes(s)} onClick={() => toggleInList("size", s)}>
                {s}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      {options.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-[13px] font-medium text-ink-soft">Colour</legend>
          <div className="flex flex-wrap gap-2">
            {options.colors.map((c) => (
              <Chip key={c.name} active={colors.includes(c.name)} onClick={() => toggleInList("color", c.name)}>
                {c.hex && (
                  <span className="size-3.5 rounded-full ring-1 ring-black/10 ring-inset" style={{ backgroundColor: c.hex }} />
                )}
                {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 text-[13px] font-medium text-ink-soft">Price</legend>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((r) => (
            <Chip key={r.id} active={price === r.id} onClick={() => setValue("price", price === r.id ? null : r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-[13px] font-medium text-ink-soft">Availability</legend>
        <Chip active={available} onClick={() => setValue("available", available ? null : "1")}>
          {available && <CheckIcon size={15} />}
          Hide sold out
        </Chip>
      </fieldset>
    </div>
  );
}

export function CatalogControls({ options, total, activeCount }: { options: Options; total: number; activeCount: number }) {
  const [open, setOpen] = useState(false);
  const panelRef = useDialog(open, () => setOpen(false));
  const { searchParams, setValue, clear, pending } = useParamUpdater();
  const sort = searchParams.get("sort") ?? "newest";

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-y border-line py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13.5px] hover:border-line-strong"
        >
          <FilterIcon size={18} />
          Filter
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-charcoal text-[11px] text-ivory">{activeCount}</span>
          )}
        </button>
        <p className="hidden text-[13px] text-muted sm:block" aria-live="polite">
          {pending ? "Updating…" : `${total} ${total === 1 ? "piece" : "pieces"}`}
        </p>
        <label className="relative inline-flex items-center">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setValue("sort", e.target.value === "newest" ? null : e.target.value)}
            className="h-10 appearance-none rounded-full border border-line bg-white pl-4 pr-9 text-[13.5px] hover:border-line-strong focus:outline-none"
          >
            {sortOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3.5" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </label>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="absolute inset-0 animate-fade-in bg-charcoal/25" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] animate-slide-up flex-col rounded-t-[var(--radius-panel)] bg-ivory outline-none sm:inset-y-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-[420px] sm:animate-slide-in-right sm:rounded-[var(--radius-panel)]"
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <h2 id="filter-title" className="font-serif text-[28px]">
                Filter
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="-mr-2 grid size-10 place-items-center">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FilterGroups options={options} />
            </div>
            <div className="flex gap-3 border-t border-line px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <Button variant="secondary" onClick={clear} disabled={activeCount === 0} className="flex-1">
                Clear all
              </Button>
              <Button onClick={() => setOpen(false)} className="flex-1">
                {pending ? "Updating…" : `Show ${total}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
