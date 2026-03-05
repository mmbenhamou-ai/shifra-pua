-- 20240304000006_create_meal_rpc.sql
-- RPC pour permettre à une admin de créer un repas (breakfast ou shabbat)

CREATE OR REPLACE FUNCTION public.create_meal(
  p_yoledet_id uuid,
  p_service_type service_type,
  p_date date,
  p_address text,
  p_time_window text DEFAULT NULL,
  p_menu_item_id uuid DEFAULT NULL,
  p_pickup_location text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.meals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_meal public.meals;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT is_admin(v_uid) THEN
    RAISE EXCEPTION 'Only admins can create meals';
  END IF;

  INSERT INTO public.meals (
    yoledet_id,
    date,
    status,
    service_type,
    address,
    time_window,
    menu_item_id,
    pickup_location,
    notes
  )
  VALUES (
    p_yoledet_id,
    p_date,
    'open',
    p_service_type,
    p_address,
    p_time_window,
    p_menu_item_id,
    p_pickup_location,
    p_notes
  )
  RETURNING * INTO v_meal;

  -- Enregistrer un événement de création si la table meal_events existe
  INSERT INTO public.meal_events (meal_id, actor_id, type, message_he)
  VALUES (v_meal.id, v_uid, 'created', 'ארוחה נוצרה על ידי מנהלת המערכת');

  RETURN v_meal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_meal(
  uuid,
  service_type,
  date,
  text,
  text,
  uuid,
  text,
  text
) TO authenticated;

