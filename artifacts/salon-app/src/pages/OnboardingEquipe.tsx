import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Users, Scissors, Target, CheckSquare } from "lucide-react";

const STEPS = [
  { icon: Users, label: "Cadastrar equipe", to: "/profissionais", desc: "Adicione seus profissionais." },
  { icon: Scissors, label: "Cadastrar serviços", to: "/servicos", desc: "Defina seu catálogo." },
  { icon: Target, label: "Definir meta mensal", to: "/metas", desc: "Configure sua meta de receita." },
  { icon: CheckSquare, label: "Criar checklist diário", to: "/checklists", desc: "Padronize sua operação." },
];

export default function OnboardingEquipe() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          <Sparkles className="h-3 w-3" /> Bem-vindo ao Lumière
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-gradient-gold tracking-tight mb-3">
          Vamos preparar sua operação
        </h1>
        <p className="text-muted-foreground mb-10">
          Siga as etapas no seu ritmo. Você pode voltar a qualquer momento.
        </p>

        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <Link key={s.to} to={s.to} className="group flex items-center gap-4 border border-white/10 bg-white/[0.02] p-5 hover:border-accent/30 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center border border-accent/20 bg-accent/5">
                <s.icon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Etapa {i + 1}</div>
                <div className="font-display text-lg text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-between">
          <Link to="/dashboard" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Pular para o dashboard
          </Link>
          <Button asChild variant="hero" className="rounded-none">
            <Link to="/dashboard">Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
