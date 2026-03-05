-- ============================================================
-- Phase 6 Migration 004 — Trigger : notification admin Shabbat complet
-- Quand tous les repas de Shabbat d'une יולדת sont couverts
-- (status != open), notifie les admins.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_admin_shabbat_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_ben_id uuid;
  v_missing int;
BEGIN
  -- Ne concerne que les repas Shabbat
  IF NEW.type NOT IN ('shabbat_friday', 'shabbat_saturday') THEN
    RETURN NEW;
  END IF;

  -- Si le statut passe à couvert (non-open)
  IF NEW.status = 'open' THEN
    RETURN NEW;
  END IF;

  v_ben_id := NEW.beneficiary_id;

  SELECT COUNT(*) INTO v_missing
  FROM public.meals
  WHERE beneficiary_id = v_ben_id
    AND type IN ('shabbat_friday', 'shabbat_saturday')
    AND status = 'open';

  IF v_missing = 0 THEN
    INSERT INTO public.notifications_log (user_id, message, type)
    SELECT id, 'כל סעודות השבת ליולדת כוסו ✅', 'shabbat_complete'
    FROM public.users
    WHERE role = 'admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shabbat_complete ON public.meals;
DROP TRIGGER IF EXISTS trg_shabbat_complete ON public.meal_items;

CREATE TRIGGER trg_shabbat_complete
  AFTER UPDATE OF status ON public.meals
  FOR EACH ROW
  WHEN (
    NEW.type IN ('shabbat_friday', 'shabbat_saturday')
    AND NEW.status IN ('cook_assigned', 'ready', 'driver_assigned', 'picked_up', 'delivered', 'confirmed')
  )
  EXECUTE FUNCTION public.notify_admin_shabbat_complete();
