-- 11a. Redéfinition take_meal_atomic (RETURNS SETOF meals)
CREATE OR REPLACE FUNCTION take_meal_atomic(
  p_meal_id uuid,
  p_user_id uuid,
  p_role    text
) RETURNS SETOF meals
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_role = 'cook' THEN
    RETURN QUERY
    UPDATE meals
    SET cook_id = p_user_id,
        status  = 'cook_assigned'
    WHERE id = p_meal_id
      AND status = 'open'
      AND cook_id IS NULL
    RETURNING *;
  ELSIF p_role = 'driver' THEN
    RETURN QUERY
    UPDATE meals
    SET driver_id = p_user_id,
        status    = 'driver_assigned'
    WHERE id = p_meal_id
      AND status IN ('cook_assigned', 'ready')
      AND driver_id IS NULL
    RETURNING *;
  ELSE
    RETURN;
  END IF;
END;
$$;
