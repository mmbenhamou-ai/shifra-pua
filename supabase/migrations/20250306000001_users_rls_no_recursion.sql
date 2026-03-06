-- ============================================================
-- Migration: fix RLS on public.users — remove infinite recursion
-- ============================================================
-- Problème: la policy "admin full access users" faisait
--   USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
-- donc une lecture de la table users déclenchait la RLS, qui relisait users → récursion infinie.
--
-- Solution:
-- 1. Fonction SECURITY DEFINER is_admin() : lit users avec les droits du propriétaire
--    (postgres/migration), qui bypass RLS → pas de récursion.
-- 2. Remplacer "authenticated read users" (trop permissive) par "users read own row".
-- 3. Remplacer "admin full access users" par une policy qui utilise is_admin().
-- ============================================================

-- Fonction helper : vrai si l'utilisateur courant est admin.
-- SECURITY DEFINER = exécution avec les droits du propriétaire (migration = postgres),
-- qui bypass RLS sur users → pas de récursion lors de la lecture.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Supprimer les policies problématiques sur users
DROP POLICY IF EXISTS "admin full access users" ON public.users;
DROP POLICY IF EXISTS "authenticated read users" ON public.users;

-- Lecture : un utilisateur ne peut lire que sa propre ligne
CREATE POLICY "users read own row"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Admin : accès complet via la fonction (pas de SELECT depuis la policy sur users)
CREATE POLICY "admin full access users"
  ON public.users
  FOR ALL
  USING (public.is_admin());

-- Les policies suivantes sont inchangées (déjà présentes dans 002) :
-- "user can update own profile" (UPDATE USING (id = auth.uid()))
-- "service role full users" (USING (auth.jwt() ->> 'role' = 'service_role'))
