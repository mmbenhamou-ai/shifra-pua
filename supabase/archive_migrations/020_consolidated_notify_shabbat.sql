-- 12a. Fonction trigger Shabbat (meals.status → notification admin)
CREATE OR REPLACE FUNCTION notify_admin_shabbat_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_ben_id uuid;
  v_missing int;
BEGIN
  IF NEW.type NOT IN ('shabbat_friday', 'shabbat_saturday') THEN
    RETURN NEW;
  END IF;
  v_ben_id := NEW.beneficiary_id;
  SELECT COUNT(*) INTO v_missing
  FROM meals
  WHERE beneficiary_id = v_ben_id
    AND type IN ('shabbat_friday', 'shabbat_saturday')
    AND status = 'open';
  IF v_missing = 0 THEN
    INSERT INTO notifications_log (user_id, message, type)
    SELECT id, 'כל סעודות השבת ליולדת כוסו', 'shabbat_complete'
    FROM users
    WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;
