"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export interface ProductFormState {
  error: string | null;
  fieldErrors: Record<string, string>;
  saved?: boolean;
}

const money = z.number().int().min(0).max(100_000_000);

const variantSchema = z.object({
  id: z.uuid().nullable(),
  sku: z.string().trim().max(60),
  size: z.string().trim().max(30),
  colorName: z.string().trim().max(40),
  colorHex: z.union([z.literal(""), z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Colour must look like #D8CBB8")]),
  supplierCost: money.nullable(),
  retailPrice: money.min(500, "Price must be at least UGX 500"),
  compareAtPrice: money.nullable(),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock", "available_to_order", "ships_from_china"]),
  quantity: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(1000),
});

const productSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(2, "Give the product a name").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Add a URL name")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  categoryId: z.uuid("Choose a category"),
  description: z.string().trim().max(4000),
  details: z.string().trim().max(4000),
  care: z.string().trim().max(1000),
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  supplierType: z.enum(["MELUDELU_STOCK", "EXTERNAL_SUPPLIER"]),
  supplierName: z.string().trim().max(120),
  supplierProductId: z.string().trim().max(120),
  shippingType: z.enum(["local", "international"]),
  pricingMode: z.enum(["manual", "markup"]),
  markupMultiplier: z.number().min(1).max(20).nullable(),
  priceRounding: z.union([z.literal(0), z.literal(500), z.literal(1000)]),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
  images: z
    .array(z.object({ url: z.url("Image links must start with https://").startsWith("https://"), alt: z.string().trim().max(200) }))
    .max(12),
  variants: z.array(variantSchema).min(1, "Add at least one size or colour option").max(60),
});

