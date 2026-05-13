-- Professionals
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professionals_salon ON public.professionals(salon_id);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full pros" ON public.professionals;
  DROP POLICY IF EXISTS "Salon members read pros" ON public.professionals;
  DROP POLICY IF EXISTS "Owners manage pros" ON public.professionals;
END $$;

CREATE POLICY "Master full pros" ON public.professionals FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon members read pros" ON public.professionals FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage pros" ON public.professionals FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

DROP TRIGGER IF EXISTS trg_pros_touch ON public.professionals;
CREATE TRIGGER trg_pros_touch BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Plan limit trigger (Studio = 5)
CREATE OR REPLACE FUNCTION public.enforce_pro_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  s_plan public.salon_plan;
  cnt INT;
BEGIN
  SELECT plan INTO s_plan FROM public.salons WHERE id = NEW.salon_id;
  IF s_plan = 'studio' THEN
    SELECT count(*) INTO cnt FROM public.professionals WHERE salon_id = NEW.salon_id AND active = true;
    IF cnt >= 5 THEN
      RAISE EXCEPTION 'Limite do plano Studio atingido (5 profissionais). Faça upgrade para Elite.';
    END IF;
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_pro_limit ON public.professionals;
CREATE TRIGGER trg_pro_limit BEFORE INSERT ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.enforce_pro_limit();

-- Checklist templates
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tpl_salon ON public.checklist_templates(salon_id);
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full tpl" ON public.checklist_templates;
  DROP POLICY IF EXISTS "Salon members read tpl" ON public.checklist_templates;
  DROP POLICY IF EXISTS "Owners manage tpl" ON public.checklist_templates;
END $$;

CREATE POLICY "Master full tpl" ON public.checklist_templates FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon members read tpl" ON public.checklist_templates FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage tpl" ON public.checklist_templates FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

DROP TRIGGER IF EXISTS trg_tpl_touch ON public.checklist_templates;
CREATE TRIGGER trg_tpl_touch BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Checklist runs
CREATE TABLE IF NOT EXISTS public.checklist_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_runs_salon_date ON public.checklist_runs(salon_id, run_date DESC);
ALTER TABLE public.checklist_runs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full runs" ON public.checklist_runs;
  DROP POLICY IF EXISTS "Salon members read runs" ON public.checklist_runs;
  DROP POLICY IF EXISTS "Salon members write runs" ON public.checklist_runs;
  DROP POLICY IF EXISTS "Salon members update runs" ON public.checklist_runs;
END $$;

CREATE POLICY "Master full runs" ON public.checklist_runs FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon members read runs" ON public.checklist_runs FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon members write runs" ON public.checklist_runs FOR INSERT
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon members update runs" ON public.checklist_runs FOR UPDATE
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_runs_touch ON public.checklist_runs;
CREATE TRIGGER trg_runs_touch BEFORE UPDATE ON public.checklist_runs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Run items
CREATE TABLE IF NOT EXISTS public.checklist_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.checklist_runs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  rating INT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_run_items_run ON public.checklist_run_items(run_id);
ALTER TABLE public.checklist_run_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full items" ON public.checklist_run_items;
  DROP POLICY IF EXISTS "Salon access items" ON public.checklist_run_items;
END $$;

CREATE POLICY "Master full items" ON public.checklist_run_items FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon access items" ON public.checklist_run_items FOR ALL
  USING (run_id IN (SELECT id FROM public.checklist_runs WHERE salon_id IN
                    (SELECT salon_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (run_id IN (SELECT id FROM public.checklist_runs WHERE salon_id IN
                    (SELECT salon_id FROM public.profiles WHERE id = auth.uid())));

-- AI insights with digital signature
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_salon ON public.ai_insights(salon_id, created_at DESC);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full ai" ON public.ai_insights;
  DROP POLICY IF EXISTS "Salon members read ai" ON public.ai_insights;
  DROP POLICY IF EXISTS "Salon members write ai" ON public.ai_insights;
END $$;

CREATE POLICY "Master full ai" ON public.ai_insights FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon members read ai" ON public.ai_insights FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon members write ai" ON public.ai_insights FOR INSERT
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID,
  actor_id UUID,
  action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full audit" ON public.audit_log;
  DROP POLICY IF EXISTS "Salon read audit" ON public.audit_log;
  DROP POLICY IF EXISTS "Salon insert audit" ON public.audit_log;
END $$;

CREATE POLICY "Master full audit" ON public.audit_log FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read audit" ON public.audit_log FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon insert audit" ON public.audit_log FOR INSERT
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
