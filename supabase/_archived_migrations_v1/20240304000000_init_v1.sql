-- 1. Enums
CREATE TYPE user_role AS ENUM ('admin', 'yoledet', 'cook', 'deliverer');
CREATE TYPE meal_status AS ENUM ('open', 'cooking', 'ready', 'delivering', 'delivered', 'confirmed');

-- 2. Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'yoledet',
    is_approved BOOLEAN NOT NULL DEFAULT false,
    display_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Meals Table
CREATE TABLE public.meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    yoledet_id UUID REFERENCES public.profiles(id) NOT NULL,
    cook_id UUID REFERENCES public.profiles(id),
    deliverer_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    status meal_status NOT NULL DEFAULT 'open',
    address TEXT NOT NULL,
    notes TEXT,
    time_window TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Meal Events Table (for updates)
CREATE TABLE public.meal_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    message_he TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meals_updated_at
BEFORE UPDATE ON public.meals
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 6. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Admin can see all, users can see/edit their own
CREATE POLICY "Profiles are viewable by everyone approved" ON public.profiles
    FOR SELECT USING (is_approved = true OR auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Meals policies
-- Yoledet can see her own meals
CREATE POLICY "Yoledet can see her meals" ON public.meals
    FOR SELECT USING (yoledet_id = auth.uid());

-- Everyone approved can see open meals
CREATE POLICY "Approved can see open meals" ON public.meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.is_approved = true
        )
        AND status = 'open'
    );

-- Assigned cook/deliverer can see their meals
CREATE POLICY "Cook/Deliverer can see assigned meals" ON public.meals
    FOR SELECT USING (cook_id = auth.uid() OR deliverer_id = auth.uid());

-- Admin can read all meals (mutations via RPC only)
CREATE POLICY "Admin full access on meals" ON public.meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'admin'
        )
    );

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_approved_user(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_approved = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Meal Events policies
CREATE POLICY "Viewable by related parties" ON public.meal_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meals m
            WHERE m.id = meal_id 
            AND (
                m.yoledet_id = auth.uid()
                OR m.cook_id = auth.uid()
                OR m.deliverer_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role = 'admin'
                )
            )
        )
    );
