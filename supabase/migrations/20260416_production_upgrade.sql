alter table if exists public.products
  add column if not exists description text,
  add column if not exists rating numeric(2,1) default 4.6,
  add column if not exists review_count integer default 0,
  add column if not exists stock integer default 0,
  add column if not exists warranty_months integer default 12,
  add column if not exists is_active boolean default true;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'rating'
  ) then
    execute 'alter table public.products drop constraint if exists products_rating_check';
    execute 'alter table public.products add constraint products_rating_check check (rating between 0 and 5)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'stock'
  ) then
    execute 'alter table public.products drop constraint if exists products_stock_check';
    execute 'alter table public.products add constraint products_stock_check check (stock >= 0)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'warranty_months'
  ) then
    execute 'alter table public.products drop constraint if exists products_warranty_months_check';
    execute 'alter table public.products add constraint products_warranty_months_check check (warranty_months >= 0)';
  end if;
end $$;

create index if not exists idx_products_active_category_created_at
  on public.products (category, created_at desc)
  where is_active = true;

create unique index if not exists idx_cart_user_product
  on public.cart (user_id, product_id);

create index if not exists idx_orders_user_created_at
  on public.orders (user_id, created_at desc);

create index if not exists idx_service_requests_user_status_created_at
  on public.service_requests (user_id, status, created_at desc);

create index if not exists idx_warranties_user_status_end_date
  on public.warranties (user_id, status, warranty_end_date desc);

create or replace function public.process_checkout(
  p_user_id uuid,
  p_warranty_months integer default 12
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_blocked_product text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to checkout.';
  end if;

  if auth.uid() <> p_user_id then
    raise exception 'You can only checkout your own cart.';
  end if;

  if not exists (
    select 1
    from public.cart
    where user_id = p_user_id
  ) then
    raise exception 'Your cart is empty.';
  end if;

  select p.name
    into v_blocked_product
  from public.cart c
  join public.products p on p.id = c.product_id
  where c.user_id = p_user_id
    and (
      coalesce(p.is_active, true) = false
      or coalesce(p.stock, 0) < c.quantity
    )
  for update of c, p
  limit 1;

  if v_blocked_product is not null then
    raise exception '% is out of stock or unavailable.', v_blocked_product;
  end if;

  insert into public.orders (user_id, total, status)
  select
    p_user_id,
    coalesce(sum(c.quantity * p.price), 0),
    'pending'
  from public.cart c
  join public.products p on p.id = c.product_id
  where c.user_id = p_user_id
  returning * into v_order;

  insert into public.order_items (order_id, product_id, quantity, price)
  select
    v_order.id,
    c.product_id,
    c.quantity,
    p.price
  from public.cart c
  join public.products p on p.id = c.product_id
  where c.user_id = p_user_id;

  update public.products p
  set stock = greatest(0, coalesce(p.stock, 0) - stock_delta.total_quantity)
  from (
    select product_id, sum(quantity)::integer as total_quantity
    from public.cart
    where user_id = p_user_id
    group by product_id
  ) as stock_delta
  where p.id = stock_delta.product_id;

  insert into public.warranties (
    user_id,
    product_id,
    order_id,
    warranty_start_date,
    warranty_end_date,
    status
  )
  select
    p_user_id,
    c.product_id,
    v_order.id,
    current_date,
    current_date + make_interval(months => coalesce(nullif(p.warranty_months, 0), nullif(p_warranty_months, 0), 12)),
    'active'
  from public.cart c
  join public.products p on p.id = c.product_id
  where c.user_id = p_user_id;

  delete from public.cart
  where user_id = p_user_id;

  return v_order;
end;
$$;

grant execute on function public.process_checkout(uuid, integer) to authenticated;
