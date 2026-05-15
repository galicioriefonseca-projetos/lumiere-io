import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const MASTER_ADMIN_EMAIL = "leandropfonseca20@gmail.com";

export type AppRole = "master_admin" | "owner" | "manager" | "professional";
export type SalonPlan = "studio" | "elite";
export type ActivationStatus = "pending" | "active" | "suspended";

export type Salon = {
  id: string;
  name: string;
  plan: SalonPlan;
  has_custom_branding: boolean;
  brand_primary_color: string | null;
  brand_accent_color: string | null;
  logo_url: string | null;
  is_active: boolean;
  activation_status: ActivationStatus;
  owner_name: string | null;
  onboarded_at: string | null;
  business_type?: string | null;
  phone?: string | null;
  tax_id?: string | null;
};

export type Profile = {
  id: string;
  salon_id: string | null;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  full_name?: string | null;
  birth_date?: string | null;
  username?: string | null;
};

export const usePermissions = () => {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["permissions-bundle", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [profileRes, rolesRes, proRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("professionals").select("role").eq("user_id", user.id).maybeSingle()
      ]);
      const profile = (profileRes.data ?? null) as Profile | null;
      const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
      const proRole = proRes.data?.role as string | null;

      let salon: Salon | null = null;
      if (profile?.salon_id) {
        const { data: s } = await supabase
          .from("salons")
          .select("*")
          .eq("id", profile.salon_id)
          .maybeSingle();
        salon = (s ?? null) as Salon | null;
      }
      const permissions = { profile, roles, salon, proRole };
      console.log("Permissions Bundle Loaded:", permissions);
      return permissions;
    },
  });

  // Realtime: invalidate when own salon changes (license toggles)
  const salonId = data?.salon?.id;
  useEffect(() => {
    if (!salonId) return;
    // unique id to avoid channel collisions between multiple components using this hook
    const instanceId = Math.random().toString(36).substring(7);
    const ch = supabase
      .channel(`salon-watch-${salonId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "salons", filter: `id=eq.${salonId}` },
        () => qc.invalidateQueries({ queryKey: ["permissions-bundle"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [salonId, qc]);

  const profile = data?.profile ?? null;
  const salon = data?.salon ?? null;
  const roles = data?.roles ?? [];
  const proRole = data?.proRole ?? null;

  const isMasterAdmin =
    roles.includes("master_admin") ||
    user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL;

  const hasRole = (r: AppRole) => isMasterAdmin || roles.includes(r);

  const plan: SalonPlan = isMasterAdmin ? "elite" : (salon?.plan ?? "studio");
  const isElite = plan === "elite";
  const isStudio = plan === "studio";

  // License gates
  const activationStatus: ActivationStatus =
    isMasterAdmin ? "active" : (salon?.activation_status ?? "pending");
  const isSalonActive = isMasterAdmin || (!!salon?.is_active && activationStatus === "active");
  const needsOnboarding = !isMasterAdmin && !!salon && !salon.onboarded_at;

  // Role-derived helpers (highest privilege wins)
  const isOwner = isMasterAdmin || roles.includes("owner");
  const isManager = isOwner || roles.includes("manager");
  // Se for manager e o cargo profissional for Recepção, ou outras flags, mas vamos considerar recepcionista quem tem a String "Recepção" na tabela profissionais, e é um professional ou manager
  const isReceptionist = isManager || (proRole?.toLowerCase().includes("recepç") || proRole?.toLowerCase().includes("recepcion"));
  
  const isProfessionalOnly =
    !isOwner && !isManager && !isReceptionist && roles.includes("professional");

  const can = {
    viewDashboard: true,
    useChecklists: true,
    useTVMode: isMasterAdmin || isElite,
    useAIInsights: isMasterAdmin || isElite,
    useCustomBranding: isMasterAdmin || (isElite && !!salon?.has_custom_branding),
    manageBilling: isMasterAdmin || hasRole("owner"),
    accessMasterPanel: isMasterAdmin,
    viewFinancials: isOwner,
    manageQuality: isManager,
    manageTeam: isOwner,
    quickLaunchOnly: isProfessionalOnly,
  };

  const limits = {
    maxProfessionals: isMasterAdmin || isElite ? Infinity : 5,
    maxUsers: isMasterAdmin || isElite ? Infinity : 6,
  };

  return {
    loading: authLoading || isLoading,
    user,
    profile,
    salon,
    roles,
    plan,
    isMasterAdmin,
    isElite,
    isStudio,
    isOwner,
    isManager,
    isReceptionist,
    isProfessionalOnly,
    activationStatus,
    isSalonActive,
    needsOnboarding,
    hasRole,
    can,
    limits,
  };
};
