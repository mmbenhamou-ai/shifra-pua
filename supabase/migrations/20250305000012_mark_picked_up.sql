-- Phase 6 RPC — mark_picked_up (driver_assigned → picked_up)

CREATE OR REPLACE FUNCTION public.mark_picked_up(p_meal_id uuid)
RETURNS SETOF public.meals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid;
  v_meal public.meals;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: authentication required';
  END IF;

  UPDATE public.meals
  SET status     = 'picked_up',
      updated_at = now()
  WHERE id = p_meal_id
    AND driver_id = v_uid
    AND status = 'driver_assigned'
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: cannot mark meal % picked_up', p_meal_id;
  END IF;

  RETURN NEXT v_meal;
END;
$$;

