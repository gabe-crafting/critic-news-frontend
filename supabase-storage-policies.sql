-- ============================================
-- Supabase Storage RLS Policies for profile-pictures bucket
-- ============================================
-- Run these scripts in your Supabase SQL Editor
-- Make sure the 'profile-pictures' bucket exists first!
-- ============================================

-- Policy 1: Allow authenticated users to INSERT (upload) to their own folder
-- Users can only upload files to folders matching their user ID
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'::text
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy 2: Allow everyone to SELECT (read) profile pictures
-- This makes profile pictures publicly accessible
CREATE POLICY "Anyone can read profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profile-pictures'::text
);

-- Policy 3: Allow authenticated users to DELETE from their own folder
-- Users can only delete files from their own folder
CREATE POLICY "Users can delete from their own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'::text
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy 4: Allow authenticated users to UPDATE files in their own folder
-- Users can only update files in their own folder
CREATE POLICY "Users can update files in their own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'::text
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'profile-pictures'::text
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

