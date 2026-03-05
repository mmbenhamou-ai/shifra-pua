-- ============================================================
-- Sanity schema check — Phase 6
-- Exécuter après `supabase db reset` pour valider le schéma.
-- Usage : supabase db diff --linked  (ou via SQL Editor local)
-- ============================================================

DO $$
DECLARE
  missing text := '';
BEGIN
  -- Tables obligatoires
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN missing := missing || 'MISSING TABLE: users' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beneficiaries')
    THEN missing := missing || 'MISSING TABLE: beneficiaries' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meals')
    THEN missing := missing || 'MISSING TABLE: meals' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menus')
    THEN missing := missing || 'MISSING TABLE: menus' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meal_items')
    THEN missing := missing || 'MISSING TABLE: meal_items' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_slots')
    THEN missing := missing || 'MISSING TABLE: time_slots' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedbacks')
    THEN missing := missing || 'MISSING TABLE: feedbacks' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications_log')
    THEN missing := missing || 'MISSING TABLE: notifications_log' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_settings')
    THEN missing := missing || 'MISSING TABLE: app_settings' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_log')
    THEN missing := missing || 'MISSING TABLE: admin_audit_log' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_push_subscriptions')
    THEN missing := missing || 'MISSING TABLE: user_push_subscriptions' || E'\n'; END IF;

  -- Colonnes clés
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='approved')
    THEN missing := missing || 'MISSING COLUMN: users.approved' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role')
    THEN missing := missing || 'MISSING COLUMN: users.role' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meals' AND column_name='beneficiary_id')
    THEN missing := missing || 'MISSING COLUMN: meals.beneficiary_id' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meals' AND column_name='type')
    THEN missing := missing || 'MISSING COLUMN: meals.type' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meals' AND column_name='driver_id')
    THEN missing := missing || 'MISSING COLUMN: meals.driver_id' || E'\n'; END IF;

  -- Fonctions critiques
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'take_meal_atomic')
    THEN missing := missing || 'MISSING FUNCTION: take_meal_atomic' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reserve_meal_item_atomic')
    THEN missing := missing || 'MISSING FUNCTION: reserve_meal_item_atomic' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cook_release_meal')
    THEN missing := missing || 'MISSING FUNCTION: cook_release_meal' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'driver_release_meal')
    THEN missing := missing || 'MISSING FUNCTION: driver_release_meal' || E'\n'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_unlock_meal')
    THEN missing := missing || 'MISSING FUNCTION: admin_unlock_meal' || E'\n'; END IF;

  -- Trigger auth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created' AND event_object_table = 'users'
  ) THEN
    missing := missing || 'MISSING TRIGGER: on_auth_user_created' || E'\n';
  END IF;

  IF missing != '' THEN
    RAISE EXCEPTION E'SANITY CHECK FAILED:\n%', missing;
  ELSE
    RAISE NOTICE 'SANITY CHECK PASSED: all tables, columns and functions present';
  END IF;
END;
$$;
