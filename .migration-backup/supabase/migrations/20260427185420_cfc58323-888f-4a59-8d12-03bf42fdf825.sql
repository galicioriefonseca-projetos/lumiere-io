
-- ============= SALON GOALS =============
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

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full goals" ON public.salon_goals;
  DROP POLICY IF EXISTS "Salon members read goals" ON public.salon_goals;
  DROP POLICY IF EXISTS "Owners manage goals" ON public.salon_goals;
END $$;

CREATE POLICY "Master full goals" ON public.salon_goals FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon members read goals" ON public.salon_goals FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage goals" ON public.salon_goals FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

DROP TRIGGER IF EXISTS trg_goals_updated ON public.salon_goals;
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.salon_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============= ACHIEVEMENTS (lançamentos) =============
DO $$ 
BEGIN
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

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full ach" ON public.achievements;
  DROP POLICY IF EXISTS "Salon read ach" ON public.achievements;
  DROP POLICY IF EXISTS "Salon insert ach" ON public.achievements;
  DROP POLICY IF EXISTS "Owners modify ach" ON public.achievements;
  DROP POLICY IF EXISTS "Owners delete ach" ON public.achievements;
END $$;

CREATE POLICY "Master full ach" ON public.achievements FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read ach" ON public.achievements FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon insert ach" ON public.achievements FOR INSERT
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners modify ach" ON public.achievements FOR UPDATE
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));
CREATE POLICY "Owners delete ach" ON public.achievements FOR DELETE
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

-- ============= EVALUATIONS =============
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

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full ev" ON public.evaluations;
  DROP POLICY IF EXISTS "Salon read ev" ON public.evaluations;
  DROP POLICY IF EXISTS "Public submit ev" ON public.evaluations;
END $$;

CREATE POLICY "Master full ev" ON public.evaluations FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read ev" ON public.evaluations FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
-- Pesquisa pública: qualquer um pode inserir avaliação (link compartilhável)
CREATE POLICY "Public submit ev" ON public.evaluations FOR INSERT
  WITH CHECK (true);

-- ============= BADGES =============
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  code TEXT NOT NULL,                 -- 'goal_110', 'excellence_5'
  label TEXT NOT NULL,
  reference_month DATE NOT NULL,      -- primeiro dia do mês
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, code, reference_month)
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Master full badges" ON public.badges;
  DROP POLICY IF EXISTS "Salon read badges" ON public.badges;
  DROP POLICY IF EXISTS "System insert badges" ON public.badges;
END $$;

CREATE POLICY "Master full badges" ON public.badges FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read badges" ON public.badges FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "System insert badges" ON public.badges FOR INSERT
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));

-- ============= GAMIFICAÇÃO: trigger meta 110% =============
CREATE OR REPLACE FUNCTION public.check_goal_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM NEW.occurred_at)::INT;
  v_month INT := EXTRACT(MONTH FROM NEW.occurred_at)::INT;
  v_ref DATE := make_date(v_year, v_month, 1);
  v_target NUMERIC;
  v_pro_count INT;
  v_pro_revenue NUMERIC;
  v_pro_share NUMERIC;
BEGIN
  SELECT target_revenue INTO v_target FROM public.salon_goals
   WHERE salon_id = NEW.salon_id AND year = v_year AND month = v_month;
  IF v_target IS NULL OR v_target = 0 THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_pro_count FROM public.professionals
   WHERE salon_id = NEW.salon_id AND active = true;
  IF v_pro_count = 0 THEN RETURN NEW; END IF;

  v_pro_share := v_target / v_pro_count;

  SELECT COALESCE(sum(amount),0) INTO v_pro_revenue FROM public.achievements
   WHERE professional_id = NEW.professional_id
     AND occurred_at >= v_ref
     AND occurred_at < (v_ref + INTERVAL '1 month');

  IF v_pro_revenue >= v_pro_share * 1.10 THEN
    INSERT INTO public.badges (salon_id, professional_id, code, label, reference_month)
    VALUES (NEW.salon_id, NEW.professional_id, 'goal_110', 'Meta 110% Superada', v_ref)
    ON CONFLICT (professional_id, code, reference_month) DO NOTHING;
  END IF;

  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_check_goal_badge ON public.achievements;
CREATE TRIGGER trg_check_goal_badge
AFTER INSERT ON public.achievements
FOR EACH ROW EXECUTE FUNCTION public.check_goal_badge();

-- ============= GAMIFICAÇÃO: trigger excelência 5.0 =============
CREATE OR REPLACE FUNCTION public.check_excellence_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_avg NUMERIC;
  v_count INT;
  v_ref DATE := date_trunc('month', NEW.created_at)::DATE;
BEGIN
  SELECT AVG(rating)::NUMERIC, COUNT(*) INTO v_avg, v_count
  FROM public.evaluations
  WHERE professional_id = NEW.professional_id
    AND created_at >= now() - INTERVAL '30 days';

  IF v_count >= 5 AND v_avg >= 5.0 THEN
    INSERT INTO public.badges (salon_id, professional_id, code, label, reference_month)
    VALUES (NEW.salon_id, NEW.professional_id, 'excellence_5', 'Excelência 5.0', v_ref)
    ON CONFLICT (professional_id, code, reference_month) DO NOTHING;
  END IF;

  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_check_excellence_badge ON public.evaluations;
CREATE TRIGGER trg_check_excellence_badge
AFTER INSERT ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.check_excellence_badge();

-- ============= REALTIME =============
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'achievements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'evaluations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'badges') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.badges;
    END IF;
END $$;

ALTER TABLE public.achievements REPLICA IDENTITY FULL;
ALTER TABLE public.evaluations REPLICA IDENTITY FULL;
ALTER TABLE public.badges REPLICA IDENTITY FULL;
