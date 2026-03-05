-- Phase 6 RPC — release_meal_item (libération d'un item de repas)

CREATE OR REPLACE FUNCTION public.release_meal_item(p_item_id uuid)
RETURNS SETOF public.meal_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid;
  v_item public.meal_items;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: authentication required';
  END IF;

  UPDATE public.meal_items
  SET cook_id     = NULL,
      reserved_at = NULL
  WHERE id = p_item_id
    AND cook_id = v_uid
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: item % not yours or already released', p_item_id;
  END IF;

  RETURN NEXT v_item;
END;
$$;

