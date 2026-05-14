-- SaaS commercial: novos salões nascem inativos (precisam ativação manual pelo Master)
ALTER TABLE public.salons ALTER COLUMN is_active SET DEFAULT false;

-- Atualiza handle_new_user: master é ativado, demais ficam pending+inactive
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_salon_id UUID;
  is_master BOOLEAN;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';

  INSERT INTO public.salons (name, plan, is_active, activation_status, owner_name)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
    CASE WHEN is_master THEN true ELSE false END,
    CASE WHEN is_master THEN 'active' ELSE 'pending' END,
    COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', NULL)
  )
  RETURNING id INTO new_salon_id;

  INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_salon_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF is_master THEN
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL);
  END IF;
  INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id);

  RETURN NEW;
END;
$function$;