
-- 1. Remove sensitive tables from realtime publication to prevent cross-salon PII leakage
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.client_records;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.commissions;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.achievements;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.evaluations;
  EXCEPTION WHEN undefined_object THEN NULL; END;
END$$;

-- 2. Tighten public evaluation submission with length limits to deter abuse
DROP POLICY IF EXISTS "Public submit ev validated" ON public.evaluations;

CREATE POLICY "Public submit ev validated"
ON public.evaluations
FOR INSERT
TO public
WITH CHECK (
  rating >= 1 AND rating <= 5
  AND (comment IS NULL OR length(comment) <= 1000)
  AND (client_name IS NULL OR length(client_name) <= 120)
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = evaluations.professional_id
      AND p.salon_id = evaluations.salon_id
      AND p.active = true
  )
);
