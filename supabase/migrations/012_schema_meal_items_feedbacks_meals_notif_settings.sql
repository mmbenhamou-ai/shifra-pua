-- Migration 007 — Partie 2/5 : meal_items, feedbacks, meals (colonnes), notifications_log, app_settings
-- Exécuter après 006.

-- 3. TABLE meal_items
CREATE TABLE IF NOT EXISTS meal_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id      uuid        NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  item_name    text        NOT NULL,
  item_type    text        NOT NULL DEFAULT 'other' CHECK (item_type IN ('protein', 'side', 'salad', 'soup', 'dessert', 'other')),
  cook_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  reserved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id  ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_cook_id  ON meal_items(cook_id);

-- 4. TABLE feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid        NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   uuid        REFERENCES users(id) ON DELETE SET NULL,
  rating      int         CHECK (rating BETWEEN 1 AND 5),
  message     text,
  sent_wa     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meal_id, author_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_meal_id   ON feedbacks(meal_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_target_id ON feedbacks(target_id);

-- 5. TABLE meals — colonnes supplémentaires
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS time_slot_id uuid REFERENCES time_slots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conflict_at  timestamptz;

-- 6. TABLE notifications_log
CREATE TABLE IF NOT EXISTS notifications_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  type       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications_log
  ADD COLUMN IF NOT EXISTS read    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS channel text             DEFAULT 'in_app';

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON notifications_log(user_id, read);

-- 7. TABLE app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES
  ('welcome_message',   NULL),
  ('maintenance_mode',  'false'),
  ('max_meals_per_week','7'),
  ('timezone',          'Asia/Jerusalem')
ON CONFLICT (key) DO NOTHING;
