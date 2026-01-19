-- Create enum types for statuses
CREATE TYPE public.order_status AS ENUM ('new', 'preparing', 'ready', 'served', 'collected', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('dine-in', 'takeaway');
CREATE TYPE public.table_status AS ENUM ('available', 'occupied');
CREATE TYPE public.item_status AS ENUM ('pending', 'preparing', 'ready');
CREATE TYPE public.user_role AS ENUM ('admin', 'waiter', 'cashier', 'kitchen');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'waiter',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  preparation_time INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_item_addons table
CREATE TABLE public.menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tables (restaurant tables)
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT NOT NULL UNIQUE,
  floor TEXT NOT NULL DEFAULT 'Ground',
  capacity INTEGER NOT NULL DEFAULT 4,
  status table_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  table_number TEXT,
  order_type order_type NOT NULL DEFAULT 'dine-in',
  status order_status NOT NULL DEFAULT 'new',
  customer_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status item_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  addons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for categories (viewable by all authenticated, editable by admin)
CREATE POLICY "Categories are viewable by authenticated users" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Categories are insertable by authenticated users" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Categories are updatable by authenticated users" ON public.categories
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for menu_items
CREATE POLICY "Menu items are viewable by authenticated users" ON public.menu_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Menu items are insertable by authenticated users" ON public.menu_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Menu items are updatable by authenticated users" ON public.menu_items
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for menu_item_addons
CREATE POLICY "Addons are viewable by authenticated users" ON public.menu_item_addons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Addons are insertable by authenticated users" ON public.menu_item_addons
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for restaurant_tables
CREATE POLICY "Tables are viewable by authenticated users" ON public.restaurant_tables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tables are insertable by authenticated users" ON public.restaurant_tables
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Tables are updatable by authenticated users" ON public.restaurant_tables
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for orders
CREATE POLICY "Orders are viewable by authenticated users" ON public.orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Orders are insertable by authenticated users" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Orders are updatable by authenticated users" ON public.orders
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for order_items
CREATE POLICY "Order items are viewable by authenticated users" ON public.order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Order items are insertable by authenticated users" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Order items are updatable by authenticated users" ON public.order_items
  FOR UPDATE TO authenticated USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'waiter')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);