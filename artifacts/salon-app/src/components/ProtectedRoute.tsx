import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { loading: permsLoading, salon, profile, isMasterAdmin } = usePermissions();

  if (loading || permsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <div className="font-display text-2xl text-gradient-gold">Lumière</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  // Pré-cadastro incompleto → /setup. Master nunca passa por aqui.
  const needsSetup =
    !isMasterAdmin &&
    (!profile?.full_name ||
      !profile?.birth_date ||
      !salon ||
      !salon.name ||
      salon.name === "Meu Salão" ||
      !salon.owner_name);
  if (needsSetup) return <Navigate to="/setup" replace />;

  return <>{children}</>;
};
