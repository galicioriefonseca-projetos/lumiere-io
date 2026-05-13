
-- 1. Otimiza is_master_admin para quebrar o loop de recursão
-- Ao verificar o email via JWT primeiro, não precisamos consultar user_roles
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Busca email do JWT (mais rápido, sem consultar tabelas)
  v_email := lower(auth.jwt() ->> 'email');
  
  -- Se for o email do master admin, retorna true imediatamente (Bypass)
  IF v_email = 'leandropfonseca20@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- Fallback para verificação na tabela (usada em triggers ou contextos sem JWT)
  -- SECURITY DEFINER ignora RLS aqui
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'master_admin'
  );
END;
$$;

-- 2. Reforça has_role com o mesmo bypass
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Master Admin tem todas as permissões implícitas
  IF public.is_master_admin(_user_id) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 3. Ajusta políticas da user_roles para evitar recursão
-- Permitimos que o master admin (pelo email) gerencie roles sem chamar is_master_admin na regra
DROP POLICY IF EXISTS "Master admin full access roles" ON public.user_roles;
CREATE POLICY "Master admin email bypass roles"
  ON public.user_roles FOR ALL
  USING (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com');

-- Re-adiciona a política original para outros master admins (se houver via tabela)
CREATE POLICY "Master role access roles"
  ON public.user_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND (raw_user_meta_data->>'is_master')::boolean = true
  ));

-- 4. Garante que is_master_admin e has_role sejam executáveis
GRANT EXECUTE ON FUNCTION public.is_master_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
