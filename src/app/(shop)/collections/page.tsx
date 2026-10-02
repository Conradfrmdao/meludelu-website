import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/shop/page-intro";
import { Container } from "@/components/shop/section";
import { collections } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Collections",
  description: "Linen, knitwear, newborn essentials and gifts, gathered in one place.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  return (
    <Container className="pb-24">
      <PageIntro
        title="Collections"
        intro="A few ways into the shop, grouped by fabric, occasion and age."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/collections", label: "Collections" },
        ]}
      />
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <li key={c.slug}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] bg-cream">
                <Image
                  src={c.image.url}
                  alt={c.image.alt}
                  fill
                  priority={i < 3}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
                />
              </div>
              <h2 className="mt-4 font-serif text-[30px] leading-none">{c.title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{c.intro}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
