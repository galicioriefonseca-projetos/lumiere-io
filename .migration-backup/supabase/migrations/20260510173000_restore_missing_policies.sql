
-- Restore policies for evaluations and achievements
-- They were dropped in 20260509190000_recursion_silver_bullet.sql but not re-created

-- ACHIEVEMENTS
CREATE POLICY "ach_select_v4" ON public.achievements FOR SELECT TO authenticated
  USING (public.has_pro_access(salon_id, ARRAY[]::TEXT[]));

CREATE POLICY "ach_insert_v4" ON public.achievements FOR INSERT TO authenticated
  WITH CHECK (public.has_pro_access(salon_id, ARRAY[]::TEXT[]));

CREATE POLICY "ach_manage_v4" ON public.achievements FOR UPDATE TO authenticated
  USING (public.has_pro_access(salon_id, ARRAY['owner', 'manager']));

CREATE POLICY "ach_delete_v4" ON public.achievements FOR DELETE TO authenticated
  USING (public.has_pro_access(salon_id, ARRAY['owner', 'manager']));

-- EVALUATIONS
CREATE POLICY "ev_select_v4" ON public.evaluations FOR SELECT TO authenticated
  USING (public.has_pro_access(salon_id, ARRAY[]::TEXT[]));

CREATE POLICY "ev_insert_public_v4" ON public.evaluations FOR INSERT
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND EXISTS (
      -- Check if professional belongs to the salon
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id
        AND p.salon_id = evaluations.salon_id
        AND p.active = true
    )
  );
