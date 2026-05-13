
-- Invitations table
CREATE TABLE IF NOT EXISTS public.salon_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'professional',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.salon_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners/Managers can manage invitations"
ON public.salon_invitations FOR ALL
USING (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager')))
WITH CHECK (salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
      AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager')));

-- Function to handle user signup with invitation
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

  -- Check for invitation by email
  SELECT id, salon_id, role INTO v_invitation_id, v_salon_id, v_role
  FROM public.salon_invitations
  WHERE LOWER(email) = LOWER(NEW.email) AND used_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_salon_id IS NOT NULL THEN
    -- User joining existing salon
    INSERT INTO public.profiles (id, salon_id, email, display_name, full_name, avatar_url)
    VALUES (
      NEW.id,
      v_salon_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NEW.raw_user_meta_data->>'avatar_url'
    );

    INSERT INTO public.user_roles (user_id, role, salon_id)
    VALUES (NEW.id, v_role, v_salon_id);

    UPDATE public.salon_invitations SET used_at = now() WHERE id = v_invitation_id;
  ELSE
    -- Default logic: create new salon (Owner flow)
    v_btype := CASE
      WHEN NEW.raw_user_meta_data->>'business_type' = 'clinic' THEN 'clinic'::public.business_type
      ELSE 'salon'::public.business_type
    END;

    INSERT INTO public.salons (name, plan, is_active, activation_status, owner_name, business_type)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'salon_name',''), 'Meu Salão'),
      CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE 'studio'::public.salon_plan END,
      CASE WHEN is_master THEN true ELSE false END,
      CASE WHEN is_master THEN 'active' ELSE 'pending' END,
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', ''), ''),
      v_btype
    )
    RETURNING id INTO new_salon_id;

    INSERT INTO public.profiles (id, salon_id, email, display_name, full_name, avatar_url)
    VALUES (
      NEW.id,
      new_salon_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NEW.raw_user_meta_data->>'avatar_url'
    );

    IF is_master THEN
      INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL);
    END IF;
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id);
  END IF;

  RETURN NEW;
END;
$function$;

-- Update trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_invitation();
