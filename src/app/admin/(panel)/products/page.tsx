import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/layout-bits";
import { ProductImage } from "@/components/shop/product-image";
import { buttonClass } from "@/components/ui/button";
import { listAdminProducts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { formatUGX } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

const tabs = [
  { id: "all", label: "All" },
  { id: "active", label: "Live" },
  { id: "draft", label: "Drafts" },
  { id: "archived", label: "Archived" },
];

const statusTone = {
  active: "bg-success-soft text-success",
  draft: "bg-cream text-muted",
  archived: "bg-cream text-muted line-through",
};

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && tabs.some((t) => t.id === sp.status) ? sp.status : "all";
  const q = typeof sp.q === "string" ? sp.q : "";
  const products = await listAdminProducts(status, q);

  return (
    <>
      <AdminHeader
        title="Products"
        intro="Add pieces, set prices and choose what shows in the shop."
        action={
          <Link href="/admin/products/new" className={buttonClass("primary")}>
            Add product
          </Link>
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex gap-1.5">
          {tabs.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/products?status=${t.id}`}
                aria-current={status === t.id ? "page" : undefined}
                className={`inline-flex h-9 items-center rounded-full px-3.5 text-[13px] ${
                  status === t.id ? "bg-charcoal text-ivory" : "bg-ivory text-ink-soft ring-1 ring-line"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
        <form role="search" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="product-q" className="sr-only">
            Search products
          </label>
          <input
            id="product-q"
            name="q"
            defaultValue={q}
            placeholder="Search products"
            className="h-10 w-full rounded-full border border-line bg-white px-4 text-[14px] focus:border-charcoal focus:outline-none sm:w-64"
          />
        </form>
      </div>

      {products.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-ivory px-6 py-16 text-center ring-1 ring-line">
          <p className="font-serif text-[26px]">No products here</p>
          <Link href="/admin/products/new" className={buttonClass("secondary", "md", "mt-5")}>
            Add your first product
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-ivory ring-1 ring-line">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-cream/50 sm:px-5">
                <div className="w-12 shrink-0">
                  <ProductImage image={p.image ? { url: p.image, alt: "" } : null} sizes="48px" className="rounded-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px]">{p.name}</p>
                  <p className="truncate text-[12.5px] capitalize text-muted">
                    {p.department} › {p.category_name} · {p.supplier_type === "MELUDELU_STOCK" ? "In studio" : "Supplier"}
                    {p.is_featured && " · Featured"}
                    {p.is_new && " · New"}
                  </p>
                  {p.needs_review && <p className="mt-0.5 text-[12.5px] font-medium text-warning">Price needs review</p>}
                </div>
                <div className="hidden text-right text-[13.5px] tabular-nums sm:block">
                  {p.min_price !== null &&
                    (p.min_price === p.max_price ? formatUGX(p.min_price) : `${formatUGX(p.min_price)} – ${formatUGX(p.max_price!)}`)}
                  <p className="text-[12.5px] text-muted">
                    {p.stock_total !== null ? `${p.stock_total} in stock` : "Ordered in"} · {p.variant_count} options
                  </p>
                </div>
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ${statusTone[p.status]}`}>
                  {p.status === "active" ? "Live" : p.status === "draft" ? "Draft" : "Archived"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
