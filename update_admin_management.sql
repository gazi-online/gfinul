-- Admin management system schema + policies
-- Apply this in Supabase SQL Editor before using the full admin console.

-- 1. Product inventory fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_stock_check'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_stock_check CHECK (stock >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products(is_active, stock);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(stock) WHERE stock <= 5;

-- 2. User access flags
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS role text;

-- 3. Services active flag to align with app queries
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_services_active_created_at
ON public.services(is_active, created_at DESC);

-- 4. Order status support
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'processing', 'completed', 'delivered', 'cancelled'));

-- 5. Shared timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_timestamp ON public.products;
CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- 6. Admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false)
  FROM public.users
  WHERE id = auth.uid();
$$;

-- 7. Admin RLS policies
DROP POLICY IF EXISTS "Admin Read All Users" ON public.users;
DROP POLICY IF EXISTS "Admin Update All Users" ON public.users;
DROP POLICY IF EXISTS "Admin Manage Products" ON public.products;
DROP POLICY IF EXISTS "Admin Manage All Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Read All Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Manage All Requests" ON public.service_requests;

CREATE POLICY "Admin Read All Users"
ON public.users FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin Update All Users"
ON public.users FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Manage Products"
ON public.products FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Manage All Orders"
ON public.orders FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Read All Order Items"
ON public.order_items FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin Manage All Requests"
ON public.service_requests FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. Inventory trigger: reduce stock when order items are created
CREATE OR REPLACE FUNCTION public.handle_order_item_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT stock
  INTO current_stock
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF current_stock IS NULL THEN
    RETURN NEW;
  END IF;

  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  UPDATE public.products
  SET
    stock = current_stock - NEW.quantity,
    is_active = CASE WHEN current_stock - NEW.quantity <= 0 THEN false ELSE is_active END,
    updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reduce_product_stock ON public.order_items;
CREATE TRIGGER trg_reduce_product_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_stock();

-- 9. Helpful seed update examples
-- UPDATE public.users SET is_admin = true WHERE email = 'your.email@example.com';
-- UPDATE public.products SET stock = 25, is_active = true WHERE name = 'Citizen Smart Lock';
