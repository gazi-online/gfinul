-- 1. Add `is_admin` column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create a secure function to check admin status (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_admin, false) FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Add Policy for Admins to Read All Users
CREATE POLICY "Admin Read All Users" ON public.users FOR SELECT USING (public.is_admin());

-- 4. Add Policy for Admins to Read and Update All Orders
CREATE POLICY "Admin Manage All Orders" ON public.orders FOR ALL USING (public.is_admin());

-- 5. Add Policy for Admins to Read All Order Items
CREATE POLICY "Admin Read All Order Items" ON public.order_items FOR SELECT USING (public.is_admin());

-- To grant someone admin access, run this in Supabase SQL editor:
-- UPDATE public.users SET is_admin = true WHERE email = 'your.email@example.com';
