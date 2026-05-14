-- 1. business_type
DO $$ BEGIN
  CREATE TYPE public.business_type AS ENUM ('salon', 'clinic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS business_type public.business_type NOT NULL DEFAULT 'salon',
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- 2. service_categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master full categories" ON public.service_categories;
DROP POLICY IF EXISTS "Salon read categories" ON public.service_categories;
DROP POLICY IF EXISTS "Owners manage categories" ON public.service_categories;
CREATE POLICY "Master full categories" ON public.service_categories FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read categories" ON public.service_categories FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage categories" ON public.service_categories FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

DROP TRIGGER IF EXISTS trg_categories_touch ON public.service_categories;
CREATE TRIGGER trg_categories_touch BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS category_id UUID;

-- 3. client_records
CREATE TABLE IF NOT EXISTS public.client_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  professional_id UUID,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  birth_date DATE,
  anamnesis JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master full records" ON public.client_records;
DROP POLICY IF EXISTS "Salon access records" ON public.client_records;
CREATE POLICY "Master full records" ON public.client_records FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon access records" ON public.client_records FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_records_touch ON public.client_records;
CREATE TRIGGER trg_records_touch BEFORE UPDATE ON public.client_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. commissions
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  category_id UUID,
  percent NUMERIC(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS commissions_unique_pro_cat
  ON public.commissions (salon_id, professional_id, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master full commissions" ON public.commissions;
DROP POLICY IF EXISTS "Salon read commissions" ON public.commissions;
DROP POLICY IF EXISTS "Owners manage commissions" ON public.commissions;
CREATE POLICY "Master full commissions" ON public.commissions FOR ALL
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read commissions" ON public.commissions FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage commissions" ON public.commissions FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
         AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));

DROP TRIGGER IF EXISTS trg_commissions_touch ON public.commissions;
CREATE TRIGGER trg_commissions_touch BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Salon members read client-photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon members write client-photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon members update client-photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon members delete client-photos" ON storage.objects;
CREATE POLICY "Salon members read client-photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'client-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()
    ));
CREATE POLICY "Salon members write client-photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()
    ));
CREATE POLICY "Salon members update client-photos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'client-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()
    ));
CREATE POLICY "Salon members delete client-photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'client-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()
    ));

-- 6. Realtime (idempotente)
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['salon_goals','client_records','commissions','service_categories'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.salon_goals REPLICA IDENTITY FULL;
ALTER TABLE public.client_records REPLICA IDENTITY FULL;
ALTER TABLE public.commissions REPLICA IDENTITY FULL;
ALTER TABLE public.service_categories REPLICA IDENTITY FULL;