-- ============================================================
-- MIGRATION 002 — Ajout du champ email facultatif sur users
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email text;

-- Index pour recherche par email (admin)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
