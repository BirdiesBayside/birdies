-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sgt_user_id INTEGER UNIQUE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to get user's sgt_user_id
CREATE OR REPLACE FUNCTION public.get_user_sgt_id(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sgt_user_id FROM public.profiles WHERE id = _user_id
$$;

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_sgt_id INTEGER;
BEGIN
  -- Try to find matching SGT member by email
  SELECT user_id INTO matched_sgt_id
  FROM public.sgt_members
  WHERE LOWER(user_email) = LOWER(NEW.email)
  LIMIT 1;

  -- Create profile with SGT link if found
  INSERT INTO public.profiles (id, email, sgt_user_id, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    matched_sgt_id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Add default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles (read-only for users, admin manages)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update sgt_members RLS: Remove public access, require auth
DROP POLICY IF EXISTS "Public read access" ON public.sgt_members;

CREATE POLICY "Authenticated users can view member names only"
ON public.sgt_members FOR SELECT
TO authenticated
USING (true);

-- Update sgt_scorecards RLS: Users can only see their own scorecards
DROP POLICY IF EXISTS "Public read access" ON public.sgt_scorecards;

CREATE POLICY "Users can view their own scorecards"
ON public.sgt_scorecards FOR SELECT
TO authenticated
USING (
  player_id = public.get_user_sgt_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Update sgt_tour_members RLS
DROP POLICY IF EXISTS "Public read access" ON public.sgt_tour_members;

CREATE POLICY "Users can view tour members"
ON public.sgt_tour_members FOR SELECT
TO authenticated
USING (true);

-- Update sgt_tour_standings RLS (public leaderboard is OK)
DROP POLICY IF EXISTS "Public read access" ON public.sgt_tour_standings;

CREATE POLICY "Authenticated users can view standings"
ON public.sgt_tour_standings FOR SELECT
TO authenticated
USING (true);

-- Update sgt_tournaments RLS
DROP POLICY IF EXISTS "Public read access" ON public.sgt_tournaments;

CREATE POLICY "Authenticated users can view tournaments"
ON public.sgt_tournaments FOR SELECT
TO authenticated
USING (true);

-- Update sgt_tours RLS
DROP POLICY IF EXISTS "Public read access" ON public.sgt_tours;

CREATE POLICY "Authenticated users can view tours"
ON public.sgt_tours FOR SELECT
TO authenticated
USING (true);

-- Update sgt_sync_log RLS: Admin only
DROP POLICY IF EXISTS "Public read access" ON public.sgt_sync_log;

CREATE POLICY "Admins can view sync logs"
ON public.sgt_sync_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));