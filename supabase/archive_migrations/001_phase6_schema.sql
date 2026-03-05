-- ============================================================
-- MIGRATION 001 — Phase 6 : Schéma complet שפרה ופועה
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. BENEFICIARIES — champs préférences alimentaires + foyer
-- ------------------------------------------------------------
ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS num_adults       int     DEFAULT 2,
  ADD COLUMN IF NOT EXISTS num_children     int     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_ages    int[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_vegetarian    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spicy_level      int     DEFAULT 0
    CHECK (spicy_level BETWEEN 0 AND 2),   -- 0=לא חריף, 1=קצת, 2=חריף
  ADD COLUMN IF NOT EXISTS cooking_notes    text,
  ADD COLUMN IF NOT EXISTS preferred_time_slot_id uuid; -- FK ajoutée après création time_slots

-- Shabbat preferences
ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS shabbat_friday   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shabbat_saturday boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shabbat_kashrut  text    DEFAULT 'רגיל';
  -- ex: 'רגיל', 'חלק', 'מהדרין', 'בד"ץ'

-- ------------------------------------------------------------
-- 2. TIME_SLOTS — créneaux horaires définis par l'admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_slots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text        NOT NULL,
  meal_type     text        NOT NULL
    CHECK (meal_type IN ('breakfast', 'shabbat_friday', 'shabbat_saturday')),
  pickup_time   time        NOT NULL,
  delivery_time time        NOT NULL,
  max_per_slot  int         NOT NULL DEFAULT 5,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Créneaux par défaut
INSERT INTO time_slots (label, meal_type, pickup_time, delivery_time, max_per_slot) VALUES
  ('בוקר מוקדם',     'breakfast',         '07:00', '08:00', 10),
  ('בוקר',           'breakfast',         '07:30', '08:30', 10),
  ('בוקר מאוחר',     'breakfast',         '08:00', '09:00', 10),
  ('שישי ערב שבת',   'shabbat_friday',    '14:00', '15:00',  5),
  ('שבת צהריים',     'shabbat_saturday',  '11:00', '12:00',  5)
ON CONFLICT DO NOTHING;

-- FK vers time_slots depuis beneficiaries (ignorée si déjà existante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_beneficiaries_time_slot'
      AND table_name = 'beneficiaries'
  ) THEN
    ALTER TABLE beneficiaries
      ADD CONSTRAINT fk_beneficiaries_time_slot
      FOREIGN KEY (preferred_time_slot_id) REFERENCES time_slots(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 3. MEAL_ITEMS — items Shabbat réservables individuellement
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meal_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id      uuid        NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  item_name    text        NOT NULL,
  item_type    text        NOT NULL DEFAULT 'other'
    CHECK (item_type IN ('protein', 'side', 'salad', 'soup', 'dessert', 'other')),
  cook_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  reserved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id  ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_cook_id  ON meal_items(cook_id);

-- ------------------------------------------------------------
-- 4. FEEDBACKS — notation + messages de remerciement
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid        NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   uuid        REFERENCES users(id) ON DELETE SET NULL,
  -- target = cuisinière ou livreuse concernée (null = général)
  rating      int         CHECK (rating BETWEEN 1 AND 5),
  message     text,
  sent_wa     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meal_id, author_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_meal_id   ON feedbacks(meal_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_target_id ON feedbacks(target_id);

-- ------------------------------------------------------------
-- 5. MEALS — colonnes supplémentaires
-- ------------------------------------------------------------
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS time_slot_id uuid REFERENCES time_slots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conflict_at  timestamptz;
  -- conflict_at : horodatage si conflit de réservation détecté

-- ------------------------------------------------------------
-- 6. NOTIFICATIONS_LOG — s'assure que la table est complète
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  type       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ajout des colonnes manquantes si la table existait déjà
ALTER TABLE notifications_log
  ADD COLUMN IF NOT EXISTS read    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS channel text             DEFAULT 'in_app';
  -- channel : 'in_app', 'whatsapp', 'sms'

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON notifications_log(user_id, read);

-- ------------------------------------------------------------
-- 7. RLS — ACTIVATION
-- ------------------------------------------------------------
ALTER TABLE time_slots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Helper : crée une policy uniquement si elle n'existe pas déjà
DO $$
BEGIN

  -- time_slots
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read time_slots' AND tablename = 'time_slots') THEN
    CREATE POLICY "authenticated can read time_slots"
      ON time_slots FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can manage time_slots' AND tablename = 'time_slots') THEN
    CREATE POLICY "admin can manage time_slots"
      ON time_slots FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- meal_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read meal_items' AND tablename = 'meal_items') THEN
    CREATE POLICY "authenticated can read meal_items"
      ON meal_items FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can reserve meal_item' AND tablename = 'meal_items') THEN
    CREATE POLICY "cook can reserve meal_item"
      ON meal_items FOR UPDATE
      USING (
        cook_id IS NULL
        OR cook_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- feedbacks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can read own feedbacks' AND tablename = 'feedbacks') THEN
    CREATE POLICY "users can read own feedbacks"
      ON feedbacks FOR SELECT USING (author_id = auth.uid() OR target_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can read all feedbacks' AND tablename = 'feedbacks') THEN
    CREATE POLICY "admin can read all feedbacks"
      ON feedbacks FOR SELECT
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can insert feedback' AND tablename = 'feedbacks') THEN
    CREATE POLICY "beneficiary can insert feedback"
      ON feedbacks FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;

  -- notifications_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can read own notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "users can read own notifs"
      ON notifications_log FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can mark notifs read' AND tablename = 'notifications_log') THEN
    CREATE POLICY "users can mark notifs read"
      ON notifications_log FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role can insert notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "service role can insert notifs"
      ON notifications_log FOR INSERT WITH CHECK (true);
  END IF;

END;
$$;

-- ------------------------------------------------------------
-- 8. RLS GRANULAIRE SUR MEALS (transitions d'état sécurisées)
-- ------------------------------------------------------------

-- Retirer les anciennes policies permissives si elles existent
DROP POLICY IF EXISTS "all authenticated can update meals" ON meals;

DO $$
BEGIN

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can confirm meal' AND tablename = 'meals') THEN
    CREATE POLICY "beneficiary can confirm meal"
      ON meals FOR UPDATE
      USING (
        status = 'delivered'
        AND EXISTS (
          SELECT 1 FROM beneficiaries b
          WHERE b.id = meals.beneficiary_id
            AND b.user_id = auth.uid()
        )
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
        status = 'open'
        AND cook_id IS NULL
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'cook' AND approved = true)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver can take ready meal' AND tablename = 'meals') THEN
    CREATE POLICY "driver can take ready meal"
      ON meals FOR UPDATE
      USING (
        status IN ('cook_assigned', 'ready')
        AND driver_id IS NULL
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver' AND approved = true)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can update all meals' AND tablename = 'meals') THEN
    CREATE POLICY "admin can update all meals"
      ON meals FOR UPDATE
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

END;
$$;
