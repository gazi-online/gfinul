-- Checkout + order RLS fix
-- Run this in Supabase SQL Editor to allow customer checkout and use the secure RPC flow.

-- 1. User-facing order policies for fallback-safe checkout
DROP POLICY IF EXISTS "User Insert Own Orders" ON public.orders;
CREATE POLICY "User Insert Own Orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User Insert Own Order Items" ON public.order_items;
CREATE POLICY "User Insert Own Order Items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);

-- 2. Secure checkout RPC so the app can place orders without hitting client-side RLS issues
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_user_id uuid,
  p_warranty_months integer DEFAULT 12
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_cart_count integer := 0;
  v_total numeric(12,2) := 0;
  v_has_stock boolean := false;
  v_has_is_active boolean := false;
  v_has_stock_trigger boolean := false;
  v_item record;
BEGIN
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to place an order.';
  END IF;

  IF v_auth_user <> p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only place orders for your own account.';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(c.quantity * COALESCE(p.price, 0)), 0)
  INTO v_cart_count, v_total
  FROM public.cart c
  JOIN public.products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  IF v_cart_count = 0 THEN
    RAISE EXCEPTION 'Your cart is empty.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'stock'
  )
  INTO v_has_stock;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'is_active'
  )
  INTO v_has_is_active;

  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.order_items'::regclass
      AND tgname = 'trg_reduce_product_stock'
      AND NOT tgisinternal
  )
  INTO v_has_stock_trigger;

  IF v_has_stock AND v_has_is_active THEN
    FOR v_item IN
      SELECT c.product_id, c.quantity, p.name, p.stock, p.is_active
      FROM public.cart c
      JOIN public.products p ON p.id = c.product_id
      WHERE c.user_id = p_user_id
      FOR UPDATE OF p
    LOOP
      IF v_item.is_active = false OR COALESCE(v_item.stock, 0) <= 0 THEN
        RAISE EXCEPTION '% is out of stock or unavailable.', COALESCE(v_item.name, 'This product');
      END IF;

      IF COALESCE(v_item.stock, 0) < v_item.quantity THEN
        RAISE EXCEPTION 'Only % unit(s) left for %.', COALESCE(v_item.stock, 0), COALESCE(v_item.name, 'this product');
      END IF;
    END LOOP;
  ELSIF v_has_stock THEN
    FOR v_item IN
      SELECT c.product_id, c.quantity, p.name, p.stock
      FROM public.cart c
      JOIN public.products p ON p.id = c.product_id
      WHERE c.user_id = p_user_id
      FOR UPDATE OF p
    LOOP
      IF COALESCE(v_item.stock, 0) <= 0 THEN
        RAISE EXCEPTION '% is out of stock.', COALESCE(v_item.name, 'This product');
      END IF;

      IF COALESCE(v_item.stock, 0) < v_item.quantity THEN
        RAISE EXCEPTION 'Only % unit(s) left for %.', COALESCE(v_item.stock, 0), COALESCE(v_item.name, 'this product');
      END IF;
    END LOOP;
  ELSIF v_has_is_active THEN
    FOR v_item IN
      SELECT c.product_id, c.quantity, p.name, p.is_active
      FROM public.cart c
      JOIN public.products p ON p.id = c.product_id
      WHERE c.user_id = p_user_id
      FOR UPDATE OF p
    LOOP
      IF v_item.is_active = false THEN
        RAISE EXCEPTION '% is unavailable right now.', COALESCE(v_item.name, 'This product');
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.orders (user_id, total, status)
  VALUES (p_user_id, v_total, 'pending')
  RETURNING *
  INTO v_order;

  INSERT INTO public.order_items (order_id, product_id, quantity, price)
  SELECT
    v_order.id,
    c.product_id,
    c.quantity,
    COALESCE(p.price, 0)
  FROM public.cart c
  JOIN public.products p ON p.id = c.product_id
  WHERE c.user_id = p_user_id;

  IF v_has_stock AND NOT v_has_stock_trigger THEN
    UPDATE public.products p
    SET stock = GREATEST(0, COALESCE(p.stock, 0) - c.quantity)
    FROM public.cart c
    WHERE c.user_id = p_user_id
      AND c.product_id = p.id;

    IF v_has_is_active THEN
      UPDATE public.products
      SET is_active = false
      WHERE COALESCE(stock, 0) <= 0;
    END IF;
  END IF;

  DELETE FROM public.cart
  WHERE user_id = p_user_id;

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_checkout(uuid, integer) TO authenticated;
