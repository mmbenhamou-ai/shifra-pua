-- Migration 008 — Partie 3/5 : RLS + policies (time_slots, meal_items, feedbacks, notifications_log, app_settings)
-- Exécuter après 007.

ALTER TABLE time_slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings      ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- time_slots
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read time_slots' AND tablename = 'time_slots') THEN
    CREATE POLICY "authenticated can read time_slots"
      ON time_slots FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can manage time_slots' AND tablename = 'time_slots') THEN
    CREATE POLICY "admin can manage time_slots"
      ON time_slots FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- meal_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read meal_items' AND tablename = 'meal_items') THEN
    CREATE POLICY "authenticated can read meal_items"
      ON meal_items FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cook can reserve meal_item' AND tablename = 'meal_items') THEN
    CREATE POLICY "cook can reserve meal_item"
      ON meal_items FOR UPDATE
      USING (cook_id IS NULL OR cook_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- feedbacks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can read own feedbacks' AND tablename = 'feedbacks') THEN
    CREATE POLICY "users can read own feedbacks"
      ON feedbacks FOR SELECT USING (author_id = auth.uid() OR target_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can read all feedbacks' AND tablename = 'feedbacks') THEN
    CREATE POLICY "admin can read all feedbacks"
      ON feedbacks FOR SELECT
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'beneficiary can insert feedback' AND tablename = 'feedbacks') THEN
    CREATE POLICY "beneficiary can insert feedback"
      ON feedbacks FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;

  -- notifications_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can read own notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "users can read own notifs"
      ON notifications_log FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users can mark notifs read' AND tablename = 'notifications_log') THEN
    CREATE POLICY "users can mark notifs read"
      ON notifications_log FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role can insert notifs' AND tablename = 'notifications_log') THEN
    CREATE POLICY "service role can insert notifs"
      ON notifications_log FOR INSERT WITH CHECK (true);
  END IF;

  -- app_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated can read settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "authenticated can read settings"
      ON app_settings FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin can update settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "admin can update settings"
      ON app_settings FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END;
$$;
