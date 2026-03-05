-- Phase 6 RPC — take_meal_atomic (cuisinière / livreuse prennent un repas)

CREATE OR REPLACE FUNCTION public.take_meal_atomic(p_meal_id uuid)
RETURNS SETOF public.meals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid;
  v_role  text;
  v_ok    boolean;
  v_meal  public.meals;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: authentication required';
  END IF;

  -- Vérifier approbation + rôle
  SELECT role INTO v_role
  FROM public.users
  WHERE id = v_uid AND approved = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_NOT_APPROVED: user not approved or does not exist';
  END IF;

  IF v_role NOT IN ('cook', 'driver', 'both', 'admin') THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: role % cannot take meals', v_role;
  END IF;

  -- Cuisinière (cook / both / admin) : open → cook_assigned
  IF v_role IN ('cook', 'both', 'admin') THEN
    UPDATE public.meals
    SET cook_id    = v_uid,
        status     = 'cook_assigned',
        updated_at = now()
    WHERE id = p_meal_id
      AND status = 'open'
      AND cook_id IS NULL
    RETURNING * INTO v_meal;

    IF FOUND THEN
      RETURN NEXT v_meal;
      RETURN;
    END IF;

    -- Si admin essaie en tant que cook mais échoue → tenter driver aussi
    IF v_role != 'admin' THEN
      RAISE EXCEPTION 'ERR_CONFLICT: meal % is no longer available for cooking', p_meal_id;
    END IF;
  END IF;

  -- Livreuse (driver / both / admin) : ready → driver_assigned
  IF v_role IN ('driver', 'both', 'admin') THEN
    UPDATE public.meals
    SET driver_id  = v_uid,
        status     = 'driver_assigned',
        updated_at = now()
    WHERE id = p_meal_id
      AND status IN ('cook_assigned', 'ready')
      AND driver_id IS NULL
    RETURNING * INTO v_meal;

    IF FOUND THEN
      RETURN NEXT v_meal;
      RETURN;
    END IF;

    RAISE EXCEPTION 'ERR_CONFLICT: meal % is no longer available for delivery', p_meal_id;
  END IF;

  RAISE EXCEPTION 'ERR_INVALID_STATE: no valid transition available for role %', v_role;
END;
$$;

