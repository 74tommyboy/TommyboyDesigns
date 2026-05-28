-- site_settings: single-row table for global site configuration
-- Enforced as single row via CHECK (id = 1)
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  vacation_mode boolean NOT NULL DEFAULT false,
  vacation_message text,
  announcement_enabled boolean NOT NULL DEFAULT false,
  announcement_text text,
  announcement_cta_label text,
  announcement_cta_url text,
  announcement_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the single row so reads never return null
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS: anon can read; only service role can write (API routes use service role key)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_site_settings"
ON site_settings FOR SELECT TO anon USING (true);
