-- Migration 006 — Partie 1/5 : users, beneficiaries, time_slots
-- Exécuter ce bloc en premier dans le SQL Editor (évite le timeout).

-- 0. TABLE users — colonnes manquantes
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS also_driver     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_cooking   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_delivery  boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 1. TABLE beneficiaries — composition foyer, préférences, statut
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

-- 2. TABLE time_slots + FK depuis beneficiaries
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

-- Déduplication avant index unique (001 peut avoir inséré des doublons)
DO $$
BEGIN
  UPDATE beneficiaries b
  SET preferred_time_slot_id = sub.keep_id
  FROM (
    SELECT t.id AS dup_id, (SELECT t2.id FROM time_slots t2 WHERE t2.label = t.label AND t2.meal_type = t.meal_type ORDER BY t2.id ASC LIMIT 1) AS keep_id
    FROM time_slots t
  ) sub
  WHERE b.preferred_time_slot_id = sub.dup_id AND sub.dup_id <> sub.keep_id;

  UPDATE meals m
  SET time_slot_id = sub.keep_id
  FROM (
    SELECT t.id AS dup_id, (SELECT t2.id FROM time_slots t2 WHERE t2.label = t.label AND t2.meal_type = t.meal_type ORDER BY t2.id ASC LIMIT 1) AS keep_id
    FROM time_slots t
  ) sub
  WHERE m.time_slot_id = sub.dup_id AND sub.dup_id <> sub.keep_id;

  DELETE FROM time_slots a
  USING time_slots b
  WHERE a.label = b.label AND a.meal_type = b.meal_type AND a.id > b.id;
END;
$$;

-- Contrainte pour INSERT idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_slots_label_meal_type ON time_slots (label, meal_type);

INSERT INTO time_slots (label, meal_type, pickup_time, delivery_time, max_per_slot) VALUES
  ('בוקר מוקדם',     'breakfast',         '07:00', '08:00', 10),
  ('בוקר',           'breakfast',         '07:30', '08:30', 10),
  ('בוקר מאוחר',     'breakfast',         '08:00', '09:00', 10),
  ('שישי ערב שבת',   'shabbat_friday',    '14:00', '15:00',  5),
  ('שבת צהריים',     'shabbat_saturday',  '11:00', '12:00',  5)
ON CONFLICT (label, meal_type) DO NOTHING;

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
