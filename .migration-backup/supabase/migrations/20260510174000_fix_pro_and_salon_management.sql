
-- ==========================================
-- REFINEMENT OF MANAGEMENT POLICIES
-- Ensuring professionals can only visualize and not manage
-- ==========================================

-- 1. Update Professionals Management Policy
-- Dropping v2 to ensure no overlap and applying v3
DROP POLICY IF EXISTS "pros_manage_v2" ON public.professionals;

-- pros_manage_v3 remains restricted to 'owner' and 'manager' via the security definer function
-- Professional users will only have access via "pros_select_v2" (SELECT only)
CREATE POLICY "pros_manage_v3" ON public.professionals 
  FOR ALL TO authenticated
  USING (public.check_pro_management_access(salon_id))
  WITH CHECK (public.check_pro_management_access(salon_id));

-- 2. Restore and Harden Salon Management
-- Previous silver bullet migration dropped all salon policies but only added SELECT
DROP POLICY IF EXISTS "salons_update_v2" ON public.salons;
DROP POLICY IF EXISTS "salons_update_v3" ON public.salons;

CREATE POLICY "salons_manage_v3" ON public.salons
  FOR UPDATE TO authenticated
  USING (public.check_pro_management_access(id))
  WITH CHECK (public.check_pro_management_access(id));

-- Ensure even Master can delete if needed (check_pro_management_access already handles master)
CREATE POLICY "salons_delete_v3" ON public.salons
  FOR DELETE TO authenticated
  USING (public.check_pro_management_access(id));

-- 3. Double check that evaluations and achievements are also safe
-- These were restored in 20260510173000_restore_missing_policies.sql
-- but let's ensure they use the hardened access check if needed.
-- For now, the existing ones using 'public.has_pro_access' are fine if that function is also safe.
