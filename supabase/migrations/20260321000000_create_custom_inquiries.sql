-- custom_inquiries table
CREATE TABLE IF NOT EXISTS custom_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'quoted', 'completed')),
  shape text NOT NULL,
  colors jsonb NOT NULL DEFAULT '[]',
  details jsonb NOT NULL DEFAULT '{}',
  uploads text[] NOT NULL DEFAULT '{}',
  quantity integer NOT NULL,
  contact jsonb NOT NULL,
  notes text NOT NULL DEFAULT ''
);

-- Storage bucket must be created manually in Supabase Dashboard:
-- Name: custom-inquiry-uploads, Public: OFF

-- RLS policy: allow anonymous uploads with a folder prefix
CREATE POLICY "anon_upload_custom_inquiries"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'custom-inquiry-uploads'
  AND (storage.foldername(name))[1] IS NOT NULL
);
