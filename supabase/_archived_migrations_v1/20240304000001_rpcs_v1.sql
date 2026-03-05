-- RPCs for atomic state transitions (Anti-conflict)

-- 1. Take Cooking
CREATE OR REPLACE FUNCTION take_cooking(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    user_role user_role;
    user_is_approved BOOLEAN;
    is_user_admin BOOLEAN;
BEGIN
    -- Check caller profile
    SELECT role, is_approved
    INTO user_role, user_is_approved
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    is_user_admin := is_admin(auth.uid());

    -- Only approved cooks or admins can take cooking
    IF NOT is_user_admin THEN
        IF user_role <> 'cook' OR user_is_approved IS NOT TRUE THEN
            RAISE EXCEPTION 'Only approved cooks can take a meal for cooking';
        END IF;
    END IF;

    -- Optimistic concurrency control
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

    INSERT INTO public.meal_events (meal_id, type, message_he)
    VALUES (meal_record.id, 'take_cooking', 'הארוחה נתפסה לבישול');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Mark Ready
CREATE OR REPLACE FUNCTION mark_ready(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    user_role user_role;
    user_is_approved BOOLEAN;
    is_user_admin BOOLEAN;
BEGIN
    -- Check caller profile
    SELECT role, is_approved
    INTO user_role, user_is_approved
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    is_user_admin := is_admin(auth.uid());

    -- For non-admin: must be approved cook and assigned to the meal
    IF NOT is_user_admin THEN
        IF user_role <> 'cook' OR user_is_approved IS NOT TRUE THEN
            RAISE EXCEPTION 'Only approved cooks can mark a meal as ready';
        END IF;
    END IF;

    UPDATE public.meals
    SET status = 'ready'
    WHERE id = meal_id
      AND status = 'cooking'
      AND (cook_id = auth.uid() OR is_user_admin)
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only the assigned cook or an admin can mark as ready';
    END IF;

    INSERT INTO public.meal_events (meal_id, type, message_he)
    VALUES (meal_record.id, 'mark_ready', 'הארוחה מוכנה לאיסוף');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Take Delivery
CREATE OR REPLACE FUNCTION take_delivery(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    is_user_admin BOOLEAN;
BEGIN
    is_user_admin := is_admin(auth.uid());

    -- Deliverer must be approved unless admin
    IF NOT is_user_admin THEN
        PERFORM 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'deliverer'
          AND p.is_approved = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Only approved deliverers can take delivery';
        END IF;
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

    INSERT INTO public.meal_events (meal_id, type, message_he)
    VALUES (meal_record.id, 'take_delivery', 'הארוחה נאספה למשלוח');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mark Delivered
CREATE OR REPLACE FUNCTION mark_delivered(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    is_user_admin BOOLEAN;
BEGIN
    is_user_admin := is_admin(auth.uid());

    UPDATE public.meals
    SET status = 'delivered'
    WHERE id = meal_id
      AND status = 'delivering'
      AND (deliverer_id = auth.uid() OR is_user_admin)
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only the assigned deliverer or an admin can mark as delivered';
    END IF;

    INSERT INTO public.meal_events (meal_id, type, message_he)
    VALUES (meal_record.id, 'mark_delivered', 'הארוחה נמסרה ליעדה');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Confirm Received (by Yoledet)
CREATE OR REPLACE FUNCTION confirm_received(meal_id UUID)
RETURNS VOID AS $$
DECLARE
    meal_record RECORD;
    is_user_admin BOOLEAN;
BEGIN
    is_user_admin := is_admin(auth.uid());

    -- Yoledet must be approved unless admin
    IF NOT is_user_admin THEN
        PERFORM 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'yoledet'
          AND p.is_approved = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Only an approved yoledet can confirm receipt';
        END IF;
    END IF;

    UPDATE public.meals
    SET status = 'confirmed'
    WHERE id = meal_id
      AND status = 'delivered'
      AND (yoledet_id = auth.uid() OR is_user_admin)
    RETURNING * INTO meal_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only the yoledet or an admin can confirm receipt';
    END IF;

    INSERT INTO public.meal_events (meal_id, type, message_he)
    VALUES (meal_record.id, 'confirm_received', 'נתקבל אישור מהיולדת');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
