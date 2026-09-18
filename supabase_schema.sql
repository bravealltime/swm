-- =========================================================================
-- Summoners War Master (SWM) - Global Cloud User Profiles Table
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Create table for storing user profile and SWEX data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  wizard_name TEXT,
  wizard_id TEXT,
  box_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security (RLS) so users can only access their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can view their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Policy: Authenticated users can insert/update their own profile
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.user_profiles;
CREATE POLICY "Users can upsert own profile"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Index for ultra-fast lookup by user ID
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
