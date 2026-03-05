-- Phase 6 RPC — cook_release_meal / driver_release_meal (relais des repas)

CREATE OR REPLACE FUNCTION public.cook_release_meal(p_meal_id uuid)
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
  SET cook_id    = NULL,
      status     = 'open',
      updated_at = now()
  WHERE id = p_meal_id
    AND cook_id = v_uid
    AND status = 'cook_assigned'
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: cannot release meal % (wrong status or not your meal)', p_meal_id;
  END IF;

  RETURN NEXT v_meal;
END;
$$;

