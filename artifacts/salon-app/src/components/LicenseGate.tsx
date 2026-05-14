import { ReactNode, useEffect, useRef, useState } from "react";
import { Sparkles, ShieldAlert, Clock, LogOut, Mail, PartyPopper, Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

/**
 * SaaS license trava:
 * - Master admin: bypass total.
 * - Salão com is_active=false ou status='pending' → tela de espera animada.
 * - Salão com status='suspended' → "Licença Suspensa".
 * - Quando o acesso é liberado → tela de parabéns rápida + libera app.
 */
export const LicenseGate = ({ children }: { children: ReactNode }) => {
  const { loading, isMasterAdmin, salon, activationStatus, isSalonActive } = usePermissions();
  const { signOut } = useAuth();
  const [progress, setProgress] = useState(8);
  const [justActivated, setJustActivated] = useState(false);
  const wasInactive = useRef(false);

  // animação contínua de "barra de análise" enquanto está pendente
  useEffect(() => {
    if (isMasterAdmin || !salon) return;
    if (isSalonActive) return;
    const t = setInterval(() => {
      setProgress((p) => (p >= 92 ? 18 : p + 2));
    }, 250);
    return () => clearInterval(t);
  }, [isMasterAdmin, salon, isSalonActive]);

  // detecta liberação em tempo real → mostra tela de parabéns persistente
  useEffect(() => {
    if (isMasterAdmin || !salon) return;
    if (!isSalonActive) {
      wasInactive.current = true;
      return;
    }
    if (wasInactive.current && isSalonActive) {
      wasInactive.current = false;
      setJustActivated(true);
      toast.success("🎉 Acesso liberado! Bem-vindo à Lumière.io");
    }
  }, [isSalonActive, isMasterAdmin, salon]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <div className="font-display text-2xl text-gradient-gold">Lumière</div>
      </div>
    );
  }

  if (isMasterAdmin) return <>{children}</>;
  if (!salon) return <>{children}</>;

  const suspended = activationStatus === "suspended";
  const pending = !isSalonActive && !suspended;

  if (justActivated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-aurora opacity-60" />
        <Card className="glass shadow-elegant relative w-full max-w-lg p-10 text-center animate-scale-in">
          <PartyPopper className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h1 className="font-display text-4xl text-gradient-gold">Parabéns!</h1>
          <p className="mt-3 text-muted-foreground">
            Sua conta <span className="text-foreground">{salon.name}</span> foi liberada.
            Bem-vindo à experiência Lumière.io ✨
          </p>
          <Button
            variant="hero"
            className="mt-6 w-full"
            onClick={() => setJustActivated(false)}
          >
            Iniciar tour guiado
          </Button>
        </Card>
      </div>
    );
  }

  if (!suspended && !pending) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-aurora opacity-40" />
      <Card className="glass shadow-elegant relative w-full max-w-lg p-8 text-center animate-fade-in">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
          <Sparkles className="h-3 w-3" />
          GF Estratégia Digital · Lumière.io
        </div>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          {suspended ? (
            <ShieldAlert className="h-7 w-7 text-accent" />
          ) : (
            <Clock className="h-7 w-7 text-accent animate-pulse" />
          )}
        </div>

        {suspended ? (
          <>
            <h1 className="font-display text-4xl text-gradient-gold">Licença Suspensa</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              O acesso a <span className="text-foreground">{salon.name}</span> foi temporariamente
              suspenso. Entre em contato com a <span className="text-accent">GF Estratégia Digital</span> para regularizar.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl text-gradient-gold">Aguardando liberação</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Recebemos o cadastro de <span className="text-foreground">{salon.name}</span>.
              Seu acesso está sendo analisado pela equipe da{" "}
              <span className="text-accent">GF Estratégia Digital</span>.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que liberado, esta tela será atualizada automaticamente. ✨
            </p>

            <div className="mt-6 space-y-2">
              <Progress value={progress} className="h-2 bg-secondary" />
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-accent" />
                Analisando sua solicitação…
              </div>
            </div>
          </>
        )}

        <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-4 text-left text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-2 text-accent-soft">
            <Mail className="h-3 w-3" /> Contato comercial
          </div>
          Fale com o time GF Estratégia Digital pelo seu canal habitual de atendimento para acompanhar a liberação.
        </div>

        <Button variant="ghost" size="sm" className="mt-6" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </Card>
    </div>
  );
};
