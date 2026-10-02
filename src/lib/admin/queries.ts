import "server-only";
import type { AdminUser } from "../auth";
import { sql } from "../db";
import type { OrderStatus, PaymentMethod, PaymentStatus, StockStatus, SupplierType } from "../types";

// Admin reads. Anything with supplier cost checks the role first: staff never receive cost data.

const isOwner = (admin: AdminUser) => admin.role === "owner";

export async function getDashboard(admin: AdminUser) {
  const [totals, attention, lowStock, top, recent] = await Promise.all([
    sql`
      select
        coalesce(sum(total) filter (where payment_status = 'confirmed' and created_at > now() - interval '30 days'), 0)::int as revenue_30,
        coalesce(sum(total) filter (where payment_status = 'confirmed'), 0)::int as revenue_all,
        count(*) filter (where created_at > now() - interval '30 days')::int as orders_30,
        count(*)::int as orders_all,
        coalesce(sum(oi.cost_total) filter (where payment_status = 'confirmed' and created_at > now() - interval '30 days'), 0)::int as cost_30
      from orders o
      left join lateral (
        select sum(coalesce(unit_cost, 0) * quantity) as cost_total from order_items where order_id = o.id
      ) oi on true
      where status not in ('cancelled', 'refunded')
    `,
    sql`
      select
        count(*) filter (where status = 'pending_payment' and payment_status = 'pending')::int as awaiting,
        count(*) filter (where status = 'pending_payment' and payment_status = 'reported')::int as reported,
        count(*) filter (where status in ('paid', 'processing', 'ordered_from_supplier'))::int as to_fulfil
      from orders
    `,
    sql`
      select p.id as product_id, p.name, v.size, v.color_name, i.quantity_on_hand, i.low_stock_threshold
        from inventory i
        join product_variants v on v.id = i.variant_id and v.is_active
        join products p on p.id = v.product_id and p.status = 'active' and p.supplier_type = 'MELUDELU_STOCK'
       where i.quantity_on_hand <= i.low_stock_threshold
       order by i.quantity_on_hand, p.name
       limit 12
    `,
    sql`
      select oi.product_name as name, sum(oi.quantity)::int as units, sum(oi.unit_price * oi.quantity)::int as revenue
        from order_items oi join orders o on o.id = oi.order_id
       where o.status not in ('cancelled', 'refunded') and o.created_at > now() - interval '90 days'
       group by oi.product_name
       order by units desc
       limit 5
    `,
    sql`
      select order_number, customer_name, total, status, payment_status, created_at
        from orders order by created_at desc limit 8
    `,
  ]);

  const t = totals[0] as Record<string, number>;
  return {
    revenue30: t.revenue_30,
    revenueAll: t.revenue_all,
    orders30: t.orders_30,
    ordersAll: t.orders_all,
    margin30: isOwner(admin) ? t.revenue_30 - t.cost_30 : null,
    attention: attention[0] as { awaiting: number; reported: number; to_fulfil: number },
    lowStock: lowStock as {
      product_id: string;
      name: string;
      size: string | null;
      color_name: string | null;
      quantity_on_hand: number;
      low_stock_threshold: number;
    }[],
    top: top as { name: string; units: number; revenue: number }[],
    recent: recent as OrderRow[],
  };
}

export interface OrderRow {
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  delivery_zone?: string;
  has_external_items?: boolean;
  created_at: string;
}

export const ORDER_FILTERS = {
  attention: "Needs attention",
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  ordered_from_supplier: "Ordered from supplier",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  all: "All",
} as const;

export type OrderFilter = keyof typeof ORDER_FILTERS;

export async function listOrders(filter: OrderFilter, search: string): Promise<OrderRow[]> {
  const q = search.trim();
  const like = `%${q}%`;
  const rows = await sql`
    select order_number, customer_name, customer_phone, total, status, payment_status, payment_method,
           delivery_zone, has_external_items, created_at
      from orders
     where (
        ${filter} = 'all'
        or (${filter} = 'attention' and (status = 'pending_payment' or status in ('paid', 'processing')))
        or status = ${filter}
     )
       and (${q} = '' or order_number ilike ${like} or customer_name ilike ${like} or customer_phone ilike ${like})
     order by (payment_status = 'reported') desc, created_at desc
     limit 200
  `;
  return rows as OrderRow[];
}

export interface AdminOrderItem {
  product_name: string;
  product_slug: string;
  product_id: string | null;
  image_url: string | null;
  sku: string;
  size: string | null;
  color: string | null;
  supplier_type: SupplierType;
  stock_status: StockStatus;
  unit_price: number;
  unit_cost: number | null;
  quantity: number;
}

