-- supabase/migrations/20260525_add_product_type_to_custom_inquiries.sql
-- Add product_type to distinguish tag vs coaster inquiries
ALTER TABLE custom_inquiries
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'tag';

-- Make attachment nullable so coaster inquiries can omit it
ALTER TABLE custom_inquiries
  ALTER COLUMN attachment DROP NOT NULL,
  ALTER COLUMN attachment DROP DEFAULT;
