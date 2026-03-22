-- Add attachment column (missed in initial migration)
ALTER TABLE custom_inquiries
  ADD COLUMN attachment text NOT NULL DEFAULT 'hemp_twine'
  CHECK (attachment IN ('hemp_twine', 'bead_chain'));

-- Enable RLS to protect customer contact data from anon key access
ALTER TABLE custom_inquiries ENABLE ROW LEVEL SECURITY;
-- No anon SELECT/INSERT/UPDATE policies — only service-role can access this table
