
-- 1. New columns on salons
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS owner_name text;

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_activation_status_check;
ALTER TABLE public.salons
  ADD CONSTRAINT salons_activation_status_check
  CHECK (activation_status IN ('pending','active','suspended'));

-- 2. Helper: is salon active?
CREATE OR REPLACE FUNCTION public.salon_is_active(_salon uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active AND activation_status = 'active'
     FROM public.salons WHERE id = _salon),
    false
  );
$$;

-- 3. Update handle_new_user: master auto-active+elite, others pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_salon_id UUID;
  is_master BOOLEAN;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';

  INSERT INTO public.salons (name, plan, is_active, activation_status, owner_name)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
    true,
    CASE WHEN is_master THEN 'active' ELSE 'pending' END,
    COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', NULL)
  )
  RETURNING id INTO new_salon_id;

  INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_salon_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF is_master THEN
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL);
  END IF;
  INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id);

  RETURN NEW;
END;
$function$;

-- 4. Studio limit: max 6 users (manager + professional) per salon
CREATE OR REPLACE FUNCTION public.enforce_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s_plan public.salon_plan;
  cnt INT;
BEGIN
  IF NEW.salon_id IS NULL OR NEW.role NOT IN ('manager','professional') THEN
    RETURN NEW;
  END IF;
  SELECT plan INTO s_plan FROM public.salons WHERE id = NEW.salon_id;
  IF s_plan = 'studio' THEN
    SELECT count(*) INTO cnt FROM public.user_roles
    WHERE salon_id = NEW.salon_id AND role IN ('manager','professional');
    IF cnt >= 6 THEN
      RAISE EXCEPTION 'Limite do plano Studio atingido (6 usuários por salão). Faça upgrade para Elite.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_limit_trg ON public.user_roles;
CREATE TRIGGER enforce_user_limit_trg
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_limit();

-- 5. Block writes on operational tables when salon is suspended (Master bypass remains via existing master policies)
-- Strategy: add a restrictive-style policy via additional check using a NEW policy that wraps salon_is_active.
-- We REPLACE the existing INSERT/UPDATE policies on the operational tables to require salon_is_active.

-- ACHIEVEMENTS
DROP POLICY IF EXISTS "Salon insert ach" ON public.achievements;
CREATE POLICY "Salon insert ach" ON public.achievements
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND public.salon_is_active(salon_id)
  );

DROP POLICY IF EXISTS "Owners modify ach" ON public.achievements;
CREATE POLICY "Owners modify ach" ON public.achievements
  FOR UPDATE USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  );

-- EVALUATIONS public insert: also require salon active
DROP POLICY IF EXISTS "Public submit ev validated" ON public.evaluations;
CREATE POLICY "Public submit ev validated" ON public.evaluations
  FOR INSERT WITH CHECK (
    rating >= 1 AND rating <= 5
    AND (comment IS NULL OR length(comment) <= 1000)
    AND (client_name IS NULL OR length(client_name) <= 120)
    AND EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = evaluations.professional_id
        AND p.salon_id = evaluations.salon_id
        AND p.active = true
    )
    AND public.salon_is_active(evaluations.salon_id)
  );

-- CLIENT_RECORDS write
DROP POLICY IF EXISTS "Salon access records" ON public.client_records;
DROP POLICY IF EXISTS "Salon read records" ON public.client_records;
DROP POLICY IF EXISTS "Salon write records" ON public.client_records;
DROP POLICY IF EXISTS "Salon update records" ON public.client_records;
DROP POLICY IF EXISTS "Salon delete records" ON public.client_records;

CREATE POLICY "Salon read records" ON public.client_records
  FOR SELECT USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "Salon write records" ON public.client_records
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND public.salon_is_active(salon_id)
  );
CREATE POLICY "Salon update records" ON public.client_records
  FOR UPDATE USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND public.salon_is_active(salon_id)
  );
CREATE POLICY "Salon delete records" ON public.client_records
  FOR DELETE USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND public.salon_is_active(salon_id)
  );

-- COMMISSIONS write tighten
DROP POLICY IF EXISTS "Owners manage commissions" ON public.commissions;
CREATE POLICY "Owners manage commissions" ON public.commissions
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  )
  WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  );

-- SERVICE_CATEGORIES write
DROP POLICY IF EXISTS "Owners manage categories" ON public.service_categories;
CREATE POLICY "Owners manage categories" ON public.service_categories
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  )
  WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  );

-- SALON_GOALS write
DROP POLICY IF EXISTS "Owners manage goals" ON public.salon_goals;
CREATE POLICY "Owners manage goals" ON public.salon_goals
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  )
  WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  );

-- PROFESSIONALS write
DROP POLICY IF EXISTS "Owners manage pros" ON public.professionals;
CREATE POLICY "Owners manage pros" ON public.professionals
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  )
  WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  );

-- CHECKLIST_TEMPLATES write
DROP POLICY IF EXISTS "Owners manage tpl" ON public.checklist_templates;
CREATE POLICY "Owners manage tpl" ON public.checklist_templates
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  )
  WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'manager'::app_role))
    AND public.salon_is_active(salon_id)
  );

-- CHECKLIST_RUNS insert/update
DROP POLICY IF EXISTS "Salon members write runs" ON public.checklist_runs;
CREATE POLICY "Salon members write runs" ON public.checklist_runs
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND public.salon_is_active(salon_id)
  );
DROP POLICY IF EXISTS "Salon members update runs" ON public.checklist_runs;
CREATE POLICY "Salon members update runs" ON public.checklist_runs
  FOR UPDATE USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    AND public.salon_is_active(salon_id)
  );
