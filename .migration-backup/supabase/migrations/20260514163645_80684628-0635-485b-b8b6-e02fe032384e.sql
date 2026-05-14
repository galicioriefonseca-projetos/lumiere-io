-- =================== SALON GOALS ===================
CREATE TABLE IF NOT EXISTS public.salon_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (salon_id, year, month)
);
ALTER TABLE public.salon_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master full goals" ON public.salon_goals;
DROP POLICY IF EXISTS "Salon members read goals" ON public.salon_goals;
DROP POLICY IF EXISTS "Owners manage goals" ON public.salon_goals;
CREATE POLICY "Master full goals" ON public.salon_goals FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon members read goals" ON public.salon_goals FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage goals" ON public.salon_goals FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));
DROP TRIGGER IF EXISTS trg_goals_updated ON public.salon_goals;
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.salon_goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =================== ACHIEVEMENTS ===================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_kind') THEN
    CREATE TYPE public.achievement_kind AS ENUM ('service','product');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  kind public.achievement_kind NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  client_name TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_achievements_salon_date ON public.achievements (salon_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_pro ON public.achievements (professional_id, occurred_at DESC);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master full ach" ON public.achievements;
DROP POLICY IF EXISTS "Salon read ach" ON public.achievements;
DROP POLICY IF EXISTS "Salon insert ach" ON public.achievements;
DROP POLICY IF EXISTS "Owners modify ach" ON public.achievements;
DROP POLICY IF EXISTS "Owners delete ach" ON public.achievements;
CREATE POLICY "Master full ach" ON public.achievements FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read ach" ON public.achievements FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon insert ach" ON public.achievements FOR INSERT WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners modify ach" ON public.achievements FOR UPDATE USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));
CREATE POLICY "Owners delete ach" ON public.achievements FOR DELETE USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

-- =================== EVALUATIONS ===================
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  achievement_id UUID,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evaluations_pro_date ON public.evaluations (professional_id, created_at DESC);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master full ev" ON public.evaluations;
DROP POLICY IF EXISTS "Salon read ev" ON public.evaluations;
DROP POLICY IF EXISTS "Public submit ev" ON public.evaluations;
DROP POLICY IF EXISTS "Public submit ev validated" ON public.evaluations;
CREATE POLICY "Master full ev" ON public.evaluations FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read ev" ON public.evaluations FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Public submit ev validated" ON public.evaluations FOR INSERT
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND salon_id IS NOT NULL AND professional_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.salon_id = evaluations.salon_id AND p.active = true)
  );

-- =================== BADGES ===================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  reference_month DATE NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, code, reference_month)
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master full badges" ON public.badges;
DROP POLICY IF EXISTS "Salon read badges" ON public.badges;
DROP POLICY IF EXISTS "System insert badges" ON public.badges;
CREATE POLICY "Master full badges" ON public.badges FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read badges" ON public.badges FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "System insert badges" ON public.badges FOR INSERT WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));

-- =================== TRIGGERS GAMIFICAÇÃO ===================
CREATE OR REPLACE FUNCTION public.check_goal_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_year INT := EXTRACT(YEAR FROM NEW.occurred_at)::INT;
        v_month INT := EXTRACT(MONTH FROM NEW.occurred_at)::INT;
        v_ref DATE := make_date(v_year, v_month, 1);
        v_target NUMERIC; v_pro_count INT; v_pro_revenue NUMERIC; v_pro_share NUMERIC;
BEGIN
  SELECT target_revenue INTO v_target FROM public.salon_goals WHERE salon_id = NEW.salon_id AND year = v_year AND month = v_month;
  IF v_target IS NULL OR v_target = 0 THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_pro_count FROM public.professionals WHERE salon_id = NEW.salon_id AND active = true;
  IF v_pro_count = 0 THEN RETURN NEW; END IF;
  v_pro_share := v_target / v_pro_count;
  SELECT COALESCE(sum(amount),0) INTO v_pro_revenue FROM public.achievements
    WHERE professional_id = NEW.professional_id AND occurred_at >= v_ref AND occurred_at < (v_ref + INTERVAL '1 month');
  IF v_pro_revenue >= v_pro_share * 1.10 THEN
    INSERT INTO public.badges (salon_id, professional_id, code, label, reference_month)
    VALUES (NEW.salon_id, NEW.professional_id, 'goal_110', 'Meta 110% Superada', v_ref)
    ON CONFLICT (professional_id, code, reference_month) DO NOTHING;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_check_goal_badge ON public.achievements;
CREATE TRIGGER trg_check_goal_badge AFTER INSERT ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.check_goal_badge();

CREATE OR REPLACE FUNCTION public.check_excellence_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_avg NUMERIC; v_count INT; v_ref DATE := date_trunc('month', NEW.created_at)::DATE;
BEGIN
  SELECT AVG(rating)::NUMERIC, COUNT(*) INTO v_avg, v_count
    FROM public.evaluations WHERE professional_id = NEW.professional_id AND created_at >= now() - INTERVAL '30 days';
  IF v_count >= 5 AND v_avg >= 5.0 THEN
    INSERT INTO public.badges (salon_id, professional_id, code, label, reference_month)
    VALUES (NEW.salon_id, NEW.professional_id, 'excellence_5', 'Excelência 5.0', v_ref)
    ON CONFLICT (professional_id, code, reference_month) DO NOTHING;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_check_excellence_badge ON public.evaluations;
CREATE TRIGGER trg_check_excellence_badge AFTER INSERT ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.check_excellence_badge();

-- =================== SALONS: licença & branding ===================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
    CREATE TYPE public.business_type AS ENUM ('salon','clinic');
  END IF;
END $$;

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS business_type public.business_type NOT NULL DEFAULT 'salon',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS has_custom_branding boolean NOT NULL DEFAULT false;

ALTER TABLE public.salons ALTER COLUMN is_active SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.salon_is_active(_salon uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.salons WHERE id = _salon), false)
$$;

-- handle_new_user atualizado: master = ativo + elite, demais = pending+inactive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_salon_id UUID; is_master BOOLEAN;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';
  INSERT INTO public.salons (id, name, plan, is_active, activation_status, business_type)
  VALUES (gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
    is_master,
    CASE WHEN is_master THEN 'active' ELSE 'pending' END,
    'salon')
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
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='achievements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='evaluations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='badges') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.badges;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='salons') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salons;
  END IF;
END $$;
