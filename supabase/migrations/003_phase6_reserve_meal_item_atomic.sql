-- 10. FONCTION ATOMIQUE — réservation d'un item Shabbat
CREATE OR REPLACE FUNCTION reserve_meal_item_atomic(
  p_item_id uuid,
  p_cook_id uuid
)
RETURNS TABLE (
  id          uuid,
  cook_id     uuid,
  reserved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    UPDATE meal_items
    SET    cook_id     = p_cook_id,
           reserved_at = now()
    WHERE  meal_items.id = p_item_id
      AND  meal_items.cook_id IS NULL
    RETURNING meal_items.id, meal_items.cook_id, meal_items.reserved_at;
END;
$$;
