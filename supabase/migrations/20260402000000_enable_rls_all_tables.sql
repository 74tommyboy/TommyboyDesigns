-- Enable RLS on all public tables
-- Reviews: anon can read approved rows and insert new reviews
-- pending_review_emails: service-role only (bypasses RLS); no anon access
-- settings: anon read-only
-- filament_spools: anon read-only

-- ─── reviews ────────────────────────────────────────────────────────────────

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anon can read only approved reviews (hides pending, emails, ip_hash from direct API access)
CREATE POLICY "anon_select_approved_reviews"
ON reviews
FOR SELECT TO anon
USING (approved = true);

-- Anon can insert new reviews (token validation happens in the API route)
CREATE POLICY "anon_insert_reviews"
ON reviews
FOR INSERT TO anon
WITH CHECK (true);

-- ─── pending_review_emails ───────────────────────────────────────────────────

ALTER TABLE pending_review_emails ENABLE ROW LEVEL SECURITY;
-- No anon policies — service role bypasses RLS; anon key has zero access

-- ─── settings ───────────────────────────────────────────────────────────────

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_settings"
ON settings
FOR SELECT TO anon
USING (true);

-- ─── filament_spools ─────────────────────────────────────────────────────────

ALTER TABLE filament_spools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_filament_spools"
ON filament_spools
FOR SELECT TO anon
USING (true);
