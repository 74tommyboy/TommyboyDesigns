-- supabase/migrations/20260525_add_product_type_to_custom_inquiries.sql
ALTER TABLE custom_inquiries
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'tag';
