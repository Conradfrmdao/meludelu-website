-- Meludelu schema (PostgreSQL / Neon).
-- Money is stored as whole Uganda shillings (integer UGX).
-- Supplier cost lives in product_variants.supplier_cost and order_items.unit_cost.
-- The storefront never reads those tables directly: it reads the storefront_* views below.

create extension if not exists pgcrypto;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Categories: top level rows are departments (women, baby); children are subcategories.
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete restrict,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (parent_id, slug)
);
create index categories_parent_idx on categories(parent_id);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact text,
  notes text,
  integration_type text not null default 'manual' check (integration_type in ('manual', 'api')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '',
  details text not null default '',
  care text not null default '',
  supplier_type text not null check (supplier_type in ('MELUDELU_STOCK', 'EXTERNAL_SUPPLIER')),
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_product_id text,
  shipping_type text not null default 'local' check (shipping_type in ('local', 'international')),
  pricing_mode text not null default 'manual' check (pricing_mode in ('manual', 'markup')),
  markup_multiplier numeric(5, 2) check (markup_multiplier is null or markup_multiplier >= 1),
  price_rounding int not null default 1000 check (price_rounding in (0, 500, 1000)),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,
  is_new boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on products(category_id);
create index products_status_idx on products(status);
create index products_supplier_idx on products(supplier_id);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  size text,
  color_name text,
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  supplier_cost int check (supplier_cost is null or supplier_cost >= 0),
  retail_price int not null check (retail_price > 0),
  compare_at_price int check (compare_at_price is null or compare_at_price > 0),
  -- Used for external supplier items only. Stocked items derive status from inventory.
  stock_status text not null default 'available_to_order'
    check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'available_to_order', 'ships_from_china')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on product_variants(product_id);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references product_variants(id) on delete cascade,
  quantity_on_hand int not null default 0 check (quantity_on_hand >= 0),
  low_stock_threshold int not null default 2 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  url text not null,
  alt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_images_product_idx on product_images(product_id);

create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text,
  phone text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  line text not null,
  city_area text not null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_customer_idx on addresses(customer_id);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create sequence order_number_seq start 10001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_key text not null default encode(gen_random_bytes(18), 'hex'),
  customer_id uuid not null references customers(id) on delete restrict,
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'processing', 'ordered_from_supplier', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  payment_method text not null check (payment_method in ('mtn', 'airtel')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'reported', 'confirmed', 'refunded')),
  subtotal int not null default 0 check (subtotal >= 0),
  shipping_fee int not null default 0 check (shipping_fee >= 0),
  total int not null default 0 check (total >= 0),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_zone text not null,
  delivery_address text not null,
  delivery_city_area text not null,
  delivery_notes text,
  has_external_items boolean not null default false,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id);
create index orders_status_idx on orders(status);
create index orders_created_idx on orders(created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  image_url text,
  sku text not null,
  size text,
  color text,
  supplier_type text not null,
  stock_status text not null,
  unit_price int not null check (unit_price >= 0),
  unit_cost int,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index order_items_order_idx on order_items(order_id);
create index order_items_product_idx on order_items(product_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index order_status_history_order_idx on order_status_history(order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null check (provider in ('mtn_momo', 'airtel_money')),
  provider_reference text,
  amount int not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'reported', 'confirmed', 'refunded')),
  confirmed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on payments(order_id);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  change int not null,
  reason text not null check (reason in ('sale', 'restock', 'adjustment', 'return', 'cancellation')),
  order_id uuid references orders(id) on delete set null,
  actor text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inventory_movements_variant_idx on inventory_movements(variant_id);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null check (role in ('owner', 'staff')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  success boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index login_attempts_email_idx on login_attempts(email, created_at desc);

create table store_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'suppliers', 'products', 'product_variants', 'inventory', 'product_images',
    'customers', 'addresses', 'wishlists', 'orders', 'order_items', 'order_status_history',
    'payments', 'inventory_movements', 'admin_users', 'login_attempts', 'store_settings',
    'newsletter_subscribers'
  ] loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end;
$$;
