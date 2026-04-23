-- Civic Atelier: Complete Supabase Database Schema
-- Last Updated: 2026-04-02

-- 1. Enable Extensions
-- uuid-ossp is commonly used for gen_random_uuid in older PG versions, 
-- but PG 13+ has gen_random_uuid() in core. We'll enable it just to be safe.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. USERS (Profiles Linked to Auth) ──────────────────────────────────
-- Standard practice: auth.users manages login, public.users manages profiles.
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ── 3. PRODUCTS (Shop Catalog) ──────────────────────────────────────────
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  image text,
  images text[] DEFAULT '{}'::text[],
  category text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for category filtering (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- ── 4. CART (User Shopping Sessions) ────────────────────────────────────
CREATE TABLE public.cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  -- Ensure a user only has one entry per product in their cart
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);

-- ── 5. ORDERS (Transaction Headers) ─────────────────────────────────────
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- ── 6. ORDER ITEMS (Snapshot of Purchase) ──────────────────────────────
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  -- We snapshot the price here so future changes to products don't affect old orders
  price numeric(12,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ── 7. SERVICES (Government/Civic Catalog) ───────────────────────────────
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ── 8. SERVICE REQUESTS (Citizen Trackers) ──────────────────────────────
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);

-- ── 9. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- ── 10. POLICIES ────────────────────────────────────────────────────────

-- Products & Services are viewable by anyone (even unauthenticated)
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);

-- Profiles: Users see/edit only their own data
CREATE POLICY "User Read Own Profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "User Update Own Profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Cart: Full control for the owner
CREATE POLICY "User Manage Own Cart" ON public.cart FOR ALL USING (auth.uid() = user_id);

-- Orders: Owner can see their orders and order items
CREATE POLICY "User Read Own Orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Insert Own Orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User Read Own Order Items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);
CREATE POLICY "User Insert Own Order Items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Service Requests: Owner can view and create
CREATE POLICY "User Manage Own Requests" ON public.service_requests FOR ALL USING (auth.uid() = user_id);

-- ── 11. AUTOMATION (Triggers) ──────────────────────────────────────────

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
