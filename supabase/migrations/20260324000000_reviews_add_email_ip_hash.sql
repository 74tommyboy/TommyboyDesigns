-- Add email and ip_hash columns to reviews table for public submission support
-- email: captured from reviewers claiming purchaser status (admin-only, not shown publicly)
-- ip_hash: SHA256 hash of client IP for rate limiting (1 submission/IP/hour)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ip_hash text;
