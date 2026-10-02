import type { CatalogQuery } from "./catalog";
import { unsplash } from "./images";

export interface Collection {
  slug: string;
  title: string;
  intro: string;
  image: { url: string; alt: string };
  query: CatalogQuery;
}

// Collections are saved filters over the catalogue. Add one here to create a new page.
export const collections: Collection[] = [
  {
    slug: "linen",
    title: "The linen edit",
    intro: "Breathable linen for Kampala heat. It softens with every wash.",
    image: { url: unsplash("1578747522302-b987fbec4465", 1200), alt: "Close view of a natural linen dress" },
    query: { search: "linen" },
  },
  {
    slug: "knits",
    title: "Knitwear",
    intro: "Cardigans, jumpers and baby knits for cool mornings and air-conditioned rooms.",
    image: { url: unsplash("1634901849515-40ba019f9387", 1200), alt: "Cream and mustard knitwear piled together" },
    query: { categories: ["knitwear"] },
  },
  {
    slug: "newborn",
    title: "Newborn essentials",
    intro: "The first things a new baby needs, in sizes up to three months.",
    image: { url: unsplash("1622290319146-7b63df48a635", 1200), alt: "White baby bodysuit laid flat" },
    query: { department: "baby", sizes: ["Newborn", "0–3M", "0–6M"] },
  },
  {
    slug: "gifts",
    title: "Gifts for a new baby",
    intro: "Boxes, booties and small things that are easy to wrap.",
    image: { url: unsplash("1635874714425-c342060a4c58", 1200), alt: "A newborn gift box with bodysuits and a soft toy" },
    query: { department: "baby", categories: ["accessories"] },
  },
  {
    slug: "sale",
    title: "Reduced",
    intro: "A few pieces at a lower price, while they last.",
    image: { url: unsplash("1789145508216-ade0a26d518a", 1200), alt: "Woman in a sand tiered sundress on a beach" },
    query: { onSale: true },
  },
];

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}
