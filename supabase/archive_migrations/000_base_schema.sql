-- ============================================================
-- MIGRATION 000 — Schéma de base (tables requises par 001+)
-- Pour base locale vide : crée users, beneficiaries, menus, meals.
-- À exécuter en premier (ordre lexical).
-- ============================================================

-- Table public.users (profil étendu auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         text,
  name          text,
  role          text NOT NULL CHECK (role IN ('admin', 'beneficiary', 'cook', 'driver', 'both')),
  address       text,
  neighborhood  text,
  approved      boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy de base : lecture par authentifié (détails selon policies plus fines ailleurs)
CREATE POLICY "authenticated read users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Table public.beneficiaries (יולדות)
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  birth_date          date,
  start_date          date NOT NULL,
  num_breakfast_days  int NOT NULL DEFAULT 14,
  num_shabbat_weeks   int NOT NULL DEFAULT 2,
  active              boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries(user_id);
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- Table public.menus (תפריטים)
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

-- Table public.meals (ארוחות)
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
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_beneficiary ON public.meals(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_status ON public.meals(status);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Policies minimales pour que l'app et les migrations suivantes fonctionnent
-- (001 et suivantes ajouteront les policies granulaires)
CREATE POLICY "authenticated read beneficiaries"
  ON public.beneficiaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated read menus"
  ON public.menus FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated read meals"
  ON public.meals FOR SELECT USING (auth.role() = 'authenticated');

-- Service role / admin pour insert/update (les policies RLS détaillées viennent en 001+)
CREATE POLICY "service role full users"
  ON public.users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "service role full beneficiaries"
  ON public.beneficiaries FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "service role full menus"
  ON public.menus FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "service role full meals"
  ON public.meals FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
