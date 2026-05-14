import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BadgeChip } from "@/components/BadgeChip";
import { Trophy, Crown, Flame, Sparkles, Medal } from "lucide-react";
import { fmtBRL, monthRange } from "@/lib/aura";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Pro = { id: string; name: string; role: string | null };

const Gamificacao = () => {
  const { salon } = usePermissions();
  const { start, end } = monthRange();

  const { data, isLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["gamificacao", salon?.id, start],
    queryFn: async () => {
      const since60 = new Date(Date.now() - 60 * 86400_000).toISOString();
      const [pros, ach, badges] = await Promise.all([
        supabase.from("professionals").select("id,name,role").eq("salon_id", salon!.id).eq("active", true),
        supabase.from("achievements").select("professional_id,amount,occurred_at").eq("salon_id", salon!.id).gte("occurred_at", since60),
        supabase.from("badges").select("id,code,label,reference_month,awarded_at,professional_id").eq("salon_id", salon!.id).order("awarded_at", { ascending: false }),
      ]);

      const proList = (pros.data ?? []) as Pro[];
      const achList = ach.data ?? [];
      const badgeList = badges.data ?? [];

      // Faturamento mês corrente por pro
      const monthRev = new Map<string, number>();
      achList.filter((a) => a.occurred_at >= start && a.occurred_at < end)
        .forEach((a) => monthRev.set(a.professional_id, (monthRev.get(a.professional_id) ?? 0) + Number(a.amount)));

      // Streak: dias consecutivos com pelo menos 1 lançamento (até hoje)
      const streakByPro = new Map<string, number>();
      proList.forEach((p) => {
        const days = new Set(
          achList.filter((a) => a.professional_id === p.id)
            .map((a) => new Date(a.occurred_at).toISOString().slice(0, 10)),
        );
        let streak = 0;
        const cursor = new Date();
        // se hoje não tem, começa contagem a partir de ontem
        for (let i = 0; i < 60; i++) {
          const k = cursor.toISOString().slice(0, 10);
          if (days.has(k)) streak += 1;
          else if (i > 0) break;
          cursor.setDate(cursor.getDate() - 1);
        }
        streakByPro.set(p.id, streak);
      });

      // Badges agregados por pro
      const badgesByPro = new Map<string, typeof badgeList>();
      badgeList.forEach((b) => {
        const arr = badgesByPro.get(b.professional_id) ?? [];
        arr.push(b);
        badgesByPro.set(b.professional_id, arr);
      });

      const ranking = proList
        .map((p) => ({
          ...p,
          revenue: monthRev.get(p.id) ?? 0,
          streak: streakByPro.get(p.id) ?? 0,
          badges: (badgesByPro.get(p.id) ?? []).length,
        }))
        .sort((a, b) => b.revenue - a.revenue || b.badges - a.badges);

      return { ranking, badgeHistory: badgeList, proList };
    },
  });

  const proById = useMemo(() => new Map((data?.proList ?? []).map((p) => [p.id, p])), [data?.proList]);

  useEffect(() => {
    if (!salon?.id) return;
    const instanceId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`badges-channel-${salon.id}-${instanceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'badges', filter: `salon_id=eq.${salon?.id}` }, async (payload) => {
        const { data: pro } = await supabase.from("professionals").select("name").eq("id", payload.new.professional_id).single();
        toast.success(`Parabéns ${pro?.name}! Ganhou uma nova medalha: ${payload.new.label}!`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [salon?.id]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
          <div className="space-y-2">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Trophy className="h-3 w-3" /> Gamificação · Lumière.io
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">Hall da Excelência</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">Ranking, sequências e conquistas conquistadas pelo time.</p>
        </div>
      </header>

      {/* Ranking */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(data?.ranking ?? []).slice(0, 3).map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`glass shadow-elegant p-6 ${i === 0 ? "ring-1 ring-accent" : ""}`}>
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-2xl ${i === 0 ? "bg-gradient-gold text-accent-foreground shadow-gold" : "bg-secondary"}`}>
                  {i === 0 ? <Crown className="h-5 w-5" /> : i + 1}
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-gradient-gold">{fmtBRL(p.revenue)}</div>
                  <div className="text-xs text-muted-foreground">faturamento mês</div>
                </div>
              </div>
              <Link to={`/profissionais/${p.id}`} className="mt-3 block font-display text-xl hover:text-accent">{p.name}</Link>
              <div className="text-xs text-muted-foreground">{p.role ?? "Profissional"}</div>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-accent"><Flame className="h-4 w-4" />{p.streak}d streak</span>
                <span className="inline-flex items-center gap-1"><Medal className="h-4 w-4 text-accent" />{p.badges} medalha{p.badges === 1 ? "" : "s"}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Tabela completa */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Ranking completo</h2>
        <Card className="glass shadow-elegant divide-y divide-border/60">
          {(data?.ranking ?? []).map((p, i) => (
            <div key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="w-6 text-right text-sm tabular-nums text-muted-foreground">{i + 1}</div>
                <Link to={`/profissionais/${p.id}`} className="font-medium hover:text-accent">{p.name}</Link>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Flame className="h-3 w-3 text-accent" />{p.streak}d</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Medal className="h-3 w-3 text-accent" />{p.badges}</span>
                <span className="font-display text-lg text-gradient-gold">{fmtBRL(p.revenue)}</span>
              </div>
            </div>
          ))}
          {(data?.ranking ?? []).length === 0 && (
            <div className="p-10 text-center text-muted-foreground">Sem dados ainda.</div>
          )}
        </Card>
      </section>

      {/* Histórico de badges */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-2xl">
          <Sparkles className="h-5 w-5 text-accent" /> Histórico de medalhas
        </h2>
        <div className="space-y-2">
          {(data?.badgeHistory ?? []).slice(0, 30).map((b) => {
            const pro = proById.get(b.professional_id);
            return (
              <Card key={b.id} className="glass flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <BadgeChip code={b.code} label={b.label} />
                  <Link to={`/profissionais/${b.professional_id}`} className="text-sm hover:text-accent">
                    {pro?.name ?? "—"}
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(b.awarded_at).toLocaleDateString("pt-BR")} · ref. {new Date(b.reference_month).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </div>
              </Card>
            );
          })}
          {(data?.badgeHistory ?? []).length === 0 && (
            <Card className="glass p-10 text-center text-muted-foreground">Nenhuma medalha conquistada ainda.</Card>
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default Gamificacao;
