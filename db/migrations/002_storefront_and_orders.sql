-- Storefront views: the only product data the public site reads.
-- They deliberately leave out supplier_cost, supplier names and supplier ids.

create or replace view storefront_variants as
select
  v.id,
  v.product_id,
  v.sku,
  v.size,
  v.color_name,
  v.color_hex,
  v.retail_price,
  v.compare_at_price,
  v.sort_order,
  case
    when p.supplier_type = 'MELUDELU_STOCK' then
      case
        when coalesce(i.quantity_on_hand, 0) <= 0 then 'out_of_stock'
        when i.quantity_on_hand <= i.low_stock_threshold then 'low_stock'
        else 'in_stock'
      end
    else v.stock_status
  end as stock_status,
  case when p.supplier_type = 'MELUDELU_STOCK' then coalesce(i.quantity_on_hand, 0) end as max_quantity
from product_variants v
join products p on p.id = v.product_id
left join inventory i on i.variant_id = v.id
where v.is_active;

create or replace view storefront_products as
select
  p.id,
  p.name,
  p.slug,
  p.description,
  p.details,
  p.care,
  p.supplier_type,
  p.shipping_type,
  p.is_featured,
  p.is_new,
  p.seo_title,
  p.seo_description,
  p.created_at,
  c.slug as category_slug,
  c.name as category_name,
  d.slug as department,
  d.name as department_name,
  coalesce((
    select json_agg(json_build_object('url', pi.url, 'alt', pi.alt) order by pi.sort_order)
    from product_images pi where pi.product_id = p.id
  ), '[]'::json) as images,
  coalesce((
    select json_agg(json_build_object(
      'id', sv.id,
      'sku', sv.sku,
      'size', sv.size,
      'colorName', sv.color_name,
      'colorHex', sv.color_hex,
      'price', sv.retail_price,
      'compareAtPrice', sv.compare_at_price,
      'stockStatus', sv.stock_status,
      'maxQuantity', sv.max_quantity
    ) order by sv.sort_order)
    from storefront_variants sv where sv.product_id = p.id
  ), '[]'::json) as variants,
  (select min(sv.retail_price) from storefront_variants sv where sv.product_id = p.id) as min_price,
  coalesce((select array_agg(distinct sv.size) from storefront_variants sv where sv.product_id = p.id and sv.size is not null), '{}') as sizes,
  coalesce((select array_agg(distinct sv.color_name) from storefront_variants sv where sv.product_id = p.id and sv.color_name is not null), '{}') as colors,
  exists (
    select 1 from storefront_variants sv where sv.product_id = p.id and sv.stock_status <> 'out_of_stock'
  ) as is_available,
  coalesce((
    select sum(oi.quantity) from order_items oi join orders o on o.id = oi.order_id
    where oi.product_id = p.id and o.status not in ('cancelled', 'refunded')
  ), 0)::int as units_sold
from products p
join categories c on c.id = p.category_id
join categories d on d.id = c.parent_id
where p.status = 'active';

