
-- 1. Otimização radical das funções de permissão para quebrar recursão
-- Elas agora usam o JWT sempre que possível para evitar consultas a tabelas RLS
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER -- Crucial: pula RLS ao consultar tabelas internas
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Atalho: Se for o e-mail master no JWT, é admin (Zero DBO)
  IF lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Atalho: Se o metadado do usuário diz que é master
  IF (auth.jwt() -> 'user_metadata' ->> 'is_master')::boolean = true THEN
    RETURN TRUE;
  END IF;

  -- 3. Fallback: Consulta direta à tabela (rápida por ser SECURITY DEFINER)
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
SECURITY DEFINER -- Crucial: pula RLS
SET search_path = public, auth
AS $$
BEGIN
  -- Master sempre tem a role
  IF public.is_master_admin(_user_id) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 2. Simplificação das políticas de Professionals para evitar recursão
-- Em vez de chamar has_role (que consulta tabelas), usamos subqueries diretas ou o bypass de admin
DROP POLICY IF EXISTS "Owners manage pros" ON public.professionals;
CREATE POLICY "Owners manage pros_v2" ON public.professionals
  FOR ALL TO authenticated
  USING (
    -- Admin bypass rápido
    lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com'
    OR
    -- Verificação direta na salon_id
    (
      salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND 
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
      )
    )
  );

-- 3. Correção na user_roles para permitir que o sistema se auto-consulte
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master admin email bypass roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master role access roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;

CREATE POLICY "System access roles" 
  ON public.user_roles FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid() OR lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- 4. Re-garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.is_master_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.salon_is_active(uuid) TO authenticated, anon;
