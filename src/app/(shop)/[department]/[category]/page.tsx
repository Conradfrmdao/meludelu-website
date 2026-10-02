import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/shop/catalog-view";
import { CategoryTabs, PageIntro } from "@/components/shop/page-intro";
import { Container } from "@/components/shop/section";
import { getCategories, getDepartment, getFilterOptions, isDepartment, listProducts } from "@/lib/catalog";
import { parseCatalogParams, toCatalogQuery } from "@/lib/catalog-params";

async function load(department: string, category: string) {
  if (!isDepartment(department)) return null;
  const [dept, categories] = await Promise.all([getDepartment(department), getCategories(department)]);
  const current = categories.find((c) => c.slug === category);
  if (!dept || !current) return null;
  return { department, dept, categories, current };
}

export async function generateMetadata({ params }: PageProps<"/[department]/[category]">): Promise<Metadata> {
  const { department, category } = await params;
  const data = await load(department, category);
  if (!data) return {};
  return {
    title: `${data.current.name} | ${data.dept.name}`,
    description: data.current.description ?? data.dept.description ?? undefined,
    alternates: { canonical: `/${department}/${category}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[department]/[category]">) {
  const { department, category } = await params;
  const data = await load(department, category);
  if (!data) notFound();

  const raw = await searchParams;
  const catalogParams = parseCatalogParams(raw);
  const [options, result] = await Promise.all([
    getFilterOptions(data.department, category),
    listProducts({ ...toCatalogQuery(catalogParams), department: data.department, category }),
  ]);

  const base = `/${department}`;
  const tabs = [{ href: base, label: "All" }, ...data.categories.map((c) => ({ href: `${base}/${c.slug}`, label: c.name }))];

  return (
    <Container className="pb-24">
      <PageIntro
        title={data.current.name}
        intro={data.current.description}
        crumbs={[
          { href: "/", label: "Home" },
          { href: base, label: data.dept.name },
          { href: `${base}/${category}`, label: data.current.name },
        ]}
      >
        <CategoryTabs items={tabs} activeHref={`${base}/${category}`} />
      </PageIntro>
      <CatalogView
        products={result.products}
        total={result.total}
        params={catalogParams}
        rawParams={raw}
        basePath={`${base}/${category}`}
        options={options}
        emptyHref={base}
      />
    </Container>
  );
}