-- place_order: creates a whole order or nothing.
-- Prices come from the database, never from the browser.
-- Stocked items are checked and deducted under a row lock, so two shoppers cannot buy the last piece.
create or replace function place_order(
  p_customer jsonb,
  p_delivery jsonb,
  p_items jsonb,
  p_payment_method text,
  p_shipping_fee int
) returns table (order_id uuid, order_number text, access_key text, total int)
language plpgsql as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_number text;
  v_key text;
  v_subtotal int := 0;
  v_has_external boolean := false;
  v_item jsonb;
  v_qty int;
  v_variant record;
  v_on_hand int;
  v_status text;
  v_image text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into customers (name, email, phone)
  values (p_customer->>'name', nullif(p_customer->>'email', ''), p_customer->>'phone')
  on conflict (phone) do update
    set name = excluded.name, email = coalesce(excluded.email, customers.email)
  returning id into v_customer_id;

  v_number := 'MD' || nextval('order_number_seq');

  insert into orders (
    order_number, customer_id, payment_method, shipping_fee,
    customer_name, customer_phone, customer_email,
    delivery_zone, delivery_address, delivery_city_area, delivery_notes
  ) values (
    v_number, v_customer_id, p_payment_method, p_shipping_fee,
    p_customer->>'name', p_customer->>'phone', nullif(p_customer->>'email', ''),
    p_delivery->>'zone', p_delivery->>'address', p_delivery->>'cityArea', nullif(p_delivery->>'notes', '')
  ) returning id, orders.access_key into v_order_id, v_key;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select v.id, v.sku, v.size, v.color_name, v.retail_price, v.supplier_cost, v.stock_status, v.is_active,
           p.id as product_id, p.name as product_name, p.slug as product_slug, p.supplier_type, p.status as product_status
      into v_variant
      from product_variants v
      join products p on p.id = v.product_id
     where v.id = (v_item->>'variantId')::uuid
     for update of v;

    if not found or not v_variant.is_active or v_variant.product_status <> 'active' then
      raise exception 'UNAVAILABLE:%', coalesce(v_variant.product_name, 'An item');
    end if;

    if v_variant.supplier_type = 'MELUDELU_STOCK' then
      select quantity_on_hand into v_on_hand from inventory where variant_id = v_variant.id for update;
      if coalesce(v_on_hand, 0) < v_qty then
        raise exception 'OUT_OF_STOCK:%', v_variant.product_name;
      end if;
      update inventory set quantity_on_hand = quantity_on_hand - v_qty where variant_id = v_variant.id;
      insert into inventory_movements (variant_id, change, reason, order_id, actor)
      values (v_variant.id, -v_qty, 'sale', v_order_id, 'checkout');
      v_status := 'in_stock';
    else
      if v_variant.stock_status = 'out_of_stock' then
        raise exception 'OUT_OF_STOCK:%', v_variant.product_name;
      end if;
      v_has_external := true;
      v_status := v_variant.stock_status;
    end if;

    select url into v_image from product_images
     where product_id = v_variant.product_id order by sort_order limit 1;

    insert into order_items (
      order_id, variant_id, product_id, product_name, product_slug, image_url, sku, size, color,
      supplier_type, stock_status, unit_price, unit_cost, quantity
    ) values (
      v_order_id, v_variant.id, v_variant.product_id, v_variant.product_name, v_variant.product_slug, v_image,
      v_variant.sku, v_variant.size, v_variant.color_name, v_variant.supplier_type, v_status,
      v_variant.retail_price, v_variant.supplier_cost, v_qty
    );

    v_subtotal := v_subtotal + v_variant.retail_price * v_qty;
  end loop;

  update orders
     set subtotal = v_subtotal, total = v_subtotal + p_shipping_fee, has_external_items = v_has_external
   where id = v_order_id;

  insert into payments (order_id, provider, amount)
  values (v_order_id, case when p_payment_method = 'mtn' then 'mtn_momo' else 'airtel_money' end, v_subtotal + p_shipping_fee);

  insert into order_status_history (order_id, status, note, changed_by)
  values (v_order_id, 'pending_payment', 'Order placed', 'customer');

  return query select v_order_id, v_number, v_key, v_subtotal + p_shipping_fee;
end;
$$;

-- set_order_status: moves an order along and keeps stock honest.
-- Cancelling or refunding puts stocked items back on the shelf (once).
create or replace function set_order_status(
  p_order_id uuid,
  p_status text,
  p_actor text,
  p_note text default null
) returns void
language plpgsql as $$
declare
  v_current text;
  v_item record;
begin
  select status into v_current from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_current = p_status then
    return;
  end if;
  if v_current in ('cancelled', 'refunded') and not (v_current = 'cancelled' and p_status = 'refunded') then
    raise exception 'ORDER_CLOSED';
  end if;

  if p_status in ('cancelled', 'refunded') and v_current not in ('cancelled', 'refunded') then
    for v_item in
      select oi.variant_id, oi.quantity from order_items oi
       where oi.order_id = p_order_id and oi.supplier_type = 'MELUDELU_STOCK' and oi.variant_id is not null
    loop
      update inventory set quantity_on_hand = quantity_on_hand + v_item.quantity where variant_id = v_item.variant_id;
      insert into inventory_movements (variant_id, change, reason, order_id, actor, note)
      values (v_item.variant_id, v_item.quantity, 'cancellation', p_order_id, p_actor, p_note);
    end loop;
  end if;

  update orders set status = p_status where id = p_order_id;

  if p_status = 'paid' then
    update orders set payment_status = 'confirmed' where id = p_order_id;
    update payments set status = 'confirmed', confirmed_by = p_actor where order_id = p_order_id;
  elsif p_status = 'refunded' then
    update orders set payment_status = 'refunded' where id = p_order_id;
    update payments set status = 'refunded' where order_id = p_order_id;
  end if;

  insert into order_status_history (order_id, status, note, changed_by)
  values (p_order_id, p_status, p_note, p_actor);
end;
$$;

-- adjust_stock: every manual stock change goes through here so the movement log stays complete.
create or replace function adjust_stock(
  p_variant_id uuid,
  p_change int,
  p_reason text,
  p_actor text,
  p_note text default null
) returns int
language plpgsql as $$
declare
  v_new int;
begin
  insert into inventory (variant_id, quantity_on_hand) values (p_variant_id, 0)
  on conflict (variant_id) do nothing;

  update inventory set quantity_on_hand = quantity_on_hand + p_change
   where variant_id = p_variant_id
  returning quantity_on_hand into v_new;

  if v_new < 0 then
    raise exception 'NEGATIVE_STOCK';
  end if;

  insert into inventory_movements (variant_id, change, reason, actor, note)
  values (p_variant_id, p_change, p_reason, p_actor, p_note);

  return v_new;
end;
$$;
