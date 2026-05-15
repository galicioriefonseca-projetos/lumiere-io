-- Trigger-only functions: revoke all execute (only the trigger system needs them)
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_pro_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_excellence_badge() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_goal_badge() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: keep callable by authenticated only (needed by policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_master_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_master_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.salon_is_active(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.salon_is_active(uuid) TO authenticated;

-- RPC for master admin: authenticated only (function itself checks master role)
REVOKE EXECUTE ON FUNCTION public.create_salon_rpc(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_salon_rpc(jsonb) TO authenticated;