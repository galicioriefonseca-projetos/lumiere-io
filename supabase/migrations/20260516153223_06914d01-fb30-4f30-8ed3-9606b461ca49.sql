
-- Founder codes
CREATE TABLE IF NOT EXISTS public.founder_codes (
  code text PRIMARY KEY,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage founder codes" ON public.founder_codes;
CREATE POLICY "Admins manage founder codes" ON public.founder_codes
  FOR ALL TO authenticated
  USING (public.is_master_admin(auth.uid()) OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.is_master_admin(auth.uid()) OR public.has_role(auth.uid(), 'platform_admin'));

INSERT INTO public.founder_codes (code, max_uses, active)
VALUES ('ESSENZAFOUNDER', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Public validator (no data exposure)
CREATE OR REPLACE FUNCTION public.validate_founder_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.founder_codes
    WHERE code = _code
      AND active = true
      AND (max_uses IS NULL OR uses < max_uses)
  );
$$;

REVOKE ALL ON FUNCTION public.validate_founder_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_founder_code(text) TO anon, authenticated;

-- Platform admin helper
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_master_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin');
$$;

-- Admin RPC: change salon plan/status
CREATE OR REPLACE FUNCTION public.admin_update_salon(_salon_id uuid, _patch jsonb)
RETURNS public.salons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.salons;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.salons SET
    plan = COALESCE((_patch->>'plan')::public.salon_plan, plan),
    subscription_status = COALESCE(_patch->>'subscription_status', subscription_status),
    activation_status = COALESCE(_patch->>'activation_status', activation_status),
    is_active = COALESCE((_patch->>'is_active')::boolean, is_active),
    trial_ends_at = CASE WHEN _patch ? 'trial_ends_at' THEN NULLIF(_patch->>'trial_ends_at','')::timestamptz ELSE trial_ends_at END,
    founder_started_at = CASE WHEN _patch ? 'founder_started_at' THEN NULLIF(_patch->>'founder_started_at','')::timestamptz ELSE founder_started_at END,
    updated_at = now()
  WHERE id = _salon_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_salon(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_salon(uuid, jsonb) TO authenticated;

-- Updated handle_new_user: respect plan + founder + trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_salon_id UUID; v_role public.app_role; v_invitation_id UUID;
  is_master BOOLEAN; v_btype public.business_type; new_salon_id UUID;
  v_plan public.salon_plan; v_founder_code text; v_is_founder boolean := false;
  v_trial_ends timestamptz; v_founder_started timestamptz;
BEGIN
  is_master := lower(NEW.email) = 'leandropfonseca20@gmail.com';

  SELECT id, salon_id, role INTO v_invitation_id, v_salon_id, v_role
  FROM public.salon_invitations
  WHERE lower(email) = lower(NEW.email) AND used_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_salon_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, salon_id, email, display_name, full_name, avatar_url)
    VALUES (NEW.id, v_salon_id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, v_role, v_salon_id)
    ON CONFLICT (user_id, role, salon_id) DO NOTHING;
    UPDATE public.salon_invitations SET used_at = now() WHERE id = v_invitation_id;
  ELSE
    v_btype := CASE WHEN NEW.raw_user_meta_data->>'business_type' = 'clinic' THEN 'clinic'::public.business_type ELSE 'salon'::public.business_type END;

    -- Resolve plan
    v_plan := CASE
      WHEN NEW.raw_user_meta_data->>'plan' IN ('start','studio','performance','network','founder','elite')
        THEN (NEW.raw_user_meta_data->>'plan')::public.salon_plan
      ELSE 'start'::public.salon_plan
    END;

    -- Founder code validation
    v_founder_code := NULLIF(NEW.raw_user_meta_data->>'founder_code','');
    IF v_plan = 'founder' THEN
      IF v_founder_code IS NULL OR NOT public.validate_founder_code(v_founder_code) THEN
        v_plan := 'start'::public.salon_plan;
      ELSE
        v_is_founder := true;
        v_founder_started := now();
        UPDATE public.founder_codes SET uses = uses + 1 WHERE code = v_founder_code;
      END IF;
    END IF;

    -- Trial 7 days (skip for master)
    v_trial_ends := CASE WHEN is_master THEN NULL ELSE now() + interval '7 days' END;

    INSERT INTO public.salons (
      name, plan, is_active, activation_status, owner_name, business_type, phone, tax_id,
      subscription_status, trial_ends_at, founder_started_at, city, state, professional_count_estimate,
      onboarded_at
    )
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'salon_name',''), 'Meu Salão'),
      CASE WHEN is_master THEN 'elite'::public.salon_plan ELSE v_plan END,
      true,
      'active',
      NULLIF(COALESCE(NEW.raw_user_meta_data->>'owner_name', NEW.raw_user_meta_data->>'full_name', ''), ''),
      v_btype,
      NULLIF(NEW.raw_user_meta_data->>'phone',''),
      NULLIF(NEW.raw_user_meta_data->>'tax_id',''),
      CASE WHEN is_master THEN 'active' ELSE 'trial' END,
      v_trial_ends,
      v_founder_started,
      NULLIF(NEW.raw_user_meta_data->>'city',''),
      NULLIF(NEW.raw_user_meta_data->>'state',''),
      NULLIF(NEW.raw_user_meta_data->>'professional_count_estimate','')::int,
      NULL
    )
    RETURNING id INTO new_salon_id;

    INSERT INTO public.profiles (id, salon_id, email, display_name, avatar_url, full_name, birth_date, username)
    VALUES (NEW.id, new_salon_id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
      NEW.raw_user_meta_data->>'avatar_url',
      NULLIF(NEW.raw_user_meta_data->>'full_name',''),
      NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date,
      NULLIF(NEW.raw_user_meta_data->>'username',''))
    ON CONFLICT (id) DO UPDATE SET salon_id = EXCLUDED.salon_id;

    IF is_master THEN
      INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'master_admin', NULL)
      ON CONFLICT (user_id, role, salon_id) DO NOTHING;
    END IF;
    INSERT INTO public.user_roles (user_id, role, salon_id) VALUES (NEW.id, 'owner', new_salon_id)
    ON CONFLICT (user_id, role, salon_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
