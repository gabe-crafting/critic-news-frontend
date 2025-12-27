# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_create_user_profiles.sql`
4. Paste and execute the SQL in the SQL Editor

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

Or manually:

```bash
supabase migration up
```

## Migration Files

### 001_create_user_profiles.sql

Creates the `user_profiles` table with:
- `id` (UUID, references auth.users)
- `name` (TEXT, nullable)
- `description` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Security:**
- Row Level Security (RLS) is enabled
- Users can view all profiles
- Users can only insert/update their own profile
- Automatic `updated_at` timestamp trigger

### 002_add_profile_picture_url.sql

Adds the `profile_picture_url` column to the `user_profiles` table.

## Storage Setup

### setup_profile_pictures_bucket.sql

Creates the storage bucket and policies for profile pictures:

1. **Run the storage setup script:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/storage/setup_profile_pictures_bucket.sql`
   - Execute the SQL

2. **Or manually create the bucket:**
   - Go to Supabase Dashboard → Storage
   - Create a new bucket named `profile-pictures`
   - Set it as **Public**
   - Then run the policies from the SQL file

**Storage Policies:**
- Public read access (anyone can view profile pictures)
- Authenticated users can upload/update/delete their own profile pictures
- Files are organized by user ID: `profile-pictures/{userId}/{filename}`

## Table Structure

```sql
user_profiles
├── id (UUID, PK, FK -> auth.users)
├── name (TEXT, nullable)
├── description (TEXT, nullable)
├── profile_picture_url (TEXT, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Image Optimization

Profile pictures are automatically resized on the client side before upload:
- Maximum dimensions: 400x400 pixels
- Format: JPEG
- Quality: 80%
- This significantly reduces file size while maintaining good image quality

