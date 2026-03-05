-- Phase 6 RPC — reserve_meal_item_atomic / release_meal_item (gestion des items de repas)

CREATE OR REPLACE FUNCTION public.reserve_meal_item_atomic(p_item_id uuid)
RETURNS SETOF public.meal_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid;
  v_role text;
  v_item public.meal_items;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: authentication required';
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE id = v_uid AND approved = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_NOT_APPROVED: user not approved or does not exist';
  END IF;

  IF v_role NOT IN ('cook', 'both', 'admin') THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: only cooks can reserve meal items';
  END IF;

  UPDATE public.meal_items
  SET cook_id     = v_uid,
      reserved_at = now()
  WHERE id = p_item_id
    AND (cook_id IS NULL OR cook_id = v_uid)
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: item % is already reserved by someone else', p_item_id;
  END IF;

  RETURN NEXT v_item;
END;
$$;

