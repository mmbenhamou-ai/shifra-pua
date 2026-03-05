-- ============================================================
-- Seed Phase 6 — données de développement local
-- Exécuté automatiquement par `supabase db reset`
-- ============================================================

-- 1) Tpéritons (menus)
INSERT INTO public.menus (id, name, type, items, active)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ארוחת בוקר קלאסית', 'breakfast',
   ARRAY['לחם', 'גבינה לבנה', 'ביצה', 'ירקות', 'ריבה'], true),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'סעודת שישי', 'shabbat_friday',
   ARRAY['מרק עוף', 'עוף מטוגן', 'חצילים מטוגנים', 'ורד', 'עוגה'], true),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'סעודת שבת', 'shabbat_saturday',
   ARRAY['חמין', 'צלי', 'קוגל', 'עוגת שוקולד'], true)
ON CONFLICT (id) DO NOTHING;
