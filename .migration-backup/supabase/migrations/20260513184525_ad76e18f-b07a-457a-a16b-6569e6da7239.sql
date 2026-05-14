-- === 20260427180048 ===
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('master_admin', 'owner', 'manager', 'professional');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salon_plan') THEN
        CREATE TYPE public.salon_plan AS ENUM ('studio', 'elite');
    END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, salon_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master_admin')
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id AND lower(email) = 'leandropfonseca20@gmail.com')
$$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Master admin full access salons" ON public.salons;
  DROP POLICY IF EXISTS "Members read own salon" ON public.salons;
  DROP POLICY IF EXISTS "Owner updates own salon" ON public.salons;
END $$;
CREATE POLICY "Master admin full access salons" ON public.salons FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Members read own salon" ON public.salons FOR SELECT
  USING (id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owner updates own salon" ON public.salons FOR UPDATE
  USING (id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND public.has_role(auth.uid(), 'owner'));

DO $$ BEGIN
  DROP POLICY IF EXISTS "Master admin full access profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
END $$;
CREATE POLICY "Master admin full access profiles" ON public.profiles FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

DO $$ BEGIN
  DROP POLICY IF EXISTS "Master admin full access roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
END $$;
CREATE POLICY "Master admin full access roles" ON public.user_roles FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS salons_touch ON public.salons;
CREATE TRIGGER salons_touch BEFORE UPDATE ON public.salons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_salon_id UUID; is_master BOOLEAN;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';
  INSERT INTO public.salons (id, name, plan)
  VALUES (gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END)
  RETURNING id INTO new_salon_id;
  INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url)
  VALUES (NEW.id, new_salon_id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET salon_id = EXCLUDED.salon_id, email = EXCLUDED.email,
    display_name = EXCLUDED.display_name, avatar_url = EXCLUDED.avatar_url;
  IF is_master THEN
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL)
    ON CONFLICT (user_id, role, salon_id) DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id)
  ON CONFLICT (user_id, role, salon_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- === 20260427181721 — professionals + checklists + ai + audit ===
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL, role TEXT, avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professionals_salon ON public.professionals(salon_id);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
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
CREATE TRIGGER trg_pros_touch BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_pro_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s_plan public.salon_plan; cnt INT;
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
CREATE TRIGGER trg_pro_limit BEFORE INSERT ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.enforce_pro_limit();

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
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
CREATE TRIGGER trg_tpl_touch BEFORE UPDATE ON public.checklist_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.checklist_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT, created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
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
CREATE TRIGGER trg_runs_touch BEFORE UPDATE ON public.checklist_runs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.checklist_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.checklist_runs(id) ON DELETE CASCADE,
  label TEXT NOT NULL, done BOOLEAN NOT NULL DEFAULT false,
  rating INT, comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_run_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Master full items" ON public.checklist_run_items;
  DROP POLICY IF EXISTS "Salon access items" ON public.checklist_run_items;
END $$;
CREATE POLICY "Master full items" ON public.checklist_run_items FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon access items" ON public.checklist_run_items FOR ALL
  USING (run_id IN (SELECT id FROM public.checklist_runs WHERE salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (run_id IN (SELECT id FROM public.checklist_runs WHERE salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT NOT NULL, digital_signature TEXT NOT NULL,
  generated_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
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

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID, actor_id UUID, action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
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

REVOKE EXECUTE ON FUNCTION public.enforce_pro_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_master_admin(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;