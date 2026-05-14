
-- ==========================================
-- FINAL ATTEMPT TO KILL RECURSION IN PROFESSIONALS
-- Using specialized SECURITY DEFINER helper to exit RLS context
-- ==========================================

-- 1. Helper function for management access (SECURITY DEFINER exits RLS)
CREATE OR REPLACE FUNCTION public.check_pro_management_access(_pro_salon_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  is_master BOOLEAN;
  has_access BOOLEAN;
BEGIN
  -- 1. Master bypass (JWT check is zero cost)
  is_master := (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com') 
               OR (auth.jwt() -> 'user_metadata' ->> 'is_master')::boolean;
  
  IF is_master THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Database check (Bypasses RLS of profiles and user_roles because of SECURITY DEFINER)
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid() 
      AND p.salon_id = _pro_salon_id
      AND ur.role IN ('owner', 'manager')
  ) INTO has_access;

  RETURN has_access;
END;
$$;

-- 2. Cleanup and re-apply policies to professionals specifically
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['professionals', 'user_roles', 'profiles', 'salons', 'evaluations', 'achievements'])
    LOOP
        EXECUTE (
            SELECT coalesce(string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.' || quote_ident(t) || ';', ' '), 'SELECT 1;')
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = t
        );
    END LOOP;
END $$;

-- Policies for USER_ROLES (FLAT)
CREATE POLICY "user_roles_read_v2" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

CREATE POLICY "user_roles_master_v2" ON public.user_roles FOR ALL TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- Policies for PROFILES (FLAT)
CREATE POLICY "profiles_read_v2" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

CREATE POLICY "profiles_update_v2" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- Policies for SALONS (Check profiles - safe because profiles_read is flat)
CREATE POLICY "salons_read_v2" ON public.salons FOR SELECT TO authenticated
  USING (
    id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  );

-- Policies for PROFESSIONALS
-- Leitura: Simples subquery (profiles_read é flat, então não recursa)
CREATE POLICY "pros_select_v2" ON public.professionals 
  FOR SELECT TO authenticated
  USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  );

-- Escrita: Usa a função SECURITY DEFINER (Silver Bullet)
CREATE POLICY "pros_manage_v2" ON public.professionals 
  FOR ALL TO authenticated
  USING (public.check_pro_management_access(salon_id))
  WITH CHECK (public.check_pro_management_access(salon_id));

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.check_pro_management_access(UUID) TO authenticated;
