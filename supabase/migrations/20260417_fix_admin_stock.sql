alter table if exists public.products
  add column if not exists stock integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_stock_check'
  ) then
    alter table public.products
      add constraint products_stock_check check (stock >= 0);
  end if;
end $$;

create index if not exists idx_products_active_stock
  on public.products (is_active, stock);

create index if not exists idx_products_low_stock
  on public.products (stock)
  where stock <= 5;

alter table if exists public.users
  add column if not exists is_admin boolean not null default false;

create or replace function public.handle_update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_products_timestamp on public.products;
create trigger update_products_timestamp
before update on public.products
for each row execute function public.handle_update_timestamp();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(is_admin, false)
  from public.users
  where id = auth.uid();
$$;

drop policy if exists "Admin Manage Products" on public.products;
create policy "Admin Manage Products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());
