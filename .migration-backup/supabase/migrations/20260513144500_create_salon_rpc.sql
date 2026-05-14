CREATE OR REPLACE FUNCTION public.create_salon_rpc(_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_new_salon public.salons;
  v_is_master boolean;
BEGIN
  -- Verify master admin
  v_is_master := lower(auth.jwt() ->> 'email') = 'leandropfonseca20@gmail.com' OR public.is_master_admin(auth.uid());
  
  IF NOT v_is_master THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.salons (
    name, owner_name, business_type, plan, is_active, activation_status, onboarded_at, phone
  ) VALUES (
    _payload->>'name',
    _payload->>'owner_name',
    (_payload->>'business_type')::public.business_type,
    (_payload->>'plan')::public.salon_plan,
    (_payload->>'is_active')::boolean,
    _payload->>'activation_status',
    (_payload->>'onboarded_at')::timestamp,
    _payload->>'phone'
  ) RETURNING * INTO v_new_salon;

  RETURN to_jsonb(v_new_salon);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_salon_rpc(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_salon_rpc(jsonb) TO authenticated;
