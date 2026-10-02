import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/shop/catalog-view";
import { PageIntro } from "@/components/shop/page-intro";
import { Container } from "@/components/shop/section";
import { getFilterOptions, listProducts } from "@/lib/catalog";
import { parseCatalogParams, toCatalogQuery } from "@/lib/catalog-params";
import { collections, getCollection } from "@/lib/collections";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.intro,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { images: [collection.image.url] },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const raw = await searchParams;
  const catalogParams = parseCatalogParams(raw);
  const userQuery = toCatalogQuery(catalogParams);
  const [options, result] = await Promise.all([
    getFilterOptions(collection.query.department),
    listProducts({
      ...collection.query,
      ...userQuery,
      sizes: userQuery.sizes?.length ? userQuery.sizes : collection.query.sizes,
    }),
  ]);

  return (
    <Container className="pb-24">
      <PageIntro
        title={collection.title}
        intro={collection.intro}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/collections", label: "Collections" },
          { href: `/collections/${slug}`, label: collection.title },
        ]}
      />
      <CatalogView
        products={result.products}
        total={result.total}
        params={catalogParams}
        rawParams={raw}
        basePath={`/collections/${slug}`}
        options={options}
        emptyHref="/collections"
      />
    </Container>
  );
}
