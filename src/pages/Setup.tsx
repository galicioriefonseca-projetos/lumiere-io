import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Scissors, Stethoscope, LogOut, ShieldCheck, Eye, EyeOff, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { BusinessType } from "@/lib/vertical";
import {
  isValidPhoneBR, isValidTaxId, maskPhoneBR, maskTaxId, passwordStrength,
} from "@/lib/validators";

/**
 * Pré-cadastro obrigatório (Google e e-mail/senha caem aqui).
 * Coleta: nome, nascimento, telefone, CPF/CNPJ, empresa, tipo, usuário,
 * e — para usuários do Google sem senha — uma senha.
 */
const Setup = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { loading, salon, profile, isMasterAdmin } = usePermissions();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [type, setType] = useState<BusinessType>("salon");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Detecta usuários sem senha (login social) — esses precisam definir uma.
  const identities = user?.identities ?? [];
  const hasEmailIdentity = identities.some((i) => i.provider === "email");
  const needsPassword = !!user && !hasEmailIdentity;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  // Pré-popula com o que já temos.
  useEffect(() => {
    if (!profile) return;
    if (profile.full_name && !fullName) setFullName(profile.full_name);
    if (profile.birth_date && !birthDate) setBirthDate(profile.birth_date);
    if (profile.username && !username) setUsername(profile.username);
    if (salon?.name && salon.name !== "Meu Salão" && !companyName) setCompanyName(salon.name);
    if (salon?.business_type && salon.business_type !== type) setType(salon.business_type as BusinessType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, salon]);

  // Se já completou ou é master, redireciona.
  useEffect(() => {
    if (loading) return;
    if (isMasterAdmin) {
      navigate("/", { replace: true });
      return;
    }
    // Agora o cadastro unificado já preenche nome, salão e gera um username.
    // Redirecionamos se os dados básicos essenciais estiverem lá.
    if (
      profile?.full_name &&
      profile?.username &&
      salon?.name &&
      salon.name !== "Meu Salão" &&
      !needsPassword
    ) {
      navigate("/", { replace: true });
    }
  }, [loading, isMasterAdmin, salon, profile, navigate, needsPassword]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sessão indisponível");
      if (!salon?.id) throw new Error("Aguardando criação do cadastro… recarregue em instantes.");

      // Atualiza o que for necessário, mas sem bloquear se o usuário não quiser preencher CPF agora
      const { error: e1 } = await supabase
        .from("salons")
        .update({
          name: companyName.trim() || salon.name,
          owner_name: fullName.trim() || profile?.full_name,
          business_type: type || (salon.business_type as BusinessType),
          phone: phone.trim() || salon.phone,
          tax_id: taxId.trim(),
        })
        .eq("id", salon.id);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || profile?.full_name,
          birth_date: birthDate,
          username: username.trim() || profile?.username,
          display_name: fullName.trim() || profile?.full_name,
        })
        .eq("id", user.id);
      if (e2) throw e2;

      if (needsPassword && password.length >= 8) {
        const { error: e3 } = await supabase.auth.updateUser({ password });
        if (e3) throw e3;
      }
    },
    onSuccess: () => {
      toast.success("Tudo pronto! Bem-vindo ao ecossistema Lumière.");
      qc.invalidateQueries();
      navigate("/", { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const strength = passwordStrength(password);
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-accent"];

  // Aguardando o trigger handle_new_user terminar
  if (!loading && user && !salon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground bg-[#0A0A0A]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm tracking-widest uppercase">Orquestrando seu ambiente…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 bg-[#0A0A0A] selection:bg-accent/30">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <Card className="relative w-full max-w-xl overflow-hidden rounded-none border-white/5 bg-[#0D0D0D]/80 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rotate-45 bg-gradient-gold opacity-10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold opacity-30" />

        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
            <Sparkles className="h-3 w-3 animate-pulse" /> Lumière Concierge
          </div>
          <h1 className="font-display text-4xl text-gradient-gold tracking-tight sm:text-5xl">Confirmar Acesso</h1>
          <p className="mt-5 text-sm font-light text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
            Seja bem-vindo ao cume da gestão. <span className="text-foreground font-medium">{profile?.full_name?.split(" ")[0]}</span>, 
            estamos preparando seu ecossistema.
          </p>
        </div>

        <div className="space-y-10">
          {needsPassword && (
            <div className="group space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors group-focus-within:text-accent">
                Senha de Acesso Master
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="h-12 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm tracking-widest transition-all focus-visible:border-accent focus-visible:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground/40 transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && password.length < 8 && (
                <p className="text-[9px] uppercase tracking-widest text-destructive">Mínimo de 8 caracteres exigido</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="group space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors group-focus-within:text-accent">
                Data de Nascimento
              </Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-12 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm tracking-widest transition-all focus-visible:border-accent focus-visible:ring-0"
              />
            </div>
            <div className="group space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors group-focus-within:text-accent">
                Documento de Identidade
              </Label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(maskTaxId(e.target.value))}
                placeholder="CPF ou CNPJ (Opcional)"
                className="h-12 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm tracking-widest transition-all focus-visible:border-accent focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-none border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute top-0 left-0 h-full w-1 bg-accent/20" />
            <div className="flex gap-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
              <div className="text-[10px] leading-relaxed text-muted-foreground/60 uppercase tracking-widest">
                Sua segurança é nossa prioridade. Ao confirmar, você aceita nossos termos de curadoria e inicia sua jornada rumo à excelência operacional.
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <Button
              variant="hero"
              className="group relative h-16 w-full overflow-hidden rounded-none p-0 text-[10px] font-bold uppercase tracking-[0.4em]"
              disabled={save.isPending || (needsPassword && password.length < 8)}
              onClick={() => save.mutate()}
            >
              <span className="relative z-10 flex items-center justify-center gap-3 transition-transform group-hover:scale-105">
                {save.isPending ? "Configurando..." : (
                  <>
                    Iniciar Experiência Lumière
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform group-hover:translate-y-0" />
            </Button>

            <button 
              onClick={signOut}
              className="mx-auto block text-[9px] uppercase tracking-[0.3em] text-muted-foreground/30 transition-colors hover:text-destructive"
            >
              Interromper Sincronização e Sair
            </button>
          </div>
        </div>
      </Card>
      
      {/* Decorative footer */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.5em] text-white/5 font-display italic">
        Lumière.io · Excellence in Management
      </div>
    </div>
  );
};

export default Setup;
