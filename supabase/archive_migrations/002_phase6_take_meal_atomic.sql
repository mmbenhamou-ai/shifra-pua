-- 9. FONCTION ATOMIQUE — prise de repas sans conflit (un seul statement pour le runner)
CREATE OR REPLACE FUNCTION take_meal_atomic(
  p_meal_id uuid,
  p_user_id uuid,
  p_role    text
)
RETURNS TABLE (
  id        uuid,
  status    text,
  cook_id   uuid,
  driver_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_role = 'cook' THEN
    RETURN QUERY
      UPDATE meals
      SET    status  = 'cook_assigned',
             cook_id = p_user_id
      WHERE  meals.id = p_meal_id
        AND  meals.status = 'open'
        AND  meals.cook_id IS NULL
      RETURNING meals.id, meals.status, meals.cook_id, meals.driver_id;
  ELSIF p_role = 'driver' THEN
    RETURN QUERY
      UPDATE meals
      SET    status    = 'driver_assigned',
             driver_id = p_user_id
      WHERE  meals.id = p_meal_id
        AND  meals.status IN ('cook_assigned', 'ready')
        AND  meals.driver_id IS NULL
      RETURNING meals.id, meals.status, meals.cook_id, meals.driver_id;
  END IF;
END;
$$;
