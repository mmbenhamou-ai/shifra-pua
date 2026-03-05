-- Phase 6 RPC — driver_release_meal (libération par la livreuse)

CREATE OR REPLACE FUNCTION public.driver_release_meal(p_meal_id uuid)
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
  SET driver_id  = NULL,
      status     = 'ready',
      updated_at = now()
  WHERE id = p_meal_id
    AND driver_id = v_uid
    AND status IN ('driver_assigned', 'picked_up')
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: cannot release meal % (wrong status or not your meal)', p_meal_id;
  END IF;

  RETURN NEXT v_meal;
END;
$$;

