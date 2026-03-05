-- ============================================================
-- Phase 6 Migration 002 — RLS Policies (toutes les tables)
-- ============================================================

-- ---------------------------------------------------------------
-- users
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated read users' AND tablename = 'users') THEN
    CREATE POLICY "authenticated read users" ON public.users
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Chaque utilisateur peut mettre à jour son propre profil (nom, téléphone, adresse…)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user can update own profile' AND tablename = 'users') THEN
    CREATE POLICY "user can update own profile" ON public.users
      FOR UPDATE USING (id = auth.uid());
  END IF;

  -- Admin : accès complet
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin full access users' AND tablename = 'users') THEN
    CREATE POLICY "admin full access users" ON public.users
      FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Service role (cron, webhooks)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role full users' AND tablename = 'users') THEN
    CREATE POLICY "service role full users" ON public.users
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- beneficiaries
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated read beneficiaries' AND tablename = 'beneficiaries') THEN
    CREATE POLICY "authenticated read beneficiaries" ON public.beneficiaries
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary update own' AND tablename = 'beneficiaries') THEN
    CREATE POLICY "beneficiary update own" ON public.beneficiaries
      FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin full access beneficiaries' AND tablename = 'beneficiaries') THEN
    CREATE POLICY "admin full access beneficiaries" ON public.beneficiaries
      FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role full beneficiaries' AND tablename = 'beneficiaries') THEN
    CREATE POLICY "service role full beneficiaries" ON public.beneficiaries
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- menus
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated read menus' AND tablename = 'menus') THEN
    CREATE POLICY "authenticated read menus" ON public.menus
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin full access menus' AND tablename = 'menus') THEN
    CREATE POLICY "admin full access menus" ON public.menus
      FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role full menus' AND tablename = 'menus') THEN
    CREATE POLICY "service role full menus" ON public.menus
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- meals — policies granulaires par rôle
-- ---------------------------------------------------------------
DO $$
BEGIN
  -- SELECT : authentifié peut lire
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated read meals' AND tablename = 'meals') THEN
    CREATE POLICY "authenticated read meals" ON public.meals
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- INSERT : admin ou service_role seulement
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin insert meals' AND tablename = 'meals') THEN
    CREATE POLICY "admin insert meals" ON public.meals
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        OR auth.jwt() ->> 'role' = 'service_role'
      );
  END IF;

  -- UPDATE cuisinière : open → cook_assigned
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can take open meal' AND tablename = 'meals') THEN
    CREATE POLICY "cook can take open meal" ON public.meals
      FOR UPDATE USING (
        status = 'open' AND cook_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('cook', 'both') AND approved = true
        )
      );
  END IF;

  -- UPDATE cuisinière assignée : cook_assigned → ready
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can mark ready' AND tablename = 'meals') THEN
    CREATE POLICY "cook can mark ready" ON public.meals
      FOR UPDATE USING (cook_id = auth.uid() AND status = 'cook_assigned');
  END IF;

  -- UPDATE livreuse : ready → driver_assigned
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver can take ready meal' AND tablename = 'meals') THEN
    CREATE POLICY "driver can take ready meal" ON public.meals
      FOR UPDATE USING (
        status IN ('cook_assigned', 'ready') AND driver_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('driver', 'both') AND approved = true
        )
      );
  END IF;

  -- UPDATE livreuse assignée : driver_assigned/picked_up → picked_up/delivered
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver can advance delivery' AND tablename = 'meals') THEN
    CREATE POLICY "driver can advance delivery" ON public.meals
      FOR UPDATE USING (driver_id = auth.uid() AND status IN ('driver_assigned', 'picked_up'));
  END IF;

  -- UPDATE יולדת : delivered → confirmed
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can confirm meal' AND tablename = 'meals') THEN
    CREATE POLICY "beneficiary can confirm meal" ON public.meals
      FOR UPDATE USING (
        status = 'delivered'
        AND EXISTS (
          SELECT 1 FROM public.beneficiaries b
          WHERE b.id = meals.beneficiary_id AND b.user_id = auth.uid()
        )
      );
  END IF;

  -- Admin : accès complet (inclut DELETE pour annulations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin full access meals' AND tablename = 'meals') THEN
    CREATE POLICY "admin full access meals" ON public.meals
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        OR auth.jwt() ->> 'role' = 'service_role'
      );
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- time_slots
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read time_slots' AND tablename = 'time_slots') THEN
    CREATE POLICY "authenticated can read time_slots" ON public.time_slots
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can manage time_slots' AND tablename = 'time_slots') THEN
    CREATE POLICY "admin can manage time_slots" ON public.time_slots
      FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- meal_items
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read meal_items' AND tablename = 'meal_items') THEN
    CREATE POLICY "authenticated can read meal_items" ON public.meal_items
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- INSERT : admin ou service_role seulement (la RPC gère l'insert initial)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin insert meal_items' AND tablename = 'meal_items') THEN
    CREATE POLICY "admin insert meal_items" ON public.meal_items
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        OR auth.jwt() ->> 'role' = 'service_role'
      );
  END IF;

  -- UPDATE : cuisinière peut réserver un item libre ou déjà à elle
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can reserve meal_item' AND tablename = 'meal_items') THEN
    CREATE POLICY "cook can reserve meal_item" ON public.meal_items
      FOR UPDATE USING (
        cook_id IS NULL OR cook_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin full access meal_items' AND tablename = 'meal_items') THEN
    CREATE POLICY "admin full access meal_items" ON public.meal_items
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        OR auth.jwt() ->> 'role' = 'service_role'
      );
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- feedbacks
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can read own feedbacks' AND tablename = 'feedbacks') THEN
    CREATE POLICY "users can read own feedbacks" ON public.feedbacks
      FOR SELECT USING (author_id = auth.uid() OR target_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can read all feedbacks' AND tablename = 'feedbacks') THEN
    CREATE POLICY "admin can read all feedbacks" ON public.feedbacks
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can insert feedback' AND tablename = 'feedbacks') THEN
    CREATE POLICY "beneficiary can insert feedback" ON public.feedbacks
      FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- notifications_log
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can read own notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "users can read own notifs" ON public.notifications_log
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can mark notifs read' AND tablename = 'notifications_log') THEN
    CREATE POLICY "users can mark notifs read" ON public.notifications_log
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- INSERT : ouvert (les RPC et le service_role injectent des notifications)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service can insert notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "service can insert notifs" ON public.notifications_log
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can read all notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "admin can read all notifs" ON public.notifications_log
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- app_settings
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "authenticated can read settings" ON public.app_settings
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can manage settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "admin can manage settings" ON public.app_settings
      FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can view audit log' AND tablename = 'admin_audit_log') THEN
    CREATE POLICY "admin can view audit log" ON public.admin_audit_log
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- INSERT : RPCs et service_role uniquement; les Server Actions admin passent par service_role
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service can insert audit log' AND tablename = 'admin_audit_log') THEN
    CREATE POLICY "service can insert audit log" ON public.admin_audit_log
      FOR INSERT WITH CHECK (true);
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- user_push_subscriptions
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users manage own subscriptions' AND tablename = 'user_push_subscriptions') THEN
    CREATE POLICY "users manage own subscriptions" ON public.user_push_subscriptions
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin view all subscriptions' AND tablename = 'user_push_subscriptions') THEN
    CREATE POLICY "admin view all subscriptions" ON public.user_push_subscriptions
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;
