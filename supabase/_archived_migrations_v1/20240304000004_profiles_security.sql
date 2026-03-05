-- 20240304000004_profiles_security.sql
-- Renforcer la sécurité des profils (RLS + RPC-only pour les champs sensibles)

-- S'assurer que la RLS est activée sur public.profiles (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne policy UPDATE trop permissive
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Bloquer tout UPDATE direct sur profiles (y compris pour admin) :
-- les modifications passent uniquement via les fonctions SECURITY DEFINER ci-dessous.
CREATE POLICY "Block direct update on profiles" ON public.profiles
FOR UPDATE
USING (false)
WITH CHECK (false);

-- 1) RPC pour que l'utilisatrice mette à jour uniquement ses champs "safe"
CREATE OR REPLACE FUNCTION public.update_my_profile_safe(
  p_display_name text,
  p_phone text,
  p_city text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    phone        = COALESCE(p_phone, phone),
    city         = COALESCE(p_city, city)
  WHERE id = v_uid;
END;
$$;

-- 2) RPC admin pour rôle / approbation / shabbat_enabled
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_user_id uuid,
  p_role user_role,
  p_is_approved boolean,
  p_shabbat_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT is_admin(v_uid) THEN
    RAISE EXCEPTION 'Only admins can update profiles';
  END IF;

  UPDATE public.profiles
  SET
    role            = p_role,
    is_approved     = p_is_approved,
    shabbat_enabled = p_shabbat_enabled
  WHERE id = p_user_id;
END;
$$;

-- Autoriser les utilisatrices authentifiées à appeler ces RPC
GRANT EXECUTE ON FUNCTION public.update_my_profile_safe(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, user_role, boolean, boolean) TO authenticated;

