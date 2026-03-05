-- ============================================================
-- MIGRATION 005 — Schéma consolidé final שפרה ופועה
-- Regroupe et corrige les migrations 001–004.
-- Fichier idempotent : peut être exécuté plusieurs fois sans erreur.
--
-- ⚠️ TIMEOUT SQL EDITOR : si "Connection terminated due to connection timeout",
-- exécuter les migrations découpées 006 → 007 → 008 → 009 → 010 dans l’ordre
-- (chaque fichier dans le SQL Editor, un par un).
-- ============================================================

-- ------------------------------------------------------------
-- 0. TABLE `users` — colonnes manquantes (email, multi-rôles, notifications)
-- ------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS also_driver     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_cooking   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_delivery  boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------
-- 1. TABLE `beneficiaries` — composition foyer, préférences, statut
-- ------------------------------------------------------------

ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS num_adults            int     DEFAULT 2,
  ADD COLUMN IF NOT EXISTS num_children          int     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_ages         int[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_vegetarian         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spicy_level           int     DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 2),
  ADD COLUMN IF NOT EXISTS cooking_notes         text,
  ADD COLUMN IF NOT EXISTS preferred_time_slot_id uuid,
  ADD COLUMN IF NOT EXISTS shabbat_friday        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shabbat_saturday      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shabbat_kashrut       text    DEFAULT 'רגיל',
  ADD COLUMN IF NOT EXISTS end_date              date,
  ADD COLUMN IF NOT EXISTS active                boolean DEFAULT true;

-- ------------------------------------------------------------
-- 2. TABLE `time_slots` — créneaux horaires + FK depuis beneficiaries
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS time_slots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text        NOT NULL,
  meal_type     text        NOT NULL CHECK (meal_type IN ('breakfast', 'shabbat_friday', 'shabbat_saturday')),
  pickup_time   time        NOT NULL,
  delivery_time time        NOT NULL,
  max_per_slot  int         NOT NULL DEFAULT 5,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO time_slots (label, meal_type, pickup_time, delivery_time, max_per_slot) VALUES
  ('בוקר מוקדם',     'breakfast',         '07:00', '08:00', 10),
  ('בוקר',           'breakfast',         '07:30', '08:30', 10),
  ('בוקר מאוחר',     'breakfast',         '08:00', '09:00', 10),
  ('שישי ערב שבת',   'shabbat_friday',    '14:00', '15:00',  5),
  ('שבת צהריים',     'shabbat_saturday',  '11:00', '12:00',  5)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
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
-- 3. TABLE `meal_items` — items Shabbat réservables individuellement
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meal_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id      uuid        NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  item_name    text        NOT NULL,
  item_type    text        NOT NULL DEFAULT 'other' CHECK (item_type IN ('protein', 'side', 'salad', 'soup', 'dessert', 'other')),
  cook_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  reserved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id  ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_cook_id  ON meal_items(cook_id);

