
-- 1. Desabilita RLS temporariamente para limpar a mesa
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;

-- 2. Remove TODAS as políticas conhecidas (limpeza profunda)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'professionals')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.professionals', pol.policyname);
    END LOOP;
END $$;

-- 3. Reconstrói políticas MINIMALISTAS
-- Master bypass total (Email + JWT check)
CREATE POLICY "Master_Bypass_Pros" ON public.professionals 
  FOR ALL TO authenticated 
  USING (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- Leitura por membros do salão (Utiliza profiles, mas profiles tem RLS simples)
CREATE POLICY "Read_Salon_Pros" ON public.professionals
  FOR SELECT TO authenticated
  USING (salon_id IN (SELECT p.salon_id FROM public.profiles p WHERE p.id = auth.uid()));

-- Gerenciamento por Owners/Managers
-- Aqui está o ponto crítico. Para evitar recursão, usamos uma subquery direta em user_roles sem chamar has_role.
-- Adicionado SECURITY DEFINER na subquery implícita não existe, mas user_roles agora tem uma política flat.
CREATE POLICY "Manage_Salon_Pros" ON public.professionals
  FOR ALL TO authenticated
  USING (
    salon_id IN (SELECT p.salon_id FROM public.profiles p WHERE p.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    salon_id IN (SELECT p.salon_id FROM public.profiles p WHERE p.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'manager')
    )
  );

-- 4. Habilita RLS novamente
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 5. Mesma limpeza para user_roles (Garante que ela está flat)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Flat_Read_Roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

CREATE POLICY "Master_Manage_Roles" ON public.user_roles FOR ALL TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
