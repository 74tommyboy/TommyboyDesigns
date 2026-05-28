-- Add scheduled vacation date range columns
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS vacation_from date,
  ADD COLUMN IF NOT EXISTS vacation_to date;