-- ------------------------------------------------------------
-- 4. TABLE `feedbacks` — notation + remerciements
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedbacks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid        NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   uuid        REFERENCES users(id) ON DELETE SET NULL,
  rating      int         CHECK (rating BETWEEN 1 AND 5),
  message     text,
  sent_wa     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meal_id, author_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_meal_id   ON feedbacks(meal_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_target_id ON feedbacks(target_id);

-- ------------------------------------------------------------
-- 5. TABLE `meals` — colonnes supplémentaires
-- ------------------------------------------------------------

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS time_slot_id uuid REFERENCES time_slots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conflict_at  timestamptz;

-- ------------------------------------------------------------
-- 6. TABLE `notifications_log` — création / complétion
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  type       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications_log
  ADD COLUMN IF NOT EXISTS read    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS channel text             DEFAULT 'in_app';

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON notifications_log(user_id, read);

-- ------------------------------------------------------------
-- 7. TABLE `app_settings` — paramètres globaux
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

-- Valeurs par défaut
INSERT INTO app_settings (key, value) VALUES
  ('welcome_message',   NULL),
  ('maintenance_mode',  'false'),
  ('max_meals_per_week','7'),
  ('timezone',          'Asia/Jerusalem')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 8. RLS — activation sur les nouvelles tables
-- ------------------------------------------------------------

ALTER TABLE time_slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings      ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 9. POLICIES — toutes les nouvelles policies dans un bloc DO $$ ... END $$
-- ------------------------------------------------------------

DO $$
BEGIN
  -- time_slots
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read time_slots' AND tablename = 'time_slots'
  ) THEN
    CREATE POLICY "authenticated can read time_slots"
      ON time_slots FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin can manage time_slots' AND tablename = 'time_slots'
  ) THEN
    CREATE POLICY "admin can manage time_slots"
      ON time_slots FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- meal_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read meal_items' AND tablename = 'meal_items'
  ) THEN
    CREATE POLICY "authenticated can read meal_items"
      ON meal_items FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'cook can reserve meal_item' AND tablename = 'meal_items'
  ) THEN
    CREATE POLICY "cook can reserve meal_item"
      ON meal_items FOR UPDATE
      USING (
        cook_id IS NULL
        OR cook_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  -- feedbacks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users can read own feedbacks' AND tablename = 'feedbacks'
  ) THEN
    CREATE POLICY "users can read own feedbacks"
      ON feedbacks FOR SELECT USING (author_id = auth.uid() OR target_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin can read all feedbacks' AND tablename = 'feedbacks'
  ) THEN
    CREATE POLICY "admin can read all feedbacks"
      ON feedbacks FOR SELECT
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can insert feedback' AND tablename = 'feedbacks'
  ) THEN
    CREATE POLICY "beneficiary can insert feedback"
      ON feedbacks FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;

  -- notifications_log
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users can read own notifs' AND tablename = 'notifications_log'
  ) THEN
    CREATE POLICY "users can read own notifs"
      ON notifications_log FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users can mark notifs read' AND tablename = 'notifications_log'
  ) THEN
    CREATE POLICY "users can mark notifs read"
      ON notifications_log FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'service role can insert notifs' AND tablename = 'notifications_log'
  ) THEN
    CREATE POLICY "service role can insert notifs"
      ON notifications_log FOR INSERT WITH CHECK (true);
  END IF;

  -- app_settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read settings' AND tablename = 'app_settings'
  ) THEN
    CREATE POLICY "authenticated can read settings"
      ON app_settings FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin can update settings' AND tablename = 'app_settings'
  ) THEN
    CREATE POLICY "admin can update settings"
      ON app_settings FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 10. RLS GRANULAIRE SUR `meals` (transitions d'état sécurisées)
-- ------------------------------------------------------------

-- On supprime d'abord les anciennes policies trop permissives si elles existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'all authenticated can update meals') THEN
    DROP POLICY "all authenticated can update meals" ON meals;
  END IF;
END;
$$;

DO $$
BEGIN
  -- יולדת liée : peut passer delivered → confirmed uniquement
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can confirm meal' AND tablename = 'meals'
  ) THEN
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

  -- Cuisinière assignée : cook_assigned → ready
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'cook can mark ready' AND tablename = 'meals'
  ) THEN
    CREATE POLICY "cook can mark ready"
      ON meals FOR UPDATE
      USING (cook_id = auth.uid() AND status = 'cook_assigned');
  END IF;

  -- Livreuse assignée : driver_assigned/picked_up → statut suivant
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'driver can advance delivery' AND tablename = 'meals'
  ) THEN
    CREATE POLICY "driver can advance delivery"
      ON meals FOR UPDATE
      USING (driver_id = auth.uid() AND status IN ('driver_assigned', 'picked_up'));
  END IF;

  -- Cuisinière approuvée : peut prendre un repas open
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'cook can take open meal' AND tablename = 'meals'
  ) THEN
    CREATE POLICY "cook can take open meal"
      ON meals FOR UPDATE
      USING (
        status = 'open'
        AND cook_id IS NULL
        AND EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
            AND role IN ('cook', 'both')
            AND approved = true
        )
      );
  END IF;

  -- Livreuse approuvée : peut prendre un repas ready
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'driver can take ready meal' AND tablename = 'meals'
  ) THEN
    CREATE POLICY "driver can take ready meal"
      ON meals FOR UPDATE
      USING (
        status IN ('cook_assigned', 'ready')
        AND driver_id IS NULL
        AND EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
            AND role IN ('driver', 'both')
            AND approved = true
        )
      );
  END IF;

  -- Admin : peut tout modifier
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin can update all meals' AND tablename = 'meals'
  ) THEN
    CREATE POLICY "admin can update all meals"
      ON meals FOR ALL
      USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END;
$$;

-- Sections 11-13 déplacées vers 016-020 (un statement par fichier pour le runner)