export async function getAdminOrder(admin: AdminUser, orderNumber: string) {
  const rows = (await sql`
    select o.*, p.provider_reference, p.confirmed_by,
           (select count(*)::int from orders o2 where o2.customer_id = o.customer_id) as customer_order_count
      from orders o left join payments p on p.order_id = o.id
     where o.order_number = ${orderNumber}
  `) as Record<string, unknown>[];
  const order = rows[0];
  if (!order) return null;

  const [items, history] = await Promise.all([
    sql`select product_name, product_slug, product_id, image_url, sku, size, color, supplier_type, stock_status,
               unit_price, unit_cost, quantity
          from order_items where order_id = ${order.id as string} order by created_at`,
    sql`select status, note, changed_by, created_at from order_status_history
         where order_id = ${order.id as string} order by created_at desc`,
  ]);

  const owner = isOwner(admin);
  return {
    id: order.id as string,
    orderNumber: order.order_number as string,
    status: order.status as OrderStatus,
    paymentStatus: order.payment_status as PaymentStatus,
    paymentMethod: order.payment_method as PaymentMethod,
    providerReference: (order.provider_reference as string | null) ?? null,
    confirmedBy: (order.confirmed_by as string | null) ?? null,
    subtotal: order.subtotal as number,
    shippingFee: order.shipping_fee as number,
    total: order.total as number,
    customerName: order.customer_name as string,
    customerPhone: order.customer_phone as string,
    customerEmail: order.customer_email as string | null,
    customerOrderCount: order.customer_order_count as number,
    deliveryZone: order.delivery_zone as string,
    deliveryAddress: order.delivery_address as string,
    deliveryCityArea: order.delivery_city_area as string,
    deliveryNotes: order.delivery_notes as string | null,
    hasExternalItems: order.has_external_items as boolean,
    internalNotes: order.internal_notes as string | null,
    accessKey: order.access_key as string,
    createdAt: new Date(order.created_at as string).toISOString(),
    items: (items as AdminOrderItem[]).map((i) => ({ ...i, unit_cost: owner ? i.unit_cost : null })),
    history: history as { status: string; note: string | null; changed_by: string; created_at: string }[],
  };
}

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "archived";
  supplier_type: SupplierType;
  department: string;
  category_name: string;
  image: string | null;
  min_price: number | null;
  max_price: number | null;
  variant_count: number;
  stock_total: number | null;
  is_featured: boolean;
  is_new: boolean;
  needs_review: boolean;
  updated_at: string;
}

export async function listAdminProducts(status: string, search: string): Promise<AdminProductRow[]> {
  const q = search.trim();
  const like = `%${q}%`;
  const rows = await sql`
    select p.id, p.name, p.slug, p.status, p.supplier_type, d.slug as department, c.name as category_name,
           (select url from product_images where product_id = p.id order by sort_order limit 1) as image,
           (select min(retail_price) from product_variants where product_id = p.id and is_active) as min_price,
           (select max(retail_price) from product_variants where product_id = p.id and is_active) as max_price,
           (select count(*)::int from product_variants where product_id = p.id and is_active) as variant_count,
           case when p.supplier_type = 'MELUDELU_STOCK' then
             (select coalesce(sum(i.quantity_on_hand), 0)::int from inventory i join product_variants v on v.id = i.variant_id
               where v.product_id = p.id and v.is_active)
           end as stock_total,
           p.is_featured, p.is_new,
           (p.pricing_mode = 'markup' and exists (
             select 1 from product_variants v where v.product_id = p.id and v.is_active and v.supplier_cost is not null
               and v.retail_price <> (case when p.price_rounding = 0 then round(v.supplier_cost * p.markup_multiplier)
                 else ceil(v.supplier_cost * p.markup_multiplier / p.price_rounding) * p.price_rounding end)::int
           )) as needs_review,
           p.updated_at
      from products p
      join categories c on c.id = p.category_id
      join categories d on d.id = c.parent_id
     where (${status} = 'all' or p.status = ${status})
       and (${q} = '' or p.name ilike ${like} or p.slug ilike ${like})
     order by p.status = 'archived', p.updated_at desc
  `;
  return rows as AdminProductRow[];
}

export interface EditableVariant {
  id: string | null;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  supplierCost: number | null;
  retailPrice: number;
  compareAtPrice: number | null;
  stockStatus: StockStatus;
  quantity: number;
  lowStockThreshold: number;
}

export interface EditableProduct {
  id: string | null;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  details: string;
  care: string;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isNew: boolean;
  supplierType: SupplierType;
  supplierName: string;
  supplierProductId: string;
  shippingType: "local" | "international";
  pricingMode: "manual" | "markup";
  markupMultiplier: number | null;
  priceRounding: 0 | 500 | 1000;
  seoTitle: string;
  seoDescription: string;
  images: { url: string; alt: string }[];
  variants: EditableVariant[];
}

