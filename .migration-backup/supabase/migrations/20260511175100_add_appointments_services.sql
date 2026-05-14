-- Migration: Agendamentos e Serviços
-- Adiciona tabelas de serviços e agendamentos (calendário)

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60, -- minutes
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.client_records(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status public.appointment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers format for update
CREATE TRIGGER trg_services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_appointments_touch BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Serviços: Leitura para usuários do salão" ON public.services
  FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Serviços: Inserção para admins/owners" ON public.services
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Serviços: Atualização para admins/owners" ON public.services
  FOR UPDATE USING (
    salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Serviços: Deleção para admins/owners" ON public.services
  FOR DELETE USING (
    salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Policies for appointments
CREATE POLICY "Agendamentos: Leitura para usuários do salão" ON public.appointments
  FOR SELECT USING (salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Agendamentos: Inserção para usuários do salão" ON public.appointments
  FOR INSERT WITH CHECK (salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Agendamentos: Atualização para usuários do salão" ON public.appointments
  FOR UPDATE USING (salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Agendamentos: Deleção para admins/owners" ON public.appointments
  FOR DELETE USING (
    salon_id IN (SELECT salon_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
