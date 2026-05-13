
-- ==========================================
-- PERFORMANCE, SECURITY AND RECURSION KILLER
-- ==========================================

-- 1. Indices for performance (Advisor suggestion)
CREATE INDEX IF NOT EXISTS idx_professionals_salon_id ON public.professionals(salon_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_salon_id ON public.user_roles(salon_id);
CREATE INDEX IF NOT EXISTS idx_profiles_salon_id ON public.profiles(salon_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_salon_id ON public.ai_insights(salon_id);

-- 2. Unified Security Helper for Professionals
-- This completely exits the RLS context to check membership and roles.
CREATE OR REPLACE FUNCTION public.has_pro_access(_salon_id UUID, _required_roles TEXT[] DEFAULT ARRAY['owner', 'manager'])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT := lower(auth.jwt() ->> 'email');
  v_is_master BOOLEAN;
  v_has_role BOOLEAN;
BEGIN
  -- 1. Master Bypass (Cost = 0)
  v_is_master := (v_email = 'leandropfonseca20@gmail.com') 
                 OR (auth.jwt() -> 'user_metadata' ->> 'is_master')::boolean;
  
  IF v_is_master THEN
    RETURN TRUE;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Simple membership/role check
  -- Since it is SECURITY DEFINER, it doesn't trigger RLS on profiles/user_roles
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = v_user_id 
      AND p.salon_id = _salon_id
      AND (
        -- If roles is empty, just check membership
        cardinality(_required_roles) = 0 
        OR ur.role = ANY(_required_roles)
      )
  ) INTO v_has_role;

  RETURN v_has_role;
END;
$$;

-- 3. Lockdown Professionals Policies
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    EXECUTE (
        SELECT coalesce(string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.professionals;', ' '), 'SELECT 1;')
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'professionals'
    );
END $$;

-- Select: Any member can see team
CREATE POLICY "pros_select_v3" ON public.professionals 
  FOR SELECT TO authenticated
  USING (public.has_pro_access(salon_id, ARRAY[]::TEXT[]));

-- Manage: Only owner/manager
CREATE POLICY "pros_manage_v3" ON public.professionals 
  FOR ALL TO authenticated
  USING (public.has_pro_access(salon_id, ARRAY['owner', 'manager']))
  WITH CHECK (public.has_pro_access(salon_id, ARRAY['owner', 'manager']));

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 4. Security hardening for SECURITY DEFINER functions (Advisor suggestion)
REVOKE EXECUTE ON FUNCTION public.has_pro_access(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_pro_access(UUID, TEXT[]) TO authenticated;

-- Ensure other critical helper functions are also restricted
REVOKE EXECUTE ON FUNCTION public.is_master_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_master_admin(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
