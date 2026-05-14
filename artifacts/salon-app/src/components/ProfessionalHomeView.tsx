import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { LaunchModal } from "@/components/LaunchModal";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Receipt, Target, Trophy, Clock, Zap, Star, ChevronRight, TrendingUp, Calendar, Scissors, WalletCards } from "lucide-react";
import { fmtBRL, monthRange } from "@/lib/aura";
import { BadgeChip } from "@/components/BadgeChip";
import { motion } from "motion/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Visão simplificada para profissional puro (PWA/mobile).
 */
export const ProfessionalHomeView = () => {
  const { user, salon, profile } = usePermissions();
  const { start, end } = monthRange();

  // Encontra o profissional vinculado ao usuário (heurística: nome igual ao display_name).
  // O salão pode ter múltiplos cadastros — buscamos o primeiro ativo.
  const { data: pro } = useQuery({
    enabled: !!salon?.id && !!user?.id,
    queryKey: ["my-pro", user?.id, salon?.id],
    queryFn: async () => {
      const name = profile?.display_name?.trim();
      if (!name) return null;
      const { data } = await supabase
        .from("professionals")
        .select("id,name")
        .eq("salon_id", salon!.id)
        .eq("active", true)
        .ilike("name", name)
        .maybeSingle();
      return data;
    },
  });

  const { data: myActivity } = useQuery({
    enabled: !!pro?.id && !!salon?.id,
    queryKey: ["my-recent-activity", pro?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("*")
        .eq("professional_id", pro!.id)
        .order("occurred_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: myCommissions } = useQuery({
    enabled: !!pro?.id && !!salon?.id,
    queryKey: ["my-commissions", pro?.id],
    queryFn: async () => {
       const { data } = await supabase.from("commissions").select("category_id,percent").eq("salon_id", salon!.id).eq("professional_id", pro!.id);
       return data ?? [];
    }
  });

  const { data: monthlyStats } = useQuery({
    enabled: !!pro?.id && !!salon?.id,
    queryKey: ["my-monthly-stats", pro?.id, start, end],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("amount, occurred_at, category_id")
        .eq("professional_id", pro!.id)
        .gte("occurred_at", start)
        .lt("occurred_at", end);
      return data ?? [];
    },
  });

  const { data: goal } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["my-goal", salon?.id],
    queryFn: async () => {
      const now = new Date();
      const { data } = await supabase
        .from("salon_goals")
        .select("target_revenue")
        .eq("salon_id", salon!.id)
        .eq("year", now.getFullYear())
        .eq("month", now.getMonth() + 1)
        .maybeSingle();
      const { count } = await supabase
        .from("professionals")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", salon!.id)
        .eq("active", true);
      const total = Number(data?.target_revenue ?? 0);
      const share = count && count > 0 ? total / count : 0;
      return { share };
    },
  });

  const { data: todayAppointments } = useQuery({
    enabled: !!pro?.id && !!salon?.id,
    queryKey: ["my-appointments-today", pro?.id],
    queryFn: async () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

      const { data } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          status,
          client:client_records(client_name),
          service:services(name, duration)
        `)
        .eq("professional_id", pro!.id)
        .gte("appointment_date", start)
        .lte("appointment_date", end)
        .order("appointment_date");
      return data ?? [];
    },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  
  // Gets the start of the week (assuming Sunday as start)
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay());
  const startOfWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();

  let dailyRevenue = 0;
  let weeklyRevenue = 0;
  let monthlyRevenue = 0;
  let count = 0;
  
  let myCutThisMonth = 0;

  if (monthlyStats) {
    count = monthlyStats.length;
    monthlyStats.forEach(r => {
      const amt = Number(r.amount);
      monthlyRevenue += amt;
      if (r.occurred_at >= startOfWeek) {
        weeklyRevenue += amt;
      }
      if (r.occurred_at >= startOfDay) {
        dailyRevenue += amt;
      }
      
      // Calculate Cut
      if (myCommissions && myCommissions.length > 0) {
         let rule = myCommissions.find(c => c.category_id === r.category_id);
         if (!rule) rule = myCommissions.find(c => !c.category_id);
         const pct = rule ? Number(rule.percent) : 0;
         myCutThisMonth += amt * (pct / 100);
      }
    });
  }

  const monthlyShare = goal?.share ?? 0;
  const weeklyShare = monthlyShare / 4;
  const dailyShare = monthlyShare / 22; // Approx 22 working days

  const monthlyPct = monthlyShare > 0 ? Math.min(100, (monthlyRevenue / monthlyShare) * 100) : 0;
  const weeklyPct = weeklyShare > 0 ? Math.min(100, (weeklyRevenue / weeklyShare) * 100) : 0;
  const dailyPct = dailyShare > 0 ? Math.min(100, (dailyRevenue / dailyShare) * 100) : 0;
  const { data: badges } = useQuery({
    enabled: !!pro?.id,
    queryKey: ["my-badges", pro?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("badges")
        .select("code,label,awarded_at")
        .eq("professional_id", pro!.id)
        .order("awarded_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const revenue = monthlyRevenue;
  const share = goal?.share ?? 0;
  const pct = monthlyPct;

  return (
    <AppShell>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent-soft font-semibold">
            <Sparkles className="h-3 w-3" /> Olá, {profile?.display_name?.split(" ")[0]}
          </div>
          <h1 className="font-display text-4xl leading-none">Meu Dashboard</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center font-display text-accent-foreground text-lg shadow-gold border border-background">
          {profile?.display_name?.charAt(0)}
        </div>
      </header>

      <div className="space-y-6">
        {/* Main Action */}
        <LaunchModal
          trigger={
            <Button variant="hero" size="lg" className="w-full h-14 text-lg shadow-elegant rounded-2xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Receipt className="mr-3 h-6 w-6" /> Lançar Atendimento
              <ChevronRight className="ml-auto opacity-50 group-hover:translate-x-1 transition-transform" />
            </Button>
          }
        />

        {/* Meu Pagamento */}
        <Card className="glass overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.06)] border-accent/30 relative flex flex-col p-6">
           <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 bg-accent/10 rounded-full blur-3xl"></div>
           
           <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold font-mono">
                 <WalletCards className="h-4 w-4 text-accent" /> Meu Repasse • {new Date().toLocaleDateString("pt-BR", { month: "long" })}
              </div>
           </div>
           
           <div className="relative z-10 mt-1">
              <div className="font-display text-5xl text-white tracking-tighter mb-1 relative inline-block">
                 <span className="text-2xl text-accent/80 font-mono tracking-normal absolute -left-6 top-1.5">R$</span>
                 {myCutThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded inline-flex items-center gap-1.5">
                 <Scissors className="h-3.5 w-3.5 text-accent/80" /> {count} faturamentos registrados geraram sua comissão.
              </div>
           </div>
        </Card>

        {/* Goal Card */}
        <Card className="glass relative overflow-hidden shadow-elegant p-6 border-accent/20 border-l-4 border-l-accent flex flex-col gap-6">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 bg-accent/5 rounded-full blur-2xl"></div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-bold italic">
                 <Target className="h-3.5 w-3.5 text-accent" /> Meta Diária
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mb-2 -mt-2">
              <div className="font-display text-3xl text-gradient-gold">{fmtBRL(dailyRevenue)}</div>
              <div className="flex flex-col items-end">
                <div className="text-sm font-semibold text-muted-foreground">de {fmtBRL(dailyShare)}</div>
                <div className="text-[10px] text-muted-foreground">{dailyRevenue < dailyShare ? `Faltam ${fmtBRL(dailyShare - dailyRevenue)}` : 'Meta batida'}</div>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex mb-1.5 items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Hoje</div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-accent">{dailyPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-accent/10 border border-accent/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-gold"
                ></motion.div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Meta Semanal</div>
              <div className="font-display text-xl">{fmtBRL(weeklyRevenue)}</div>
              <div className="text-[10px] text-muted-foreground mb-2">de {fmtBRL(weeklyShare)} ({weeklyRevenue < weeklyShare ? `Faltam ${fmtBRL(weeklyShare - weeklyRevenue)}` : 'Meta batida'})</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden h-1.5 text-xs flex rounded-full bg-accent/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${weeklyPct}%` }} className="bg-accent" />
                </div>
                <span className="text-[10px] font-mono text-accent">{weeklyPct.toFixed(0)}%</span>
              </div>
            </div>
            
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Meta Mensal</div>
              <div className="font-display text-xl">{fmtBRL(monthlyRevenue)}</div>
              <div className="text-[10px] text-muted-foreground mb-2">de {fmtBRL(monthlyShare)} ({monthlyRevenue < monthlyShare ? `Faltam ${fmtBRL(monthlyShare - monthlyRevenue)}` : 'Meta batida'})</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden h-1.5 text-xs flex rounded-full bg-accent/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${monthlyPct}%` }} className="bg-accent" />
                </div>
                <span className="text-[10px] font-mono text-accent">{monthlyPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          
          {monthlyPct >= 100 ? (
             <p className="text-[10px] text-accent flex items-center gap-1.5 font-bold italic bg-accent/10 p-2 rounded-lg justify-center">
               <Trophy size={12} /> Parabéns! Você bateu a meta do mês!
             </p>
          ) : (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 opacity-80 italic">
              <Sparkles size={10} className="text-accent" /> Bata a meta mensal para ganhar bonificações exclusivas.
            </p>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass p-5 border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Atendimentos</div>
            <div className="font-display text-3xl leading-none">{count}</div>
            <div className="mt-2 text-[10px] text-accent font-bold flex items-center gap-1">
              <TrendingUp size={10} /> +2 esta semana
            </div>
          </Card>
          <Card className="glass p-5 border-border/40 hover:border-accent/30 transition-colors">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2 font-mono">Qualidade Média</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Star size={18} className="text-accent fill-accent" />
              <div className="font-display text-4xl leading-none tracking-tighter">5.0</div>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground font-semibold flex items-center gap-1 opacity-80">
              <ChevronRight size={10} /> 12 AVALIAÇÕES GLOBAIS
            </div>
          </Card>
        </div>

        {/* Agenda Hoje */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="flex items-center gap-2 font-display text-xl tracking-tight">
               <Calendar className="h-4 w-4 text-accent" /> Agenda de Hoje
             </h2>
             <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
               {now.toLocaleDateString("pt-BR", { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')}
             </span>
          </div>
          
          <div className="space-y-3">
             {!todayAppointments ? (
                <div className="p-8 text-center text-sm text-muted-foreground italic glass rounded-xl border border-border/30">
                  Carregando agenda...
                </div>
             ) : todayAppointments.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center text-sm text-muted-foreground italic glass rounded-xl border border-border/30 gap-2">
                  <Sparkles className="h-6 w-6 text-accent/50" />
                  Nenhum agendamento para hoje.
                </div>
             ) : (
                todayAppointments.map((appt: { id: string; appointment_date: string; client_name: string; services?: { name: string } }) => (
                  <Card key={appt.id} className="glass border-border/40 p-4 relative overflow-hidden group hover:border-accent/30 transition-colors">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/40 group-hover:bg-accent transition-colors" />
                     <div className="flex items-center justify-between">
                       <div>
                         <div className="text-accent font-mono text-sm font-bold mb-1">
                           {format(new Date(appt.appointment_date), "HH:mm")}
                         </div>
                         <div className="font-semibold text-base mb-0.5">
                           {appt.client?.client_name || "Cliente sem nome"}
                         </div>
                         <div className="text-xs text-muted-foreground flex items-center gap-1">
                           <Scissors className="h-3 w-3" /> {appt.service?.name} ({appt.service?.duration} min)
                         </div>
                       </div>
                       <div className="text-right">
                         <div className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border ${
                           appt.status === 'completed' ? 'border-green-500/30 text-green-500 bg-green-500/10' :
                           appt.status === 'canceled' ? 'border-destructive/30 text-destructive bg-destructive/10' :
                           appt.status === 'confirmed' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' :
                           'border-accent/30 text-accent bg-accent/10'
                         }`}>
                           {appt.status}
                         </div>
                       </div>
                     </div>
                  </Card>
                ))
             )}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl tracking-tight">
            <Clock className="h-4 w-4 text-accent" /> Histórico Recente
          </h2>
          <Card className="glass border-border/40 overflow-hidden divide-y divide-border/20">
            {myActivity && myActivity.length > 0 ? (
              myActivity.map((b: { id: string; description: string; occurred_at: string }) => (
                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-accent/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{b.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(b.occurred_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="font-display font-black text-lg">{fmtBRL(b.amount)}</div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground italic">
                Nenhum lançamento recente.
              </div>
            )}
          </Card>
        </section>

        {/* Badges */}
        <section className="pb-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl tracking-tight">
            <Trophy className="h-4 w-4 text-accent" /> Minhas Conquistas
          </h2>
          <div className="flex flex-wrap gap-2">
            {!badges?.length ? (
              <Card className="glass p-8 w-full text-center border-dashed border-accent/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trabalhe bem para conquistar sua<br/>primeira <span className="text-accent font-bold">Medalha de Honra</span>.
                </p>
              </Card>
            ) : (
              badges.map((b) => (
                <BadgeChip key={b.code + b.awarded_at} code={b.code} label={b.label} />
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
