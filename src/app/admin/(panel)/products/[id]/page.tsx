import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/layout-bits";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions, getEditableProduct, getSupplierNames } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [product, categories, suppliers] = await Promise.all([
    getEditableProduct(admin, id),
    getCategoryOptions(),
    getSupplierNames(),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-[13px] text-muted hover:text-charcoal">
        ← Products
      </Link>
      <AdminHeader title={product.name} />
      {sp.saved && (
        <p role="status" className="mb-6 rounded-2xl bg-success-soft px-4 py-3 text-[14px] text-success">
          Saved. The shop shows the changes within a minute.
        </p>
      )}
      {sp.created && (
        <p role="status" className="mb-6 rounded-2xl bg-success-soft px-4 py-3 text-[14px] text-success">
          Product created{product.status === "active" ? " and live in the shop." : ". It's a draft until you set it to Live."}
        </p>
      )}
      <ProductForm
        key={`${product.id}-${String(sp.saved ?? "")}`}
        initial={product}
        categories={categories}
        suppliers={admin.role === "owner" ? suppliers : []}
        isOwner={admin.role === "owner"}
      />
    </>
  );
}
