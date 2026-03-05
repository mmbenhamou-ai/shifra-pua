-- Phase 6 RPC — admin_unlock_meal (déblocage manuel par admin)

CREATE OR REPLACE FUNCTION public.admin_unlock_meal(
  p_meal_id   uuid,
  p_new_status text,
  p_reason    text DEFAULT NULL
)
RETURNS SETOF public.meals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid;
  v_role  text;
  v_old   text;
  v_meal  public.meals;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: authentication required';
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = v_uid;
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: admin only';
  END IF;

  IF p_new_status NOT IN ('open', 'ready') THEN
    RAISE EXCEPTION 'ERR_INVALID_STATE: admin_unlock only allows open or ready';
  END IF;

  SELECT status INTO v_old FROM public.meals WHERE id = p_meal_id;

  UPDATE public.meals
  SET status     = p_new_status,
      cook_id    = CASE WHEN p_new_status = 'open'  THEN NULL ELSE cook_id  END,
      driver_id  = CASE WHEN p_new_status IN ('open','ready') THEN NULL ELSE driver_id END,
      updated_at = now()
  WHERE id = p_meal_id
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: meal % not found', p_meal_id;
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, target_id, details)
  VALUES (
    v_uid,
    'admin_unlock_meal',
    p_meal_id::text,
    jsonb_build_object('from', v_old, 'to', p_new_status, 'reason', p_reason)
  );

  RETURN NEXT v_meal;
END;
$$;

