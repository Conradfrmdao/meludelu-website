// Customer-facing types. Nothing here may carry supplier cost or supplier identity.

export type Department = "women" | "baby";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "available_to_order" | "ships_from_china";

export type SupplierType = "MELUDELU_STOCK" | "EXTERNAL_SUPPLIER";

export interface ProductImageData {
  url: string;
  alt: string;
}

export interface Variant {
  id: string;
  sku: string;
  size: string | null;
  colorName: string | null;
  colorHex: string | null;
  price: number;
  compareAtPrice: number | null;
  stockStatus: StockStatus;
  /** Units on the shelf, for stocked items only. Null means "ordered in for you". */
  maxQuantity: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  care: string;
  supplierType: SupplierType;
  shippingType: "local" | "international";
  isFeatured: boolean;
  isNew: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  categorySlug: string;
  categoryName: string;
  department: Department;
  departmentName: string;
  images: ProductImageData[];
  variants: Variant[];
  minPrice: number;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  department: Department;
}

export interface CartLine {
  variantId: string;
  productSlug: string;
  name: string;
  image: ProductImageData | null;
  size: string | null;
  colorName: string | null;
  price: number;
  quantity: number;
  maxQuantity: number | null;
  stockStatus: StockStatus;
}

export type PaymentMethod = "mtn" | "airtel";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "ordered_from_supplier"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "reported" | "confirmed" | "refunded";
