ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS tax_id text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_salon_id UUID;
  is_master BOOLEAN;
  v_btype public.business_type;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';

  v_btype := CASE
    WHEN NEW.raw_user_meta_data->>'business_type' = 'clinic' THEN 'clinic'::public.business_type
    ELSE 'salon'::public.business_type
  END;

  INSERT INTO public.salons (name, plan, is_active, activation_status, owner_name, business_type, phone, tax_id)
  VALUES (
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'salon_name',''), 'Meu Salão'),
    CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
    CASE WHEN is_master THEN true ELSE false END,
    CASE WHEN is_master THEN 'active' ELSE 'pending' END,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', ''), ''),
    v_btype,
    NULLIF(NEW.raw_user_meta_data->>'phone',''),
    NULLIF(NEW.raw_user_meta_data->>'tax_id','')
  )
  RETURNING id INTO new_salon_id;

  INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url, full_name, birth_date, username)
  VALUES (
    NEW.id,
    new_salon_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date,
    NULLIF(NEW.raw_user_meta_data->>'username','')
  );

  IF is_master THEN
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL);
  END IF;
  INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id);

  RETURN NEW;
END;
$function$;