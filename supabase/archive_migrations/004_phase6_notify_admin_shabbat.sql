-- 11a. FONCTION — notification admin quand tous items Shabbat couverts
CREATE OR REPLACE FUNCTION notify_admin_shabbat_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total    int;
  v_covered  int;
  v_meal_id  uuid;
  v_admin_id uuid;
BEGIN
  v_meal_id := NEW.meal_id;
  SELECT COUNT(*), COUNT(cook_id)
  INTO   v_total, v_covered
  FROM   meal_items
  WHERE  meal_id = v_meal_id;
  IF v_total > 0 AND v_total = v_covered THEN
    SELECT id INTO v_admin_id
    FROM   users
    WHERE  role = 'admin' AND approved = true
    LIMIT  1;
    IF v_admin_id IS NOT NULL THEN
      INSERT INTO notifications_log (user_id, message, type, channel)
      VALUES (v_admin_id, 'כל פריטי שבת כוסו! 🎉', 'shabbat_complete', 'in_app');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
