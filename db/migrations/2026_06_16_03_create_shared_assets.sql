-- Create shared_assets table
CREATE TABLE IF NOT EXISTS shared_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  asset_key text NOT NULL,
  content_type text,
  storage_path text,
  access_token text,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_assets_owner ON shared_assets(owner_user_id);
