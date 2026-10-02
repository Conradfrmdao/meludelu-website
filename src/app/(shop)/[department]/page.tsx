import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/shop/catalog-view";
import { CategoryTabs, PageIntro } from "@/components/shop/page-intro";
import { Container } from "@/components/shop/section";
import { getCategories, getDepartment, getFilterOptions, isDepartment, listProducts } from "@/lib/catalog";
import { parseCatalogParams, toCatalogQuery } from "@/lib/catalog-params";

export async function generateMetadata({ params }: PageProps<"/[department]">): Promise<Metadata> {
  const { department } = await params;
  if (!isDepartment(department)) return {};
  const dept = await getDepartment(department);
  return {
    title: department === "women" ? "Women's clothing" : "Baby clothing",
    description: dept?.description ?? undefined,
    alternates: { canonical: `/${department}` },
  };
}

export default async function DepartmentPage({ params, searchParams }: PageProps<"/[department]">) {
  const { department } = await params;
  if (!isDepartment(department)) notFound();

  const raw = await searchParams;
  const catalogParams = parseCatalogParams(raw);
  const [dept, categories, options, result] = await Promise.all([
    getDepartment(department),
    getCategories(department),
    getFilterOptions(department),
    listProducts({ ...toCatalogQuery(catalogParams), department }),
  ]);
  if (!dept) notFound();

  const tabs = [{ href: `/${department}`, label: "All" }, ...categories.map((c) => ({ href: `/${department}/${c.slug}`, label: c.name }))];

  return (
    <Container className="pb-24">
      <PageIntro
        title={dept.name}
        intro={dept.description}
        crumbs={[
          { href: "/", label: "Home" },
          { href: `/${department}`, label: dept.name },
        ]}
      >
        <CategoryTabs items={tabs} activeHref={`/${department}`} />
      </PageIntro>
      <CatalogView
        products={result.products}
        total={result.total}
        params={catalogParams}
        rawParams={raw}
        basePath={`/${department}`}
        options={options}
      />
    </Container>
  );
}
