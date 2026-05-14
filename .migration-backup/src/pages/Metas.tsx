import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Users, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fmtBRL, monthRange } from "@/lib/aura";
import { Skeleton } from "@/components/ui/skeleton";

const Metas = () => {
  const { salon, loading, isMasterAdmin } = usePermissions();
  const qc = useQueryClient();
  const { year, month, start, end } = monthRange();
  const [target, setTarget] = useState("");

  const { data, isLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["goal", salon?.id, year, month],
    queryFn: async () => {
      const [g, ach, pros] = await Promise.all([
        supabase.from("salon_goals").select("*").eq("salon_id", salon!.id).eq("year", year).eq("month", month).maybeSingle(),
        supabase.from("achievements").select("amount").eq("salon_id", salon!.id).gte("occurred_at", start).lt("occurred_at", end),
        supabase.from("professionals").select("id").eq("salon_id", salon!.id).eq("active", true),
      ]);
      const revenue = (ach.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const activeProsCount = pros.data?.length || 1; // avoid division by zero
      return { goal: g.data, revenue, activeProsCount };
    },
  });

  useEffect(() => { setTarget(data?.goal?.target_revenue ? String(data.goal.target_revenue) : ""); }, [data?.goal?.target_revenue]);

  const save = useMutation({
    mutationFn: async () => {
      const value = Number(target.replace(",", "."));
      if (!value || value <= 0) throw new Error("Defina um valor válido");
      const payload = { salon_id: salon!.id, year, month, target_revenue: value };
      const { error } = await supabase.from("salon_goals").upsert(payload, { onConflict: "salon_id,year,month" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Meta atualizada com sucesso. Equipe notificada!"); qc.invalidateQueries({ queryKey: ["goal"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full max-w-md" />
        </div>
      </AppShell>
    );
  }

  if (!salon?.id && !isMasterAdmin) {
    return (
      <AppShell>
        <div className="text-center p-12 py-24">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
            <Target size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Não conseguimos identificar o seu estabelecimento para gerenciar as metas.
          </p>
          <Button variant="hero" className="mt-8 px-8" onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      </AppShell>
    );
  }

  const target_revenue = Number(data?.goal?.target_revenue ?? 0);
  const revenue = data?.revenue ?? 0;
  const pct = target_revenue ? Math.min(100, (revenue / target_revenue) * 100) : 0;
  const leftover = Math.max(0, target_revenue - revenue);
  
  // Smart Breakdown Math
  const today = new Date();
  const lastDay = new Date(year, month, 0).getDate();
  const daysLeft = Math.max(1, lastDay - today.getDate());
  
  const perProLeft = data?.activeProsCount ? leftover / data.activeProsCount : 0;
  const perProPerDay = perProLeft / daysLeft;

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Target className="h-3 w-3" /> Gestão de Performance
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Metas & Indicadores</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Mês de {new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long" })}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass shadow-[0_0_50px_rgba(212,175,55,0.05)] border-accent/20 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between relative z-10 mb-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Faturamento Atual</div>
                <div className="font-display text-5xl sm:text-7xl text-gradient-gold tracking-tighter">{fmtBRL(revenue)}</div>
              </div>
              <div className="sm:text-right bg-black/40 px-5 py-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Nossa Meta</div>
                <div className="font-display text-2xl sm:text-3xl text-white tracking-tight">{fmtBRL(target_revenue)}</div>
              </div>
            </div>
            
            <div className="relative z-10">
               <div className="flex justify-between items-end mb-3">
                  <span className="text-sm font-medium text-white/90">Progresso do Mês</span>
                  <span className="text-xl font-display text-accent">{pct.toFixed(1)}%</span>
               </div>
               <div className="h-4 bg-background/50 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-gold transition-all duration-1000 ease-out" 
                    style={{ width: `${pct}%` }} 
                  />
               </div>
            </div>
          </Card>

          {target_revenue > 0 && leftover > 0 && (
            <Card className="glass border-border/30 p-6 flex flex-col gap-6 bg-gradient-to-br from-white/[0.02] to-transparent">
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-display text-xl">Plano de Ação Inteligente</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                   <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Faltam</div>
                   <div className="text-xl font-medium text-white">{fmtBRL(leftover)}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                   <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Prazo</div>
                   <div className="text-xl font-medium text-white">{daysLeft} dias</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 border-l-2 border-l-accent">
                   <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3 w-3" /> Esforço por Pessoa</div>
                   <div className="text-xl font-display text-accent">{fmtBRL(perProPerDay)} <span className="text-xs font-sans text-muted-foreground font-normal lowercase">/ dia</span></div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground/80 font-light leading-relaxed">
                <strong className="text-foreground font-medium">Traduzindo:</strong> Se os seus <strong className="text-foreground">{data?.activeProsCount} profissionais</strong> conseguirem vender apenas <strong className="text-accent">{fmtBRL(perProPerDay)}</strong> a mais por dia (ex: 1 combo extra ou 1 produto), a meta do mês está garantida. Mostre isso na reunião de alinhamento!
              </p>
            </Card>
          )}

          {target_revenue > 0 && leftover === 0 && (
             <Card className="glass border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
                   <Target size={32} />
                </div>
                <h3 className="font-display text-3xl text-emerald-400 mb-2">Meta Batida!</h3>
                <p className="text-emerald-500/70">Parabéns! Sua equipe atingiu e superou a meta deste mês. É hora de celebrar e talvez definir um novo alvo para não perder a tração.</p>
             </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass shadow-elegant p-6 bg-black/20">
            <div className="mb-6">
               <h3 className="font-display text-xl text-white mb-1">Ajustar Alvo</h3>
               <p className="text-xs text-muted-foreground">Defina a meta principal em Reais (R$).</p>
            </div>
            
            <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Valor da Meta</Label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">R$</span>
                 <Input 
                   className="pl-10 h-14 bg-black/60 border-white/10 font-mono text-xl" 
                   inputMode="decimal" 
                   value={target} 
                   onChange={(e) => setTarget(e.target.value)} 
                   placeholder="Ex: 50000" 
                 />
               </div>
            </div>
            
            <Button 
               variant="hero" 
               className="mt-6 w-full h-14 shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
               onClick={() => save.mutate()} 
               disabled={save.isPending}
            >
              {save.isPending ? "Processando…" : "Salvar e Atualizar Dashboard"}
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Metas;

