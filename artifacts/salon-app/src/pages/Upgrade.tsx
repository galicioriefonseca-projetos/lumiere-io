import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { PUBLIC_PLANS, PLAN_LABELS } from "@/lib/planFeatures";
import { usePermissions } from "@/hooks/usePermissions";

export default function Upgrade() {
  const [params] = useSearchParams();
  const feature = params.get("feature") || "este recurso";
  const { plan } = usePermissions();
  const current = PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-12 text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/5">
          <Lock className="h-6 w-6 text-accent" />
        </div>
        <div className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          <Sparkles className="h-3 w-3" /> Recurso exclusivo
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-gradient-gold tracking-tight mb-3">
          Faça upgrade para desbloquear
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {feature} está disponível em planos superiores. Você está no plano <span className="text-accent">{current}</span>.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {PUBLIC_PLANS.map(p => (
            <div key={p.key} className="border border-white/10 bg-white/[0.01] p-6 text-left">
              <h3 className="font-display text-xl text-foreground mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{p.tagline}</p>
              <div className="mb-4">
                <span className="text-3xl font-display text-white">R${p.price}</span>
                <span className="text-xs text-muted-foreground ml-1">{p.priceSuffix}</span>
              </div>
              <Button asChild variant="outline" className="w-full rounded-none">
                <Link to={`/cadastro?plan=${p.key}`}>Conhecer {p.name}<ArrowRight className="ml-2 h-3 w-3" /></Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link to="/dashboard" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← Voltar para o dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
