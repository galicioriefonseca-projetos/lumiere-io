CREATE POLICY "salons_insert_master_v4" ON public.salons
  FOR INSERT TO authenticated
  WITH CHECK (
    lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
    OR public.is_master_admin(auth.uid())
  );
