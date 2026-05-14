import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeChip } from "@/components/BadgeChip";
import { Star, Link as LinkIcon, Calendar, TrendingUp, Award, Clock, ChevronRight, Activity, Zap, Users, Sparkles, Trash2 } from "lucide-react";
import { fmtBRL, monthRange } from "@/lib/aura";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const ProfessionalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { salon } = usePermissions();
  const { start, end } = monthRange();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profissional removido permanentemente");
      qc.invalidateQueries({ queryKey: ["pros"] });
      navigate("/profissionais");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao excluir profissional"),
  });

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente ${data?.pro?.name}? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate();
    }
  };

  const { data } = useQuery({
    enabled: !!id && !!salon?.id,
    queryKey: ["pro-detail", id, salon?.id],
    queryFn: async () => {
      const [pro, ach, ev, badges, recentAch] = await Promise.all([
        supabase.from("professionals").select("*").eq("id", id!).maybeSingle(),
        supabase.from("achievements").select("amount,kind").eq("professional_id", id!).gte("occurred_at", start).lt("occurred_at", end),
        supabase.from("evaluations").select("rating").eq("professional_id", id!).gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
        supabase.from("badges").select("code,label,reference_month").eq("professional_id", id!).order("awarded_at", { ascending: false }),
        supabase.from("achievements").select("*").eq("professional_id", id!).order("occurred_at", { ascending: false }).limit(5),
      ]);
      const revenue = (ach.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const count = ach.data?.length ?? 0;
      const avg = count ? revenue / count : 0;
      const ratings = (ev.data ?? []).map((r) => r.rating);
      const quality = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0;
      return { 
        pro: pro.data, 
        revenue, 
        count, 
        avg, 
        quality, 
        ratings: ratings.length, 
        badges: badges.data ?? [],
        recentActivities: recentAch.data ?? []
      };
    },
  });

  const evalUrl = `${window.location.origin}/avaliar/${salon?.id}/${id}`;
  const copy = () => { navigator.clipboard.writeText(evalUrl); toast.success("Link copiado"); };

  return (
    <AppShell>
      {!data ? (
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      ) : (
        <>
          <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-gold rounded-full opacity-30 blur-sm group-hover:opacity-50 transition-opacity"></div>
                <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-gradient-gold font-display text-3xl sm:text-4xl text-accent-foreground shadow-gold border-2 border-background">
                  {data?.pro?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background shadow-sm" title="Ativo"></div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent font-semibold px-2 py-0 text-[10px] uppercase">
                    Level 12
                  </Badge>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Expert</span>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-none mb-1">{data?.pro?.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                   <p className="text-sm sm:text-base flex items-center gap-1.5 font-medium">
                    <Zap className="h-4 w-4 text-accent" /> {data?.pro?.role ?? "Especialista"}
                  </p>
                  <span className="h-1 w-1 rounded-full bg-border"></span>
                  <p className="text-sm flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Desde {new Date(data?.pro?.created_at).toLocaleDateString("pt-BR", { year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" /> 
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
              <Button variant="hero" className="w-full sm:w-auto shadow-elegant" onClick={copy}>
                <LinkIcon className="mr-2 h-4 w-4" /> Link de Avaliação
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Stats Grid */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="glass relative overflow-hidden shadow-elegant p-6 group transition-all hover:border-accent/40">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-2">
                      <TrendingUp size={14} className="text-accent" /> Produtividade Mês
                    </div>
                  </div>
                  <div className="mt-2 font-display text-4xl text-gradient-gold mb-4">{fmtBRL(data?.revenue ?? 0)}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      <span>Meta: {fmtBRL(15000)}</span>
                      <span>{((data?.revenue / 15000) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(data?.revenue / 15000) * 100} className="h-1.5 bg-accent/10" />
                  </div>
                </Card>

                <Card className="glass relative overflow-hidden shadow-elegant p-6 group transition-all hover:border-accent/40">
                   <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-2">
                      <Star size={14} className="text-accent" /> Índice de Qualidade
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2 mb-4">
                    <span className="font-display text-4xl">{(data?.quality ?? 0).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground opacity-70">/ 5.0</span>
                    <span className="ml-2 text-xs text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full italic">Elite</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold">
                    <Activity size={12} /> {data?.ratings ?? 0} avaliações verificadas
                  </div>
                </Card>

                <Card className="glass shadow-elegant p-6 border-border/40">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Eficiência</div>
                  <div className="mt-2 font-display text-4xl mb-4">{data?.count ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                    <Clock size={12} className="text-accent" /> Ticket médio: {fmtBRL(data?.avg ?? 0)}
                  </div>
                </Card>

                <Card className="glass shadow-elegant p-6 border-border/40">
                   <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Fideliade</div>
                  <div className="mt-2 font-display text-4xl mb-4">88%</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                    <Users size={12} className="text-accent" /> Retenção de Clientes
                  </div>
                </Card>
              </section>

              {/* Activity Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl tracking-tight">Atividade Recente</h2>
                  <Button variant="ghost" size="sm" className="text-xs font-semibold text-accent uppercase tracking-widest hover:bg-accent/5">
                    Ver Todos <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
                <Card className="glass border-border/40 overflow-hidden">
                  <div className="divide-y divide-border/20">
                    {data.recentActivities.length > 0 ? (
                      data.recentActivities.map((act: { id: string; kind: string; description: string; occurred_at: string; score_delta?: number }) => (
                        <div key={act.id} className="p-4 flex items-center justify-between hover:bg-accent/5 transition-colors group">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                              {act.kind === "service" ? <Zap size={18} /> : <Calendar size={18} />}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{act.description}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Clock size={10} /> {new Date(act.occurred_at).toLocaleDateString("pt-BR")} · {new Date(act.occurred_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display font-bold text-lg">{fmtBRL(act.amount)}</div>
                            <div className="text-[10px] uppercase font-bold text-accent italic">Verificado</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-muted-foreground italic text-sm">
                        Nenhuma atividade registrada hoje.
                      </div>
                    )}
                  </div>
                </Card>
              </section>
            </div>

            <div className="space-y-8">
              {/* Badges Section */}
              <Card className="glass shadow-elegant p-6 border-accent/20 border-l-4 border-l-accent h-fit">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-xl">Conquistas & Medalhas</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {(data?.badges ?? []).map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-border/40 hover:border-accent/40 transition-colors">
                      <BadgeChip code={b.code} label={b.label} className="scale-110" />
                      <div className="text-xs text-muted-foreground leading-tight">
                        Conquistada em<br/><span className="text-foreground font-semibold">{b.reference_month}</span>
                      </div>
                    </div>
                  ))}
                  {(!data?.badges || data.badges.length === 0) && (
                    <div className="text-center py-8">
                       <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-30 italic font-display text-xl">?</div>
                       <p className="text-xs text-muted-foreground leading-relaxed italic">
                        Sem medalhas ainda. <br/>
                        <span className="text-accent font-semibold not-italic">Desafie este profissional</span> para aumentar sua performance.
                       </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-border/40">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-4 tracking-widest">Próxima Meta Sugerida</div>
                  <div className="bg-gradient-gold/10 p-4 rounded-2xl border border-accent/20">
                     <div className="flex items-center gap-2 text-accent font-bold text-xs mb-1 uppercase tracking-tighter">
                      <Sparkles size={14} /> Desafio AI de Performance
                    </div>
                    <div className="text-sm font-semibold mb-2">Aumentar ticket médio em 15%</div>
                    <p className="text-[10px] text-muted-foreground leading-tight mb-3">
                      Com base no histórico, este profissional pode oferecer mais serviços complementares.
                    </p>
                    <Button variant="hero" size="sm" className="w-full text-[10px] h-8 rounded-lg uppercase tracking-widest">Ativar Meta</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
};

export default ProfessionalDetail;
