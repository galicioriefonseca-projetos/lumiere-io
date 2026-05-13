-- Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('master_admin', 'owner', 'manager', 'professional');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salon_plan') THEN
        CREATE TYPE public.salon_plan AS ENUM ('studio', 'elite');
    END IF;
END $$;

-- Salons (tenants)
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Meu Salão',
  plan public.salon_plan NOT NULL DEFAULT 'studio',
  has_custom_branding BOOLEAN NOT NULL DEFAULT false,
  brand_primary_color TEXT,
  brand_accent_color TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, salon_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- is_master_admin: by role OR by hardcoded master email
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master_admin')
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id AND lower(email) = 'leandropfonseca20@gmail.com')
$$;

-- RLS: salons
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master admin full access salons" ON public.salons;
  DROP POLICY IF EXISTS "Members read own salon" ON public.salons;
  DROP POLICY IF EXISTS "Owner updates own salon" ON public.salons;
END $$;

CREATE POLICY "Master admin full access salons"
  ON public.salons FOR ALL
  USING (public.is_master_admin(auth.uid()))
  WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Members read own salon"
  ON public.salons FOR SELECT
  USING (id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owner updates own salon"
  ON public.salons FOR UPDATE
  USING (id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND public.has_role(auth.uid(), 'owner'));

-- RLS: profiles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master admin full access profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
END $$;

CREATE POLICY "Master admin full access profiles"
  ON public.profiles FOR ALL
  USING (public.is_master_admin(auth.uid()))
  WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- RLS: user_roles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master admin full access roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
END $$;

CREATE POLICY "Master admin full access roles"
  ON public.user_roles FOR ALL
  USING (public.is_master_admin(auth.uid()))
  WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS salons_touch ON public.salons;
CREATE TRIGGER salons_touch BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- handle_new_user: create salon + profile + role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_salon_id UUID;
  is_master BOOLEAN;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';

  INSERT INTO public.salons (id, name, plan)
  VALUES (
    gen_random_uuid(), -- Ensure we have an ID for linking
    COALESCE(NEW.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO new_salon_id;

  -- Default to fallback id if insert fails due to existing salon (unlikely but safe)
  IF new_salon_id IS NULL THEN
      SELECT id INTO new_salon_id FROM public.salons WHERE name = COALESCE(NEW.raw_user_meta_data->>'salon_name', 'Meu Salão') LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_salon_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    salon_id = EXCLUDED.salon_id,
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url;

  IF is_master THEN
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL)
    ON CONFLICT (user_id, role, salon_id) DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id)
  ON CONFLICT (user_id, role, salon_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();