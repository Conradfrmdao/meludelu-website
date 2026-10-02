import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/catalog";
import { collections } from "@/lib/collections";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);
  const pages = ["", "/women", "/baby", "/new-arrivals", "/collections", "/about", "/help/delivery", "/help/returns", "/help/paying", "/help/size-guide"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: `${base}/${c.department}/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
