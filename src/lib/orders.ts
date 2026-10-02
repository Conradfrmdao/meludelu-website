import "server-only";
import { sql } from "./db";
import type { OrderStatus, PaymentMethod, PaymentStatus, StockStatus, SupplierType } from "./types";

// Customer-facing order view. Excludes unit_cost and internal notes.

export interface CustomerOrderItem {
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
  supplierType: SupplierType;
  stockStatus: StockStatus;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryZone: string;
  deliveryAddress: string;
  deliveryCityArea: string;
  deliveryNotes: string | null;
  hasExternalItems: boolean;
  createdAt: string;
  items: CustomerOrderItem[];
  history: { status: string; createdAt: string }[];
}

export async function getCustomerOrder(orderNumber: string, key: string): Promise<CustomerOrder | null> {
  if (!/^MD\d{5,}$/.test(orderNumber) || !/^[a-f0-9]{36}$/.test(key)) return null;
  const rows = (await sql`
    select o.id, o.order_number, o.status, o.payment_method, o.payment_status, o.subtotal, o.shipping_fee, o.total,
           o.customer_name, o.customer_phone, o.delivery_zone, o.delivery_address, o.delivery_city_area, o.delivery_notes,
           o.has_external_items, o.created_at,
           coalesce((select json_agg(json_build_object(
              'productName', oi.product_name, 'productSlug', oi.product_slug, 'imageUrl', oi.image_url,
              'size', oi.size, 'color', oi.color, 'unitPrice', oi.unit_price, 'quantity', oi.quantity,
              'supplierType', oi.supplier_type, 'stockStatus', oi.stock_status) order by oi.created_at)
             from order_items oi where oi.order_id = o.id), '[]') as items,
           coalesce((select json_agg(json_build_object('status', h.status, 'createdAt', h.created_at) order by h.created_at)
             from order_status_history h where h.order_id = o.id), '[]') as history
      from orders o
     where o.order_number = ${orderNumber} and o.access_key = ${key}
  `) as Record<string, unknown>[];
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id as string,
    orderNumber: r.order_number as string,
    status: r.status as OrderStatus,
    paymentMethod: r.payment_method as PaymentMethod,
    paymentStatus: r.payment_status as PaymentStatus,
    subtotal: r.subtotal as number,
    shippingFee: r.shipping_fee as number,
    total: r.total as number,
    customerName: r.customer_name as string,
    customerPhone: r.customer_phone as string,
    deliveryZone: r.delivery_zone as string,
    deliveryAddress: r.delivery_address as string,
    deliveryCityArea: r.delivery_city_area as string,
    deliveryNotes: r.delivery_notes as string | null,
    hasExternalItems: r.has_external_items as boolean,
    createdAt: new Date(r.created_at as string).toISOString(),
    items: r.items as CustomerOrderItem[],
    history: r.history as CustomerOrder["history"],
  };
}
