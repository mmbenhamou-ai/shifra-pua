-- Migration 009 — Partie 4/5 : RLS granulaire sur meals (transitions d'état)
-- Exécuter après 008.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'all authenticated can update meals') THEN
    DROP POLICY "all authenticated can update meals" ON meals;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can confirm meal' AND tablename = 'meals') THEN
    CREATE POLICY "beneficiary can confirm meal"
      ON meals FOR UPDATE
      USING (
        status = 'delivered'
        AND EXISTS (SELECT 1 FROM beneficiaries b WHERE b.id = meals.beneficiary_id AND b.user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can mark ready' AND tablename = 'meals') THEN
    CREATE POLICY "cook can mark ready"
      ON meals FOR UPDATE
      USING (cook_id = auth.uid() AND status = 'cook_assigned');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver can advance delivery' AND tablename = 'meals') THEN
    CREATE POLICY "driver can advance delivery"
      ON meals FOR UPDATE
      USING (driver_id = auth.uid() AND status IN ('driver_assigned', 'picked_up'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can take open meal' AND tablename = 'meals') THEN
    CREATE POLICY "cook can take open meal"
      ON meals FOR UPDATE
      USING (
        status = 'open' AND cook_id IS NULL
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('cook', 'both') AND approved = true)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver can take ready meal' AND tablename = 'meals') THEN
    CREATE POLICY "driver can take ready meal"
      ON meals FOR UPDATE
      USING (
        status IN ('cook_assigned', 'ready') AND driver_id IS NULL
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('driver', 'both') AND approved = true)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can update all meals' AND tablename = 'meals') THEN
    CREATE POLICY "admin can update all meals"
      ON meals FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;