export async function getEditableProduct(admin: AdminUser, id: string): Promise<EditableProduct | null> {
  const rows = (await sql`
    select p.*, s.name as supplier_name from products p left join suppliers s on s.id = p.supplier_id where p.id = ${id}
  `) as Record<string, unknown>[];
  const p = rows[0];
  if (!p) return null;
  const [images, variants] = await Promise.all([
    sql`select url, alt from product_images where product_id = ${id} order by sort_order`,
    sql`select v.id, v.sku, v.size, v.color_name, v.color_hex, v.supplier_cost, v.retail_price, v.compare_at_price,
               v.stock_status, coalesce(i.quantity_on_hand, 0) as quantity, coalesce(i.low_stock_threshold, 2) as threshold
          from product_variants v left join inventory i on i.variant_id = v.id
         where v.product_id = ${id} and v.is_active order by v.sort_order`,
  ]);
  const owner = isOwner(admin);
  return {
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    categoryId: p.category_id as string,
    description: p.description as string,
    details: p.details as string,
    care: p.care as string,
    status: p.status as EditableProduct["status"],
    isFeatured: p.is_featured as boolean,
    isNew: p.is_new as boolean,
    supplierType: p.supplier_type as SupplierType,
    supplierName: owner ? ((p.supplier_name as string | null) ?? "") : "",
    supplierProductId: owner ? ((p.supplier_product_id as string | null) ?? "") : "",
    shippingType: p.shipping_type as EditableProduct["shippingType"],
    pricingMode: p.pricing_mode as EditableProduct["pricingMode"],
    markupMultiplier: p.markup_multiplier === null ? null : Number(p.markup_multiplier),
    priceRounding: p.price_rounding as EditableProduct["priceRounding"],
    seoTitle: (p.seo_title as string | null) ?? "",
    seoDescription: (p.seo_description as string | null) ?? "",
    images: images as { url: string; alt: string }[],
    variants: (variants as Record<string, unknown>[]).map((v) => ({
      id: v.id as string,
      sku: v.sku as string,
      size: (v.size as string | null) ?? "",
      colorName: (v.color_name as string | null) ?? "",
      colorHex: (v.color_hex as string | null) ?? "",
      supplierCost: owner ? (v.supplier_cost as number | null) : null,
      retailPrice: v.retail_price as number,
      compareAtPrice: v.compare_at_price as number | null,
      stockStatus: v.stock_status as StockStatus,
      quantity: v.quantity as number,
      lowStockThreshold: v.threshold as number,
    })),
  };
}

export async function getCategoryOptions() {
  return (await sql`
    select c.id, d.name || ' › ' || c.name as label
      from categories c join categories d on d.id = c.parent_id
     order by d.sort_order, c.sort_order
  `) as { id: string; label: string }[];
}

export async function getSupplierNames() {
  return ((await sql`select name from suppliers order by name`) as { name: string }[]).map((r) => r.name);
}

export async function listInventory() {
  const [variants, movements] = await Promise.all([
    sql`
      select v.id, p.id as product_id, p.name, v.sku, v.size, v.color_name, i.quantity_on_hand, i.low_stock_threshold
        from product_variants v
        join products p on p.id = v.product_id and p.supplier_type = 'MELUDELU_STOCK' and p.status <> 'archived'
        join inventory i on i.variant_id = v.id
       where v.is_active
       order by (i.quantity_on_hand <= i.low_stock_threshold) desc, p.name, v.sort_order
    `,
    sql`
      select m.change, m.reason, m.actor, m.note, m.created_at, p.name, v.size, v.color_name, o.order_number
        from inventory_movements m
        join product_variants v on v.id = m.variant_id
        join products p on p.id = v.product_id
        left join orders o on o.id = m.order_id
       order by m.created_at desc limit 40
    `,
  ]);
  return {
    variants: variants as {
      id: string;
      product_id: string;
      name: string;
      sku: string;
      size: string | null;
      color_name: string | null;
      quantity_on_hand: number;
      low_stock_threshold: number;
    }[],
    movements: movements as {
      change: number;
      reason: string;
      actor: string;
      note: string | null;
      created_at: string;
      name: string;
      size: string | null;
      color_name: string | null;
      order_number: string | null;
    }[],
  };
}

export async function listCustomers(search: string) {
  const q = search.trim();
  const like = `%${q}%`;
  return (await sql`
    select c.id, c.name, c.phone, c.email, c.created_at,
           count(o.id)::int as orders,
           coalesce(sum(o.total) filter (where o.payment_status = 'confirmed'), 0)::int as spent,
           max(o.created_at) as last_order
      from customers c left join orders o on o.customer_id = c.id
     where (${q} = '' or c.name ilike ${like} or c.phone ilike ${like} or c.email ilike ${like})
     group by c.id
     order by max(o.created_at) desc nulls last
     limit 300
  `) as {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    created_at: string;
    orders: number;
    spent: number;
    last_order: string | null;
  }[];
}

export async function listAdmins() {
  return (await sql`select id, email, name, role, is_active, last_login_at from admin_users order by created_at`) as {
    id: string;
    email: string;
    name: string;
    role: "owner" | "staff";
    is_active: boolean;
    last_login_at: string | null;
  }[];
}

export async function getNewsletterCount() {
  const rows = (await sql`select count(*)::int as n from newsletter_subscribers`) as { n: number }[];
  return rows[0]?.n ?? 0;
}
