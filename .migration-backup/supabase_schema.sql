-- 1. ENUMS E TIPOS
CREATE TYPE achievement_kind AS ENUM ('service', 'product');
CREATE TYPE app_role AS ENUM ('master_admin', 'owner', 'manager', 'professional');
CREATE TYPE business_type AS ENUM ('salon', 'clinic');
CREATE TYPE salon_plan AS ENUM ('studio', 'elite');

-- 2. TABELAS BASE (SEM CHAVES ESTRANGEIRAS DEPENDENTES)
CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activation_status TEXT NOT NULL DEFAULT 'active',
    brand_accent_color TEXT,
    brand_primary_color TEXT,
    business_type business_type NOT NULL DEFAULT 'salon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    has_custom_branding BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    logo_url TEXT,
    name TEXT NOT NULL,
    onboarded_at TIMESTAMPTZ,
    owner_name TEXT,
    phone TEXT,
    plan salon_plan NOT NULL DEFAULT 'studio',
    tax_id TEXT,
    tutorial_seen_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PERFIS E AUTENTICAÇÃO
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    birth_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    display_name TEXT,
    email TEXT NOT NULL,
    full_name TEXT,
    salon_id UUID REFERENCES salons(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    username TEXT
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    role app_role NOT NULL,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. EQUIPE E SERVIÇOS
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    role TEXT,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active BOOLEAN NOT NULL DEFAULT true,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    icon TEXT,
    name TEXT NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    duration INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CLIENTES E ROTINA
CREATE TABLE client_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anamnesis JSONB,
    birth_date TIMESTAMPTZ,
    client_email TEXT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    photos JSONB,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_date TIMESTAMPTZ NOT NULL,
    client_id UUID REFERENCES client_records(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    notes TEXT,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. METAS, AVALIAÇÕES E RECOMPENSAS
CREATE TABLE salon_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    month INTEGER NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    target_revenue NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    year INTEGER NOT NULL
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    client_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    description TEXT NOT NULL,
    kind achievement_kind NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT now(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE
);

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE
);

CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active BOOLEAN NOT NULL DEFAULT true,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    percent NUMERIC NOT NULL,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
    client_name TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE
);

-- 7. CHECKLISTS
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,
    items JSONB NOT NULL,
    name TEXT NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    run_date TIMESTAMPTZ NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    template_id UUID REFERENCES checklist_templates(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_run_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    done BOOLEAN NOT NULL,
    label TEXT NOT NULL,
    rating INTEGER,
    run_id UUID NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE
);

-- 8. SISTEMA E LOGS
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    digital_signature TEXT NOT NULL,
    generated_by UUID REFERENCES auth.users(id),
    kind TEXT NOT NULL,
    model TEXT NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    meta JSONB NOT NULL,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE
);

-- 9. FUNÇÕES GERAIS E TRIGGERS ÚTEIS
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_master_admin(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'master_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION salon_is_active(_salon uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM salons WHERE id = _salon AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