function skuFor(slug: string, size: string, color: string, index: number) {
  const base = slug.split("-").map((w) => w.slice(0, 3)).join("").toUpperCase().slice(0, 10);
  const parts = [base, color.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase(), size.replace(/[^A-Za-z0-9]/g, "").toUpperCase()];
  return parts.filter(Boolean).join("-") || `${base}-${index + 1}`;
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const admin = await requireAdmin();
  const owner = admin.role === "owner";

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "The form couldn't be read. Please refresh and try again.", fieldErrors: {} };
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const p = parsed.data;
  const productId = p.id ?? crypto.randomUUID();
  const stocked = p.supplierType === "MELUDELU_STOCK";

  // Duplicate size/colour pairs would confuse shoppers.
  const keys = p.variants.map((v) => `${v.size.toLowerCase()}|${v.colorName.toLowerCase()}`);
  if (new Set(keys).size !== keys.length) {
    return { error: "Two options have the same size and colour.", fieldErrors: {} };
  }

  // Current state, for stock differences and for keeping staff away from cost fields.
  const existing = p.id
    ? ((await sql`
        select v.id, v.supplier_cost, coalesce(i.quantity_on_hand, 0) as qty
          from product_variants v left join inventory i on i.variant_id = v.id
         where v.product_id = ${p.id}
      `) as { id: string; supplier_cost: number | null; qty: number }[])
    : [];
  const existingById = new Map(existing.map((e) => [e.id, e]));
  if (p.id) {
    const found = (await sql`select supplier_id, supplier_product_id from products where id = ${p.id}`) as unknown[];
    if (!found.length) return { error: "This product no longer exists.", fieldErrors: {} };
  }

  const variants = p.variants.map((v, i) => {
    const id = v.id && existingById.has(v.id) ? v.id : crypto.randomUUID();
    const previous = existingById.get(id);
    return {
      ...v,
      id,
      isNew: !previous,
      previousQty: previous?.qty ?? 0,
      sku: v.sku || skuFor(p.slug, v.size, v.colorName, i),
      supplierCost: owner ? v.supplierCost : (previous?.supplier_cost ?? null),
      sortOrder: i,
    };
  });
  const keptIds = variants.map((v) => v.id);

  const queries = [];
  if (owner && p.supplierName) {
    queries.push(sql`insert into suppliers (name) values (${p.supplierName}) on conflict (name) do nothing`);
  }
  const supplierRef = owner ? p.supplierName || null : null;

  if (p.id) {
    queries.push(sql`
      update products set
        category_id = ${p.categoryId}, name = ${p.name}, slug = ${p.slug}, description = ${p.description},
        details = ${p.details}, care = ${p.care}, status = ${p.status}, is_featured = ${p.isFeatured}, is_new = ${p.isNew},
        supplier_type = ${p.supplierType}, shipping_type = ${p.shippingType}, pricing_mode = ${p.pricingMode},
        markup_multiplier = ${p.markupMultiplier}, price_rounding = ${p.priceRounding},
        seo_title = ${p.seoTitle || null}, seo_description = ${p.seoDescription || null}
      where id = ${productId}
    `);
    if (owner) {
      queries.push(sql`
        update products set
          supplier_id = (select id from suppliers where name = ${supplierRef}),
          supplier_product_id = ${p.supplierProductId || null}
        where id = ${productId}
      `);
    }
  } else {
    queries.push(sql`
      insert into products (id, category_id, name, slug, description, details, care, status, is_featured, is_new,
        supplier_type, supplier_id, supplier_product_id, shipping_type, pricing_mode, markup_multiplier, price_rounding,
        seo_title, seo_description)
      values (${productId}, ${p.categoryId}, ${p.name}, ${p.slug}, ${p.description}, ${p.details}, ${p.care}, ${p.status},
        ${p.isFeatured}, ${p.isNew}, ${p.supplierType}, (select id from suppliers where name = ${supplierRef}),
        ${owner ? p.supplierProductId || null : null}, ${p.shippingType}, ${p.pricingMode}, ${p.markupMultiplier},
        ${p.priceRounding}, ${p.seoTitle || null}, ${p.seoDescription || null})
    `);
  }

  queries.push(sql`delete from product_images where product_id = ${productId}`);
  p.images.forEach((img, i) => {
    queries.push(sql`
      insert into product_images (product_id, url, alt, sort_order) values (${productId}, ${img.url}, ${img.alt || p.name}, ${i})
    `);
  });

  // Options removed in the form are hidden, not deleted, so past orders keep their link.
  queries.push(sql`
    update product_variants set is_active = false
     where product_id = ${productId} and not (id = any(${keptIds}::uuid[]))
  `);

  for (const v of variants) {
    const externalStatus = stocked ? "in_stock" : v.stockStatus;
    if (v.isNew) {
      queries.push(sql`
        insert into product_variants (id, product_id, sku, size, color_name, color_hex, supplier_cost, retail_price,
          compare_at_price, stock_status, sort_order)
        values (${v.id}, ${productId}, ${v.sku}, ${v.size || null}, ${v.colorName || null}, ${v.colorHex || null},
          ${v.supplierCost}, ${v.retailPrice}, ${v.compareAtPrice}, ${externalStatus}, ${v.sortOrder})
      `);
    } else {
      queries.push(sql`
        update product_variants set sku = ${v.sku}, size = ${v.size || null}, color_name = ${v.colorName || null},
          color_hex = ${v.colorHex || null}, supplier_cost = ${v.supplierCost}, retail_price = ${v.retailPrice},
          compare_at_price = ${v.compareAtPrice}, stock_status = ${externalStatus}, sort_order = ${v.sortOrder},
          is_active = true
        where id = ${v.id}
      `);
    }
    if (stocked) {
      queries.push(sql`
        insert into inventory (variant_id, quantity_on_hand, low_stock_threshold) values (${v.id}, 0, ${v.lowStockThreshold})
        on conflict (variant_id) do update set low_stock_threshold = excluded.low_stock_threshold
      `);
      const change = v.quantity - v.previousQty;
      if (change !== 0) {
        queries.push(sql`
          select adjust_stock(${v.id}, ${change}, ${change > 0 ? "restock" : "adjustment"}, ${admin.name}, 'Edited on product page')
        `);
      }
    }
  }

  try {
    await sql.transaction(queries);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("products_slug_key")) {
      return { error: "Another product already uses that URL name.", fieldErrors: { slug: "Already in use" } };
    }
    if (message.includes("product_variants_sku_key")) {
      return { error: "One of the SKUs is already used by another product.", fieldErrors: {} };
    }
    console.error("saveProduct failed", error);
    return { error: "Couldn't save. Nothing was changed. Please try again.", fieldErrors: {} };
  }

  revalidatePath("/", "layout");
  // Reload the page so new options pick up their database ids (avoids duplicates on the next save).
  redirect(p.id ? `/admin/products/${productId}?saved=${Date.now()}` : `/admin/products/${productId}?created=1`);
}

export async function setProductStatus(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["draft", "active", "archived"]).parse(formData.get("status"));
  await sql`update products set status = ${status} where id = ${id}`;
  revalidatePath("/", "layout");
}
