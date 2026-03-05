-- Phase 6 RPC — confirm_meal_received (delivered → confirmed)

CREATE OR REPLACE FUNCTION public.confirm_meal_received(p_meal_id uuid)
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

  -- Vérifier que l'utilisatrice est bien la יולדת du repas
  IF NOT EXISTS (
    SELECT 1 FROM public.meals m
    JOIN public.beneficiaries b ON b.id = m.beneficiary_id
    WHERE m.id = p_meal_id AND b.user_id = v_uid AND m.status = 'delivered'
  ) THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: meal % does not belong to you or is not delivered', p_meal_id;
  END IF;

  UPDATE public.meals
  SET status     = 'confirmed',
      updated_at = now()
  WHERE id = p_meal_id
    AND status = 'delivered'
  RETURNING * INTO v_meal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_CONFLICT: cannot confirm meal %', p_meal_id;
  END IF;

  RETURN NEXT v_meal;
END;
$$;

