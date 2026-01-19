-- Add DELETE policy for categories (admin only via RLS, but checking role in app)
CREATE POLICY "Categories are deletable by authenticated users"
ON public.categories
FOR DELETE
TO authenticated
USING (true);

-- Add DELETE policy for menu_items (admin only via RLS, but checking role in app)
CREATE POLICY "Menu items are deletable by authenticated users"
ON public.menu_items
FOR DELETE
TO authenticated
USING (true);

-- Add UPDATE policy for menu_item_addons
CREATE POLICY "Addons are updatable by authenticated users"
ON public.menu_item_addons
FOR UPDATE
TO authenticated
USING (true);

-- Add DELETE policy for menu_item_addons
CREATE POLICY "Addons are deletable by authenticated users"
ON public.menu_item_addons
FOR DELETE
TO authenticated
USING (true);