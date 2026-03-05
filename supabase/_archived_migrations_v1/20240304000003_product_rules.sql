-- 1. Create Enums
CREATE TYPE service_type AS ENUM ('breakfast', 'shabbat');
CREATE TYPE breakfast_mode AS ENUM ('central_kitchen', 'volunteers_cook');

-- 2. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    breakfast_mode breakfast_mode NOT NULL DEFAULT 'central_kitchen',
    kitchen_pickup_location TEXT NOT NULL DEFAULT 'מטבח העמותה',
    CONSTRAINT app_settings_single_row CHECK (id = 1)
);

-- Initialize settings
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can update app_settings" ON public.app_settings FOR UPDATE USING (is_admin(auth.uid()));

-- 3. Breakfast Menu Table
CREATE TABLE IF NOT EXISTS public.breakfast_menu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_he TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on breakfast_menu
ALTER TABLE public.breakfast_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read breakfast_menu" ON public.breakfast_menu FOR SELECT USING (true);
CREATE POLICY "Only admins can manage breakfast_menu" ON public.breakfast_menu FOR ALL USING (is_admin(auth.uid()));

-- 4. Update Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shabbat_enabled BOOLEAN DEFAULT false;

-- 5. Update Meals
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS service_type service_type DEFAULT 'breakfast',
ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES public.breakfast_menu(id),
ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- 6. Update Meal Events
ALTER TABLE public.meal_events
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id);

-- 7. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_meals_service_type ON public.meals(service_type);
CREATE INDEX IF NOT EXISTS idx_meals_status ON public.meals(status);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_yoledet_id ON public.meals(yoledet_id);
CREATE INDEX IF NOT EXISTS idx_meals_cook_id ON public.meals(cook_id);
CREATE INDEX IF NOT EXISTS idx_meals_deliverer_id ON public.meals(deliverer_id);
CREATE INDEX IF NOT EXISTS idx_meal_events_meal_id ON public.meal_events(meal_id);
CREATE INDEX IF NOT EXISTS idx_breakfast_menu_is_active_sort ON public.breakfast_menu(is_active, sort_order);

-- 8. Business Logic Enforcement (RPC updates)

