-- 1. Add form_data and document_urls columns to service_requests
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS document_urls text[] DEFAULT '{}'::text[];

-- 2. Create the Storage Bucket (if it doesn't already exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service_documents', 'service_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Rules (Basic Public Read, Authenticated UI Insert)
-- Drop existing policies if they exist (so you can run this safely multiple times)
DROP POLICY IF EXISTS "Public Read Documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Documents" ON storage.objects;

-- Allow public fetching of these documents since we use unguessable UUIDs for MVPs
CREATE POLICY "Public Read Documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'service_documents');

-- Allow only logged-in users to upload documents
CREATE POLICY "Authenticated Users Can Upload Documents" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'service_documents');

-- Note: In a production environment, disable public read entirely, and configure Signed URLs only.
