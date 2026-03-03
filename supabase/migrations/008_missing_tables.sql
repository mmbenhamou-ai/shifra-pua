-- ============================================================
-- MIGRATION 003 — Corrections base de données manquantes
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Colonne email sur users (migration 002 non exécutée)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Colonnes manquantes sur notifications_log
ALTER TABLE notifications_log
  ADD COLUMN IF NOT EXISTS message  text,
  ADD COLUMN IF NOT EXISTS type     text,
  ADD COLUMN IF NOT EXISTS channel  text DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS read     boolean DEFAULT false;

-- 2. Table app_settings (absente — utilisée dans beneficiary/page.tsx et admin/settings)
CREATE TABLE IF NOT EXISTS app_settings (
  key   text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Valeurs par défaut
INSERT INTO app_settings (key, value) VALUES
  ('welcome_message', NULL),
  ('maintenance_mode', 'false'),
  ('max_meals_per_week', '7')
ON CONFLICT (key) DO NOTHING;

-- RLS pour app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'authenticated can read settings'
  ) THEN
    CREATE POLICY "authenticated can read settings"
      ON app_settings FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'admin can update settings'
  ) THEN
    CREATE POLICY "admin can update settings"
      ON app_settings FOR ALL
      USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
