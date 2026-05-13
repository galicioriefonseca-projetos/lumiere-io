import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isMaster: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MASTER_EMAIL = "leandropfonseca20@gmail.com";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRole = async (u: User | null) => {
    if (!u) {
      setIsMaster(false);
      return;
    }
    
    // Check by email first (instant)
    if (u.email?.toLowerCase() === MASTER_EMAIL) {
      setIsMaster(true);
      return;
    }

    // Then check database
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .eq("role", "master_admin")
      .maybeSingle();
    
    setIsMaster(!!data);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) checkRole(s.user);
      else setIsMaster(false);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Session error:", error.message);
        // If refresh token is missing or invalid, clear everything to allow fresh login
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid claim")) {
          supabase.auth.signOut().catch(() => {});
          localStorage.clear(); // Nuclear option for stuck auth
        }
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) checkRole(data.session.user);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isMaster, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
