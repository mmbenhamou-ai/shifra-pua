-- Phase 6 RPC — mark_delivered (picked_up → delivered)

CREATE OR REPLACE FUNCTION public.mark_delivered(p_meal_id uuid)
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
  SET status     = 'delivered',
      updated_at = now()
  WHERE id = p_meal_id
    AND driver_id = v_uid
    AND status = 'picked_up'
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: cannot mark meal % delivered', p_meal_id;
  END IF;

  RETURN NEXT v_meal;
END;
$$;

