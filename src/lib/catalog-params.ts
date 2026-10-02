import type { CatalogQuery, SortOption } from "./catalog";

export const PAGE_SIZE = 12;

export const priceRanges = [
  { id: "0-50000", label: "Under UGX 50,000", min: 0, max: 50000 },
  { id: "50000-100000", label: "UGX 50,000 – 100,000", min: 50000, max: 100000 },
  { id: "100000-200000", label: "UGX 100,000 – 200,000", min: 100000, max: 200000 },
  { id: "200000-", label: "Over UGX 200,000", min: 200000, max: undefined },
] as const;

export const sortOptions: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
];

type RawParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : value.split(",");
  return values.map((v) => v.trim()).filter(Boolean).slice(0, 20);
}

export interface CatalogParams {
  sizes: string[];
  colors: string[];
  price: string | null;
  available: boolean;
  sort: SortOption;
  show: number;
}

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const sort = sortOptions.some((s) => s.id === raw.sort) ? (raw.sort as SortOption) : "newest";
  const show = Math.min(Math.max(Number(raw.show) || PAGE_SIZE, PAGE_SIZE), 96);
  const price = typeof raw.price === "string" && priceRanges.some((r) => r.id === raw.price) ? raw.price : null;
  return {
    sizes: list(raw.size),
    colors: list(raw.color),
    price,
    available: raw.available === "1",
    sort,
    show,
  };
}

export function toCatalogQuery(params: CatalogParams): CatalogQuery {
  const range = priceRanges.find((r) => r.id === params.price);
  return {
    sizes: params.sizes,
    colors: params.colors,
    minPrice: range?.min || undefined,
    maxPrice: range?.max,
    availableOnly: params.available,
    sort: params.sort,
    limit: params.show,
  };
}

export function activeFilterCount(params: CatalogParams): number {
  return params.sizes.length + params.colors.length + (params.price ? 1 : 0) + (params.available ? 1 : 0);
}
