import "server-only";
import { sql } from "./db";
import type { Category, Department, Product } from "./types";

// Every storefront read goes through the storefront_products view,
// which has no supplier cost or supplier columns. Do not query products/product_variants here.

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  care: string;
  supplier_type: Product["supplierType"];
  shipping_type: Product["shippingType"];
  is_featured: boolean;
  is_new: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  category_slug: string;
  category_name: string;
  department: Department;
  department_name: string;
  images: Product["images"];
  variants: Product["variants"];
  min_price: number | null;
  is_available: boolean;
}

const COLUMNS = `id, name, slug, description, details, care, supplier_type, shipping_type, is_featured, is_new,
  seo_title, seo_description, created_at, category_slug, category_name, department, department_name,
  images, variants, min_price, is_available`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    details: row.details,
    care: row.care,
    supplierType: row.supplier_type,
    shippingType: row.shipping_type,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: new Date(row.created_at).toISOString(),
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    department: row.department,
    departmentName: row.department_name,
    images: row.images ?? [],
    variants: row.variants ?? [],
    minPrice: row.min_price ?? 0,
    isAvailable: row.is_available,
  };
}

export const DEPARTMENTS: Department[] = ["women", "baby"];

export function isDepartment(value: string): value is Department {
  return (DEPARTMENTS as string[]).includes(value);
}

export type SortOption = "newest" | "price-asc" | "price-desc";

export interface CatalogQuery {
  department?: Department;
  category?: string;
  /** Match any of these subcategory slugs (used by collections). */
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  search?: string;
  sort?: SortOption;
  limit?: number;
}

export async function listProducts(query: CatalogQuery = {}): Promise<{ products: Product[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, value: unknown) => {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  };

  if (query.department) add("department = ?", query.department);
  if (query.category) add("category_slug = ?", query.category);
  if (query.categories?.length) add("category_slug = any(?::text[])", query.categories);
  if (query.sizes?.length) add("sizes && ?::text[]", query.sizes);
  if (query.colors?.length) add("colors && ?::text[]", query.colors);
  if (query.minPrice) add("min_price >= ?", query.minPrice);
  if (query.maxPrice) add("min_price <= ?", query.maxPrice);
  if (query.availableOnly) where.push("is_available");
  if (query.isNew) where.push("is_new");
  if (query.onSale) {
    where.push(
      "exists (select 1 from json_array_elements(variants) v where (v->>'compareAtPrice')::int > (v->>'price')::int)",
    );
  }
  if (query.search) {
    add("(name ilike ? or description ilike $X or category_name ilike $X)", `%${query.search}%`);
    where[where.length - 1] = where[where.length - 1].replaceAll("$X", `$${params.length}`);
  }

  const order =
    query.sort === "price-asc"
      ? "min_price asc, created_at desc"
      : query.sort === "price-desc"
        ? "min_price desc, created_at desc"
        : "created_at desc";

  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const limit = Math.min(Math.max(query.limit ?? 12, 1), 96);

  const [rows, count] = await Promise.all([
    sql.query(`select ${COLUMNS} from storefront_products ${whereSql} order by ${order} limit ${limit}`, params),
    sql.query(`select count(*)::int as n from storefront_products ${whereSql}`, params),
  ]);

  return {
    products: (rows as ProductRow[]).map(toProduct),
    total: (count as { n: number }[])[0]?.n ?? 0,
  };
}

export async function getProduct(slug: string): Promise<Product | null> {
  const rows = (await sql.query(`select ${COLUMNS} from storefront_products where slug = $1`, [slug])) as ProductRow[];
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function getProductsByVariantIds(variantIds: string[]): Promise<Product[]> {
  if (!variantIds.length) return [];
  const rows = (await sql.query(
    `select ${COLUMNS} from storefront_products
      where exists (select 1 from json_array_elements(variants) v where (v->>'id') = any($1::text[]))`,
    [variantIds],
  )) as ProductRow[];
  return rows.map(toProduct);
}

export async function getFeatured(department: Department, limit = 4): Promise<Product[]> {
  const rows = (await sql.query(
    `select ${COLUMNS} from storefront_products where department = $1
      order by is_featured desc, is_available desc, created_at desc limit $2`,
    [department, limit],
  )) as ProductRow[];
  return rows.map(toProduct);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const rows = (await sql.query(
    `select ${COLUMNS} from storefront_products order by is_new desc, created_at desc limit $1`,
    [limit],
  )) as ProductRow[];
  return rows.map(toProduct);
}

/** Best sellers by units sold; featured pieces fill in until there are enough real orders. */
export async function getBestSellers(limit = 4): Promise<Product[]> {
  const rows = (await sql.query(
    `select ${COLUMNS} from storefront_products where is_available
      order by units_sold desc, is_featured desc, created_at asc limit $1`,
    [limit],
  )) as ProductRow[];
  return rows.map(toProduct);
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const rows = (await sql.query(
    `select ${COLUMNS} from storefront_products
      where department = $1 and slug <> $2
      order by (category_slug = $3) desc, is_available desc, created_at desc limit $4`,
    [product.department, product.slug, product.categorySlug, limit],
  )) as ProductRow[];
  return rows.map(toProduct);
}

export async function getCategories(department?: Department): Promise<Category[]> {
  const rows = (await sql.query(
    `select c.id, c.name, c.slug, c.description, d.slug as department
       from categories c join categories d on d.id = c.parent_id
      where ($1::text is null or d.slug = $1)
        and exists (select 1 from storefront_products sp where sp.department = d.slug and sp.category_slug = c.slug)
      order by d.sort_order, c.sort_order`,
    [department ?? null],
  )) as Category[];
  return rows;
}

export async function getDepartment(slug: Department): Promise<{ name: string; description: string | null } | null> {
  const rows = (await sql`select name, description from categories where parent_id is null and slug = ${slug}`) as {
    name: string;
    description: string | null;
  }[];
  return rows[0] ?? null;
}

/** Filter options for a listing, in a sensible order (sizes as they appear on products, not alphabetically). */
export async function getFilterOptions(department?: Department, category?: string) {
  const rows = (await sql.query(
    `select variants from storefront_products
      where ($1::text is null or department = $1) and ($2::text is null or category_slug = $2)
      order by created_at`,
    [department ?? null, category ?? null],
  )) as { variants: Product["variants"] }[];

  const sizes: string[] = [];
  const colors = new Map<string, string | null>();
  for (const row of rows) {
    for (const v of row.variants) {
      if (v.size && !sizes.includes(v.size)) sizes.push(v.size);
      if (v.colorName && !colors.has(v.colorName)) colors.set(v.colorName, v.colorHex);
    }
  }
  return { sizes, colors: [...colors].map(([name, hex]) => ({ name, hex })) };
}

export async function getAllProductSlugs(): Promise<{ slug: string; createdAt: string }[]> {
  const rows = (await sql`select slug, created_at from storefront_products`) as { slug: string; created_at: string }[];
  return rows.map((r) => ({ slug: r.slug, createdAt: new Date(r.created_at).toISOString() }));
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  const rows = (await sql.query(`select ${COLUMNS} from storefront_products where slug = any($1::text[])`, [
    slugs.slice(0, 60),
  ])) as ProductRow[];
  const bySlug = new Map(rows.map((r) => [r.slug, toProduct(r)]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p));
}
