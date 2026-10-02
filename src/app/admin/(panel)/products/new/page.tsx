import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/layout-bits";
import { ProductForm } from "@/components/admin/product-form";
import { emptyProduct } from "@/lib/admin/product-defaults";
import { getCategoryOptions, getSupplierNames } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const admin = await requireAdmin();
  const [categories, suppliers] = await Promise.all([getCategoryOptions(), getSupplierNames()]);

  return (
    <>
      <Link href="/admin/products" className="text-[13px] text-muted hover:text-charcoal">
        ← Products
      </Link>
      <AdminHeader title="New product" intro="Saved as a draft until you choose Live." />
      <ProductForm
        initial={emptyProduct(categories[0]?.id ?? "")}
        categories={categories}
        suppliers={admin.role === "owner" ? suppliers : []}
        isOwner={admin.role === "owner"}
      />
    </>
  );
}
