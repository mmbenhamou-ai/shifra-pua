-- Phase 6 RPC — transitions de statut (ready / picked_up / delivered / confirmed)

CREATE OR REPLACE FUNCTION public.mark_meal_ready(p_meal_id uuid)
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
  SET status     = 'ready',
      updated_at = now()
  WHERE id = p_meal_id
    AND cook_id = v_uid
    AND status = 'cook_assigned'
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: cannot mark meal % ready (wrong status or not your meal)', p_meal_id;
  END IF;

  RETURN NEXT v_meal;
END;
$$;

