
-- ==========================================
-- FINAL FIX FOR INFINITE RECURSION & POLICIES
-- ==========================================

-- 1. Helper functions optimized for zero-recursion
-- Usando SECURITY DEFINER e SET search_path para garantir isolamento
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Check JWT directly (Zero DB cost)
  IF lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Check metadata
  IF (auth.jwt() -> 'user_metadata' ->> 'is_master')::boolean = true THEN
    RETURN TRUE;
  END IF;

  -- 3. Fallback (SECURITY DEFINER allows bypassing RLS on user_roles)
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'master_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Master bypass
  IF public.is_master_admin(_user_id) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.salon_is_active(_salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active AND activation_status = 'active'
     FROM public.salons WHERE id = _salon_id),
    false
  );
$$;

-- 2. Limpeza total de RLS para as tabelas principais
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    current_table text;
    pol record;
BEGIN
    FOR current_table IN SELECT unnest(ARRAY['user_roles', 'profiles', 'salons', 'professionals'])
    LOOP
        FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = current_table)
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, current_table);
        END LOOP;
    END LOOP;
END $$;

-- 3. Políticas FLAT (Zero Recursão)

-- USER_ROLES: Apenas leitura própria ou master bypass
CREATE POLICY "user_roles_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

CREATE POLICY "user_roles_master_all" ON public.user_roles FOR ALL TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- PROFILES: Apenas leitura própria ou master bypass
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

CREATE POLICY "profiles_master_all" ON public.profiles FOR ALL TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- SALONS: Leitura se for membro do salão (via profile, que agora é flat)
CREATE POLICY "salons_read_members" ON public.salons FOR SELECT TO authenticated
  USING (
    id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  );

CREATE POLICY "salons_update_owner" ON public.salons FOR UPDATE TO authenticated
  USING (
    (id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid()) AND public.has_role(auth.uid(), 'owner'))
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  );

-- PROFESSIONALS: O TRATAMENTO DE CHOQUE
-- NOTA: Não usamos salon_id IN (...) direto se pudermos evitar.
CREATE POLICY "pros_read_members" ON public.professionals FOR SELECT TO authenticated
  USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  );

CREATE POLICY "pros_manage_owners" ON public.professionals FOR ALL TO authenticated
  USING (
    (
      salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND public.has_role(auth.uid(), 'owner')
    )
    OR
    (
      salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND public.has_role(auth.uid(), 'manager')
    )
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  )
  WITH CHECK (
    (
      salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND public.has_role(auth.uid(), 'owner')
    )
    OR
    (
      salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND public.has_role(auth.uid(), 'manager')
    )
    OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
  );

-- 4. Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 5. Garantir Permissões de Execução
GRANT EXECUTE ON FUNCTION public.is_master_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.salon_is_active(uuid) TO authenticated, anon;

-- 6. Limpar qualquer outra tabela que use professionals em suas políticas
-- Ex: Evaluations
DROP POLICY IF EXISTS "Public submit ev validated" ON public.evaluations;
CREATE POLICY "Public submit ev validated_v2" ON public.evaluations
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    rating >= 1 AND rating <= 5
    AND EXISTS (
      -- Usamos uma subquery simples. RLS de professionals será checado, 
      -- mas pros_read_members é flat agora.
      SELECT 1 FROM public.professionals p
      WHERE p.id = evaluations.professional_id
        AND p.salon_id = evaluations.salon_id
        AND p.active = true
    )
  );

-- 7. Corrigir trigger de limite que consulta a própria tabela
-- Trigger functions SECURITY DEFINER devem ter SET search_path
CREATE OR REPLACE FUNCTION public.enforce_pro_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  s_plan public.salon_plan;
  cnt INT;
BEGIN
  SELECT plan INTO s_plan FROM public.salons WHERE id = NEW.salon_id;
  IF s_plan = 'studio' THEN
    -- SECURITY DEFINER pula RLS de professionals aqui
    SELECT count(*) INTO cnt FROM public.professionals WHERE salon_id = NEW.salon_id AND active = true;
    IF cnt >= 5 THEN
      RAISE EXCEPTION 'Limite do plano Studio atingido (5 profissionais). Faça upgrade para Elite.';
    END IF;
  END IF;
  RETURN NEW;
END;$$;
