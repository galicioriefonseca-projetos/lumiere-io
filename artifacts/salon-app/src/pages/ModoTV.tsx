import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { useVertical } from "@/contexts/VerticalContext";
import { useRealtime, usePresence } from "@/hooks/useRealtime";
import { UpgradeGate } from "@/components/UpgradeGate";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BadgeChip } from "@/components/BadgeChip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tv, Trophy, Crown, Flame, Sparkles, Wifi, Monitor, Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { fmtBRL, monthRange } from "@/lib/aura";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

const ModoTV = () => {
  const { can, salon, profile, user } = usePermissions();
  const { t } = useVertical();
  const [searchParams] = useSearchParams();
  const isTVMode = searchParams.get("tv") === "true";
  
  const { year, month, start, end } = monthRange();
  const [online, setOnline] = useState<{ id: string; name: string }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tvLink = `${window.location.origin}/modo-tv?tv=true`;

  const copyLink = () => {
    navigator.clipboard.writeText(tvLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const { data, isLoading } = useQuery({
    enabled: !!salon?.id && can.useTVMode,
    queryKey: ["live-aura", salon?.id, start],
    queryFn: async () => {
      const since60 = new Date(Date.now() - 60 * 86400_000).toISOString();
      const [pros, ach, goal, badges] = await Promise.all([
        supabase.from("professionals").select("id,name,role").eq("salon_id", salon!.id).eq("active", true),
        supabase.from("achievements").select("amount,professional_id,occurred_at").eq("salon_id", salon!.id).gte("occurred_at", since60),
        supabase.from("salon_goals").select("target_revenue").eq("salon_id", salon!.id).eq("year", year).eq("month", month).maybeSingle(),
        supabase.from("badges").select("id,code,label,professional_id,awarded_at").eq("salon_id", salon!.id).order("awarded_at", { ascending: false }).limit(6),
      ]);

      const monthAch = (ach.data ?? []).filter((a) => a.occurred_at >= start && a.occurred_at < end);
      const map = new Map<string, number>();
      monthAch.forEach((r) => map.set(r.professional_id, (map.get(r.professional_id) ?? 0) + Number(r.amount)));
      const totalRevenue = Array.from(map.values()).reduce((s, v) => s + v, 0);
      const target = Number(goal.data?.target_revenue ?? 0);

      // streaks
      const streakByPro = new Map<string, number>();
      (pros.data ?? []).forEach((p) => {
        const days = new Set(
          (ach.data ?? []).filter((a) => a.professional_id === p.id)
            .map((a) => new Date(a.occurred_at).toISOString().slice(0, 10)),
        );
        let streak = 0;
        const cursor = new Date();
        for (let i = 0; i < 60; i++) {
          const k = cursor.toISOString().slice(0, 10);
          if (days.has(k)) streak += 1;
          else if (i > 0) break;
          cursor.setDate(cursor.getDate() - 1);
        }
        streakByPro.set(p.id, streak);
      });

      const proName = new Map((pros.data ?? []).map((p) => [p.id, p.name]));
      const ranking = (pros.data ?? [])
        .map((p) => ({ ...p, revenue: map.get(p.id) ?? 0, streak: streakByPro.get(p.id) ?? 0 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const recentBadges = (badges.data ?? []).map((b) => ({ ...b, proName: proName.get(b.professional_id) ?? "" }));

      return { ranking, totalRevenue, target, pct: target ? (totalRevenue / target) * 100 : 0, recentBadges };
    },
  });

  // Realtime central
  useRealtime("tv", salon?.id, [
    { table: "achievements", event: "INSERT", invalidate: [["live-aura", salon?.id, start]] },
    { table: "badges", event: "INSERT", invalidate: [["live-aura", salon?.id, start]] },
    { table: "salon_goals", invalidate: [["live-aura", salon?.id, start]] },
    { table: "evaluations", event: "INSERT", invalidate: [["live-aura", salon?.id, start]] },
  ]);

  // Presence: quem está vendo o painel
  usePresence(
    "tv-presence",
    salon?.id,
    user && profile ? { id: user.id, name: profile.display_name ?? user.email ?? "Membro" } : null,
    (state) => {
      const flat: { id: string; name: string }[] = [];
      Object.values(state).forEach((arr) => arr.forEach((m) => flat.push({ id: m.id, name: m.name })));
      setOnline(flat);
    },
  );

  if (isLoading) {
    return (
      <AppShell minimal={isTVMode}>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!can.useTVMode) {
    return <AppShell minimal={isTVMode}><UpgradeGate feature="Modo TV — Live Ranking" /></AppShell>;
  }

  return (
    <AppShell minimal={isTVMode}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Tv className="h-3 w-3" /> Live · em tempo real
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
              <Wifi className="h-3 w-3" /> {online.length} {online.length === 1 ? "online" : "onlines"}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">Top {t.professionals.toLowerCase()}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isTVMode && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-accent/20 bg-accent/5 hover:bg-accent/10">
                  <Monitor className="h-4 w-4" /> Conectar TV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Conectar à Televisão</DialogTitle>
                  <DialogDescription>
                    Abra o ranking em tempo real em qualquer Smart TV ou monitor.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                  <div className="rounded-xl bg-white p-4 shadow-xl">
                    <QRCodeSVG value={tvLink} size={200} level="H" />
                  </div>
                  
                  <div className="w-full space-y-2">
                    <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Ou use o link direto</p>
                    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2 border border-border/50">
                      <code className="flex-1 truncate text-xs text-muted-foreground">{tvLink}</code>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-accent/5 p-4 text-xs leading-relaxed text-muted-foreground border border-accent/10">
                    <p><strong>Dica:</strong> Para a melhor experiência, após abrir o link na TV, utilize o botão de "Tela Cheia" para ocultar as barras do navegador.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-accent"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>

          <Trophy className="h-10 w-10 text-accent hidden sm:block ml-2" />
        </div>
      </header>

      <Card className="glass shadow-elegant mb-8 overflow-hidden p-6 sm:p-7 relative">
        <div className="absolute inset-0 bg-gradient-royal opacity-30" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-accent-soft">Meta do salão</div>
              <div className="font-display text-4xl sm:text-5xl text-gradient-gold">{fmtBRL(data?.totalRevenue ?? 0)}</div>
              <div className="text-sm text-muted-foreground">de {fmtBRL(data?.target ?? 0)}</div>
            </div>
            <div className="sm:text-right font-display text-5xl sm:text-6xl text-accent">{(data?.pct ?? 0).toFixed(0)}%</div>
          </div>
          <Progress value={Math.min(100, data?.pct ?? 0)} className="mt-5 h-4" />
        </div>
      </Card>

      <div className="space-y-3">
        <AnimatePresence>
          {(data?.ranking ?? []).map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 220, damping: 24 }}
            >
              <Card className={`glass shadow-elegant flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between ${i === 0 ? "ring-1 ring-accent" : ""}`}>
                <div className="flex items-center gap-5">
                  <div className={`relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full font-display text-3xl sm:text-4xl ${i === 0 ? "bg-gradient-gold text-accent-foreground shadow-gold" : "bg-secondary"}`}>
                    {i === 0 && <Crown className="absolute -top-4 h-6 w-6 text-accent" />}
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-2xl sm:text-3xl truncate leading-tight">{p.name}</div>
                    <div className="text-base text-muted-foreground truncate">{p.role ?? "Profissional"}</div>
                    {p.streak > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent">
                        <Flame className="h-4 w-4" /> {p.streak} dias seguidos
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end justify-between sm:flex-col sm:items-end border-t border-border/20 pt-4 sm:border-0 sm:pt-0">
                  <div className="font-display text-4xl sm:text-5xl text-gradient-gold leading-none">{fmtBRL(p.revenue)}</div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">faturamento mês</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {(data?.ranking ?? []).length === 0 && (
          <Card className="glass p-10 text-center text-muted-foreground">Cadastre profissionais e registre lançamentos para ver o ranking.</Card>
        )}
      </div>

      {/* Conquistas recentes */}
      {(data?.recentBadges ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-2xl">
            <Sparkles className="h-5 w-5 text-accent" /> Conquistas recentes
          </h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {data!.recentBadges.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="glass flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <BadgeChip code={b.code} label={b.label} />
                      <span className="text-sm">{b.proName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(b.awarded_at).toLocaleDateString("pt-BR")}</span>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </AppShell>
  );
};

export default ModoTV;
