import type { Metadata } from "next";
import { CatalogView } from "@/components/shop/catalog-view";
import { PageIntro } from "@/components/shop/page-intro";
import { Container } from "@/components/shop/section";
import { getFilterOptions, listProducts } from "@/lib/catalog";
import { parseCatalogParams, toCatalogQuery } from "@/lib/catalog-params";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The latest women's and baby pieces to arrive at Meludelu.",
  alternates: { canonical: "/new-arrivals" },
};

export default async function NewArrivalsPage({ searchParams }: PageProps<"/new-arrivals">) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const [options, result] = await Promise.all([getFilterOptions(), listProducts({ ...toCatalogQuery(params), isNew: true })]);

  return (
    <Container className="pb-24">
      <PageIntro
        title="New arrivals"
        intro="The latest pieces to reach us, for women and for babies."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/new-arrivals", label: "New arrivals" },
        ]}
      />
      <CatalogView
        products={result.products}
        total={result.total}
        params={params}
        rawParams={raw}
        basePath="/new-arrivals"
        options={options}
      />
    </Container>
  );
}
