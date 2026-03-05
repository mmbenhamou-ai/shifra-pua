-- ============================================================
-- MIGRATION 004 — Support multi-roles bénévoles
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Bénévole qui est à la fois cuisinière ET livreuse
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS also_driver boolean DEFAULT false;

-- Préférences de notifications par type d'activité
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notif_cooking  boolean DEFAULT true;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notif_delivery boolean DEFAULT true;
