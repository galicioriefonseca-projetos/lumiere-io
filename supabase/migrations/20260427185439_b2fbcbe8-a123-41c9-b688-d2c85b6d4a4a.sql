
-- 1) Substitui política permissiva de evaluations por validação rigorosa
DROP POLICY IF EXISTS "Public submit ev" ON public.evaluations;
DROP POLICY IF EXISTS "Public submit ev validated" ON public.evaluations;

CREATE POLICY "Public submit ev validated" ON public.evaluations
FOR INSERT
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
      AND p.salon_id = evaluations.salon_id
      AND p.active = true
  )
);

-- 2) Revoga execução pública das novas funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.check_goal_badge() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_excellence_badge() FROM PUBLIC, anon, authenticated;
