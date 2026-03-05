-- ============================================================
-- Phase 6 Migration 001 — Schéma de base
-- Tables : users, beneficiaries, menus, meals
-- ============================================================

-- Extension uuid-ossp (nécessaire pour uuid_generate_v4 dans certaines politiques)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------
-- TABLE public.users (profil étendu auth.users)
-- ---------------------------------------------------------------
create extension if not exists "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         text,
  name          text,
  role          text NOT NULL DEFAULT 'beneficiary'
                  CHECK (role IN ('admin', 'beneficiary', 'cook', 'driver', 'both')),
  address       text,
  neighborhood  text,
  email         text,
  also_driver   boolean DEFAULT false,
  notif_cooking  boolean DEFAULT true,
  notif_delivery boolean DEFAULT true,
  approved      boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role  ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.beneficiaries (יולדות)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  birth_date              date,
  start_date              date NOT NULL,
  end_date                date,
  num_breakfast_days      int NOT NULL DEFAULT 14,
  num_shabbat_weeks       int NOT NULL DEFAULT 2,
  num_adults              int DEFAULT 2,
  num_children            int DEFAULT 0,
  children_ages           int[] DEFAULT '{}',
  is_vegetarian           boolean DEFAULT false,
  spicy_level             int DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 2),
  cooking_notes           text,
  preferred_time_slot_id  uuid,          -- FK ajoutée après time_slots
  shabbat_friday          boolean DEFAULT false,
  shabbat_saturday        boolean DEFAULT false,
  shabbat_kashrut         text DEFAULT 'רגיל',
  active                  boolean NOT NULL DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries(user_id);
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.menus (תפריטים)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menus (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('breakfast', 'shabbat_friday', 'shabbat_saturday')),
  items      text[] NOT NULL DEFAULT '{}',
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menus_type ON public.menus(type);
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.meals (ארוחות)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  menu_id        uuid REFERENCES public.menus(id) ON DELETE SET NULL,
  date           date NOT NULL,
  type           text NOT NULL CHECK (type IN ('breakfast', 'shabbat_friday', 'shabbat_saturday')),
  status         text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'cook_assigned', 'ready', 'driver_assigned', 'picked_up', 'delivered', 'confirmed'
  )),
  cook_id        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  driver_id      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  time_slot_id   uuid,                   -- FK ajoutée après time_slots
  conflict_at    timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_beneficiary ON public.meals(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_meals_date        ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_status      ON public.meals(status);
CREATE INDEX IF NOT EXISTS idx_meals_cook_id     ON public.meals(cook_id);
CREATE INDEX IF NOT EXISTS idx_meals_driver_id   ON public.meals(driver_id);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.time_slots — créneaux horaires
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_slots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text        NOT NULL,
  meal_type     text        NOT NULL CHECK (meal_type IN ('breakfast', 'shabbat_friday', 'shabbat_saturday')),
  pickup_time   time        NOT NULL,
  delivery_time time        NOT NULL,
  max_per_slot  int         NOT NULL DEFAULT 5,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- FKs différées (tables existantes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_beneficiaries_time_slot' AND table_name = 'beneficiaries'
  ) THEN
    ALTER TABLE public.beneficiaries
      ADD CONSTRAINT fk_beneficiaries_time_slot
      FOREIGN KEY (preferred_time_slot_id) REFERENCES public.time_slots(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_meals_time_slot' AND table_name = 'meals'
  ) THEN
    ALTER TABLE public.meals
      ADD CONSTRAINT fk_meals_time_slot
      FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- Données de base : créneaux horaires
INSERT INTO public.time_slots (label, meal_type, pickup_time, delivery_time, max_per_slot) VALUES
  ('בוקר מוקדם',   'breakfast',         '07:00', '08:00', 10),
  ('בוקר',          'breakfast',         '07:30', '08:30', 10),
  ('בוקר מאוחר',   'breakfast',         '08:00', '09:00', 10),
  ('שישי ערב שבת',  'shabbat_friday',    '14:00', '15:00',  5),
  ('שבת צהריים',    'shabbat_saturday',  '11:00', '12:00',  5)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------
-- TABLE public.meal_items — items Shabbat réservables
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id      uuid        NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  item_name    text        NOT NULL,
  item_type    text        NOT NULL DEFAULT 'other'
                CHECK (item_type IN ('protein', 'side', 'salad', 'soup', 'dessert', 'other')),
  cook_id      uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  reserved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_cook_id ON public.meal_items(cook_id);
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.feedbacks — notation + remerciements
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid        NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  rating      int         CHECK (rating BETWEEN 1 AND 5),
  message     text,
  sent_wa     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meal_id, author_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_meal_id   ON public.feedbacks(meal_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_target_id ON public.feedbacks(target_id);
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.notifications_log — journal des notifications
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  type       text,
  read       boolean     NOT NULL DEFAULT false,
  channel    text        DEFAULT 'in_app',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON public.notifications_log(user_id, read);
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.app_settings — paramètres globaux
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value) VALUES
  ('welcome_message',    NULL),
  ('maintenance_mode',   'false'),
  ('max_meals_per_week', '7'),
  ('timezone',           'Asia/Jerusalem')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------
-- TABLE public.admin_audit_log — journal des actions admin
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  target_id  text,
  details    jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- TABLE public.user_push_subscriptions — abonnements push
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;
