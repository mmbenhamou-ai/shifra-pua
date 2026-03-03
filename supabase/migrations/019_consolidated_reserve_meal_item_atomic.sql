-- 11b. Redéfinition reserve_meal_item_atomic (RETURNS SETOF meal_items)
CREATE OR REPLACE FUNCTION reserve_meal_item_atomic(
  p_item_id uuid,
  p_cook_id uuid
) RETURNS SETOF meal_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE meal_items
  SET cook_id     = p_cook_id,
      reserved_at = now()
  WHERE id = p_item_id
    AND (cook_id IS NULL OR cook_id = p_cook_id)
  RETURNING *;
END;
$$;
