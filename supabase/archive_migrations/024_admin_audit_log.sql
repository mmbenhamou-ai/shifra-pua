-- Migration 024: Admin Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Active RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view all logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Tout le monde (authentifié) peut insérer (pour les actions admin)
-- Note: Dans notre cas, les actions Admin sont faites via des Server Actions avec createAdminClient (service role)
-- On n'a donc même pas forcément besoin de permission d'insertion publique, mais c'est par sécurité.
CREATE POLICY "Service role can insert" ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
