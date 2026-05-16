import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { featuresForPlan, type PlanFeatures } from "@/lib/planFeatures";

type Props = {
  feature: keyof PlanFeatures;
  featureLabel?: string;
  children: ReactNode;
};

export const FeatureGate = ({ feature, featureLabel, children }: Props) => {
  const { plan, isMasterAdmin, loading } = usePermissions();
  if (loading) return null;
  if (isMasterAdmin) return <>{children}</>;
  const flags = featuresForPlan(plan);
  const value = flags[feature];
  const enabled = typeof value === "boolean" ? value : Number(value) > 0;
  if (!enabled) {
    const q = featureLabel ? `?feature=${encodeURIComponent(featureLabel)}` : "";
    return <Navigate to={`/upgrade${q}`} replace />;
  }
  return <>{children}</>;
};
