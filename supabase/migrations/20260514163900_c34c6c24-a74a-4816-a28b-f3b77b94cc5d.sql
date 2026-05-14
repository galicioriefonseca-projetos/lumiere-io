-- ============ HELPER touch fn (idempotente) ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ SERVICE CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
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
CREATE POLICY "Master full categories" ON public.service_categories FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read categories" ON public.service_categories FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage categories" ON public.service_categories FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));
DROP TRIGGER IF EXISTS trg_categories_touch ON public.service_categories;
CREATE TRIGGER trg_categories_touch BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS category_id UUID;

-- ============ CLIENT RECORDS ============
CREATE TABLE IF NOT EXISTS public.client_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
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
CREATE POLICY "Master full records" ON public.client_records FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon access records" ON public.client_records FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
DROP TRIGGER IF EXISTS trg_records_touch ON public.client_records;
CREATE TRIGGER trg_records_touch BEFORE UPDATE ON public.client_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ COMMISSIONS ============
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
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
CREATE POLICY "Master full commissions" ON public.commissions FOR ALL USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Salon read commissions" ON public.commissions FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Owners manage commissions" ON public.commissions FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')));
DROP TRIGGER IF EXISTS trg_commissions_touch ON public.commissions;
CREATE TRIGGER trg_commissions_touch BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SERVICES + APPOINTMENTS ============
DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_read" ON public.services;
DROP POLICY IF EXISTS "services_manage" ON public.services;
CREATE POLICY "services_read" ON public.services FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) OR public.is_master_admin(auth.uid()));
CREATE POLICY "services_manage" ON public.services FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')) OR public.is_master_admin(auth.uid()))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')) OR public.is_master_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_services_touch ON public.services;
CREATE TRIGGER trg_services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.client_records(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status public.appointment_status DEFAULT 'pending',
  notes TEXT,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appt_read" ON public.appointments;
DROP POLICY IF EXISTS "appt_manage" ON public.appointments;
CREATE POLICY "appt_read" ON public.appointments FOR SELECT
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) OR public.is_master_admin(auth.uid()));
CREATE POLICY "appt_manage" ON public.appointments FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) OR public.is_master_admin(auth.uid()))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) OR public.is_master_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_appointments_touch ON public.appointments;
CREATE TRIGGER trg_appointments_touch BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SALON INVITATIONS ============
CREATE TABLE IF NOT EXISTS public.salon_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'professional',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'),
  invited_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.salon_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners/Managers can manage invitations" ON public.salon_invitations;
CREATE POLICY "Owners/Managers can manage invitations" ON public.salon_invitations FOR ALL
  USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')) OR public.is_master_admin(auth.uid()))
  WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager')) OR public.is_master_admin(auth.uid()));

-- ============ EXTRAS DE PROFILES E SALONS ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS tutorial_seen_at timestamptz;

-- ============ handle_new_user (com convites) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_salon_id UUID; v_role public.app_role; v_invitation_id UUID;
  is_master BOOLEAN; v_btype public.business_type; new_salon_id UUID;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';

  SELECT id, salon_id, role INTO v_invitation_id, v_salon_id, v_role
  FROM public.salon_invitations
  WHERE lower(email) = lower(NEW.email) AND used_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_salon_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, salon_id, email, display_name, full_name, avatar_url)
    VALUES (NEW.id, v_salon_id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, v_role, v_salon_id)
    ON CONFLICT (user_id, role, salon_id) DO NOTHING;
    UPDATE public.salon_invitations SET used_at = now() WHERE id = v_invitation_id;
  ELSE
    v_btype := CASE WHEN NEW.raw_user_meta_data->>'business_type' = 'clinic' THEN 'clinic'::public.business_type ELSE 'salon'::public.business_type END;
    INSERT INTO public.salons (name, plan, is_active, activation_status, owner_name, business_type, phone, tax_id)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'salon_name',''), 'Meu Salão'),
      CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
      is_master,
      CASE WHEN is_master THEN 'active' ELSE 'pending' END,
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', ''), ''),
      v_btype,
      NULLIF(NEW.raw_user_meta_data->>'phone',''),
      NULLIF(NEW.raw_user_meta_data->>'tax_id','')
    )
    RETURNING id INTO new_salon_id;
    INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url, full_name, birth_date, username)
    VALUES (NEW.id, new_salon_id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
      NEW.raw_user_meta_data->>'avatar_url',
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date,
      NULLIF(NEW.raw_user_meta_data->>'username',''))
    ON CONFLICT (id) DO UPDATE SET salon_id = EXCLUDED.salon_id;
    IF is_master THEN
      INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL)
      ON CONFLICT (user_id, role, salon_id) DO NOTHING;
    END IF;
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id)
    ON CONFLICT (user_id, role, salon_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ create_salon_rpc (master only) ============
CREATE OR REPLACE FUNCTION public.create_salon_rpc(_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_new_salon public.salons; v_is_master boolean;
BEGIN
  v_is_master := lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com' OR public.is_master_admin(auth.uid());
  IF NOT v_is_master THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.salons (name, owner_name, business_type, plan, is_active, activation_status, onboarded_at, phone)
  VALUES (
    _payload->>'name',
    _payload->>'owner_name',
    COALESCE((_payload->>'business_type')::public.business_type, 'salon'),
    COALESCE((_payload->>'plan')::public.salon_plan, 'studio'),
    COALESCE((_payload->>'is_active')::boolean, false),
    COALESCE(_payload->>'activation_status','pending'),
    NULLIF(_payload->>'onboarded_at','')::timestamptz,
    _payload->>'phone'
  ) RETURNING * INTO v_new_salon;
  RETURN to_jsonb(v_new_salon);
END; $$;
REVOKE EXECUTE ON FUNCTION public.create_salon_rpc(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_salon_rpc(jsonb) TO authenticated;

-- ============ STORAGE BUCKET client-photos ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos','client-photos', false)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Salon members read client-photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon members write client-photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon members update client-photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon members delete client-photos" ON storage.objects;
CREATE POLICY "Salon members read client-photos" ON storage.objects FOR SELECT
  USING (bucket_id='client-photos' AND (storage.foldername(name))[1] IN (SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon members write client-photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='client-photos' AND (storage.foldername(name))[1] IN (SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon members update client-photos" ON storage.objects FOR UPDATE
  USING (bucket_id='client-photos' AND (storage.foldername(name))[1] IN (SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Salon members delete client-photos" ON storage.objects FOR DELETE
  USING (bucket_id='client-photos' AND (storage.foldername(name))[1] IN (SELECT salon_id::text FROM public.profiles WHERE id = auth.uid()));

-- ============ REALTIME ============
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['salon_goals','client_records','commissions','service_categories','services','appointments'])
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
