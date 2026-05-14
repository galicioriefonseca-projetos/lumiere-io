
-- Atualiza o trigger para capturar novos metadados enviados pelo Auth.tsx (Nome, Salão, Telefone, Tipo)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_salon_id UUID;
  v_role public.app_role;
  v_invitation_id UUID;
  is_master BOOLEAN;
  v_btype public.business_type;
  new_salon_id UUID;
BEGIN
  is_master := LOWER(NEW.email) = 'leandropfonseca20@gmail.com';

  -- Busca convite por e-mail
  SELECT id, salon_id, role INTO v_invitation_id, v_salon_id, v_role
  FROM public.salon_invitations
  WHERE LOWER(email) = LOWER(NEW.email) AND used_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_salon_id IS NOT NULL THEN
    -- Usuário entrando em salão existente via convite
    INSERT INTO public.profiles (id, salon_id, email, display_name, full_name, avatar_url, phone, username)
    VALUES (
      NEW.id,
      v_salon_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1) || floor(random()*9000+1000)::text)
    );

    INSERT INTO public.user_roles (user_id, role, salon_id)
    VALUES (NEW.id, v_role, v_salon_id);

    UPDATE public.salon_invitations SET used_at = now() WHERE id = v_invitation_id;
  ELSE
    -- Fluxo de Owner: Cria novo salão
    v_btype := CASE
      WHEN NEW.raw_user_meta_data->>'business_type' = 'clinic' THEN 'clinic'::public.business_type
      ELSE 'salon'::public.business_type
    END;

    INSERT INTO public.salons (name, plan, is_active, activation_status, owner_name, business_type, phone)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'salon_name',''), 'Meu Salão'),
      CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
      CASE WHEN is_master THEN true ELSE false END,
      CASE WHEN is_master THEN 'active' ELSE 'pending' END,
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'owner_name', ''), ''),
      v_btype,
      NEW.raw_user_meta_data->>'phone'
    )
    RETURNING id INTO new_salon_id;

    INSERT INTO public.profiles (id, salon_id, email, display_name, full_name, avatar_url, phone, username)
    VALUES (
      NEW.id,
      new_salon_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1) || floor(random()*9000+1000)::text)
    );

    IF is_master THEN
      INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL);
    END IF;
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id);
  END IF;

  RETURN NEW;
END;
$function$;

-- Garante que o trigger aponte para a função atualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_invitation();