CREATE OR REPLACE FUNCTION take_cooking(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    user_role user_role;
    user_is_approved BOOLEAN;
    current_mode breakfast_mode;
BEGIN
    -- Load current user profile
    SELECT role, is_approved
    INTO user_role, user_is_approved
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Only approved cooks or admins can take cooking
    IF NOT is_admin(auth.uid()) THEN
        IF user_role <> 'cook' OR user_is_approved IS NOT TRUE THEN
            RAISE EXCEPTION 'Only approved cooks can take a meal for cooking';
        END IF;
    END IF;
    -- Get the meal
    SELECT * INTO meal_record FROM public.meals WHERE id = meal_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found';
    END IF;

    -- Only shabbat meals can be cooked by volunteers
    IF meal_record.service_type <> 'shabbat' THEN
        RAISE EXCEPTION 'Cooking is allowed only for shabbat meals';
    END IF;

    IF meal_record.status <> 'open' OR meal_record.cook_id IS NOT NULL THEN
        RAISE EXCEPTION 'Meal already taken or not open for cooking';
    END IF;

    -- Update the meal and ensure exactly one row is affected
    UPDATE public.meals
    SET cook_id = auth.uid(),
        status = 'cooking'
    WHERE id = meal_id
      AND status = 'open'
      AND cook_id IS NULL
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal already taken or not open for cooking';
    END IF;

    -- Insert event with actor_id
    INSERT INTO public.meal_events (meal_id, actor_id, type, message_he)
    VALUES (meal_record.id, auth.uid(), 'take_cooking', 'הארוחה נתפסה לבישול');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update mark_ready to allow admin to mark breakfast ready
CREATE OR REPLACE FUNCTION mark_ready(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    is_user_admin BOOLEAN;
    user_role user_role;
    user_is_approved BOOLEAN;
BEGIN
    -- Load current user profile
    SELECT role, is_approved
    INTO user_role, user_is_approved
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Admin can always act; non-admin must be approved cook for shabbat
    is_user_admin := is_admin(auth.uid());

    -- Get the meal
    SELECT * INTO meal_record FROM public.meals WHERE id = meal_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found';
    END IF;

    -- Validate state
    IF meal_record.status NOT IN ('open', 'cooking') THEN
        RAISE EXCEPTION 'Meal not in a state to be marked ready';
    END IF;

    -- Breakfast: only admin can mark ready (kitchen)
    IF meal_record.service_type = 'breakfast' THEN
        IF NOT is_user_admin THEN
            RAISE EXCEPTION 'Only an admin can mark breakfast meals as ready';
        END IF;
    ELSE
        -- Shabbat: assigned cook or admin
        IF NOT is_user_admin THEN
            IF user_role <> 'cook' OR user_is_approved IS NOT TRUE THEN
                RAISE EXCEPTION 'Only approved cooks can mark shabbat meals as ready';
            END IF;

            IF meal_record.cook_id <> auth.uid() THEN
                RAISE EXCEPTION 'Only the assigned cook can mark this meal as ready';
            END IF;
        END IF;
    END IF;

    -- Update the meal and ensure exactly one row is affected
    UPDATE public.meals
    SET status = 'ready'
    WHERE id = meal_id
      AND status IN ('open', 'cooking')
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not in a state to be marked ready';
    END IF;

    INSERT INTO public.meal_events (meal_id, actor_id, type, message_he)
    VALUES (meal_record.id, auth.uid(), 'mark_ready', 'הארוחה מוכנה לאיסוף');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update take_delivery to record actor_id
CREATE OR REPLACE FUNCTION take_delivery(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
BEGIN
    PERFORM 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_approved = true
      AND p.role = 'deliverer';

    IF NOT FOUND AND NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only approved deliverers or admins can take delivery';
    END IF;

    UPDATE public.meals
    SET deliverer_id = auth.uid(),
        status = 'delivering'
    WHERE id = meal_id
      AND status = 'ready'
      AND deliverer_id IS NULL
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal already picked up or not ready';
    END IF;

    INSERT INTO public.meal_events (meal_id, actor_id, type, message_he)
    VALUES (meal_record.id, auth.uid(), 'take_delivery', 'הארוחה נאספה למשלוח');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update mark_delivered to record actor_id
CREATE OR REPLACE FUNCTION mark_delivered(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
BEGIN
    PERFORM 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_approved = true
      AND p.role = 'deliverer';

    IF NOT FOUND AND NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only approved deliverers or admins can mark as delivered';
    END IF;

    UPDATE public.meals
    SET status = 'delivered'
    WHERE id = meal_id
      AND status = 'delivering'
      AND (deliverer_id = auth.uid() OR is_admin(auth.uid()))
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only the assigned deliverer or an admin can mark as delivered';
    END IF;

    INSERT INTO public.meal_events (meal_id, actor_id, type, message_he)
    VALUES (meal_record.id, auth.uid(), 'mark_delivered', 'הארוחה נמסרה ליעדה');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update confirm_received to record actor_id
CREATE OR REPLACE FUNCTION confirm_received(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
BEGIN
    PERFORM 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_approved = true
      AND p.role = 'yoledet';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only an approved yoledet can confirm receipt';
    END IF;

    UPDATE public.meals
    SET status = 'confirmed'
    WHERE id = meal_id
      AND status = 'delivered'
      AND yoledet_id = auth.uid()
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only the yoledet can confirm receipt';
    END IF;

    INSERT INTO public.meal_events (meal_id, actor_id, type, message_he)
    VALUES (meal_record.id, auth.uid(), 'confirm_received', 'נתקבל אישור מהיולדת');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RLS adjustments for meals to match product rules

-- Yoledet: can see only her own meals.
-- For shabbat meals, she must be explicitly enabled in profiles.shabbat_enabled.
ALTER POLICY "Yoledet can see her meals" ON public.meals
USING (
    yoledet_id = auth.uid()
    AND (
        service_type = 'breakfast'
        OR (
            service_type = 'shabbat'
            AND EXISTS (
                SELECT 1
                FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.shabbat_enabled = true
            )
        )
    )
);

-- Yoledet: can insert her own breakfast meals directly
CREATE POLICY "Yoledet can insert breakfast" ON public.meals
FOR INSERT
WITH CHECK (
    service_type = 'breakfast'
    AND yoledet_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'yoledet'
          AND p.is_approved = true
    )
);

-- Replace generic cook/deliverer policy with role-specific ones.
DROP POLICY IF EXISTS "Cook/Deliverer can see assigned meals" ON public.meals;

-- Cook: can see only shabbat meals that are open or assigned to them.
CREATE POLICY "Cook can see shabbat meals" ON public.meals
FOR SELECT USING (
    service_type = 'shabbat'
    AND (
        status = 'open'
        OR cook_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'cook'
          AND p.is_approved = true
    )
);

-- Deliverer: can see meals that are ready or assigned to them (breakfast + shabbat).
CREATE POLICY "Deliverer can see meals" ON public.meals
FOR SELECT USING (
    (
        status = 'ready'
        OR deliverer_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'deliverer'
          AND p.is_approved = true
    )
);

-- Restrict generic "Approved can see open meals" to shabbat community members only.
ALTER POLICY "Approved can see open meals" ON public.meals
USING (
    status = 'open'
    AND service_type = 'shabbat'
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_approved = true
          AND p.shabbat_enabled = true
    )
);

-- Admin: can select everything; all mutations must go through RPCs.
ALTER POLICY "Admin full access on meals" ON public.meals
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
    )
);

-- Block any direct INSERT on meals (even for admin)
CREATE POLICY "Block direct insert on meals" ON public.meals
FOR INSERT
WITH CHECK (false);

-- Block any direct UPDATE on meals (even for admin)
CREATE POLICY "Block direct update on meals" ON public.meals
FOR UPDATE
USING (false)
WITH CHECK (false);

-- Block any direct DELETE on meals (even for admin)
CREATE POLICY "Block direct delete on meals" ON public.meals
FOR DELETE
USING (false);
