import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Sparkles, Link as LinkIcon, MessageCircleHeart, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { last30Range } from "@/lib/aura";

const Avaliacoes = () => {
  const { salon, loading: permsLoading } = usePermissions();
  const [filterPro, setFilterPro] = useState<string>("all");
  
  // Stabilize start date to avoid refetch loops in TanStack Query v5
  const { start } = useMemo(() => last30Range(), []);

  const { data: pros, isLoading: prosLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["pros-eval", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id,name,role")
        .eq("salon_id", salon!.id)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: evals, isLoading: evalsLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["evals-list", salon?.id, start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("id,rating,comment,client_name,created_at,professional_id")
        .eq("salon_id", salon!.id)
        .gte("created_at", start)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = permsLoading || (!!salon?.id && (prosLoading || evalsLoading));

  const proMap = useMemo(() => new Map((pros ?? []).map((p) => [p.id, p])), [pros]);
  const filtered = useMemo(
    () => (evals ?? []).filter((e) => filterPro === "all" || e.professional_id === filterPro),
    [evals, filterPro],
  );

  const stats = useMemo(() => {
    const list = filtered;
    const n = list.length;
    const avg = n ? list.reduce((s, r) => s + r.rating, 0) / n : 0;
    const dist = [1,2,3,4,5].map((s) => list.filter((r) => r.rating === s).length);
    return { n, avg, dist };
  }, [filtered]);

  const buildLink = (proId: string) => `${window.location.origin}/avaliar/${salon?.id}/${proId}`;

  const copyLink = (proId: string) => {
    navigator.clipboard.writeText(buildLink(proId));
    toast.success("Link copiado");
  };

  const shareWA = (proId: string, proName: string) => {
    const url = buildLink(proId);
    const msg = `Olá! Gostaríamos de saber sua opinião sobre o atendimento com ${proName}. Avalie em: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const qrUrl = (proId: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(buildLink(proId))}`;

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Skeleton className="h-40" />
             <Skeleton className="h-40 md:col-span-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Sparkles className="h-3 w-3" /> Reputação · 30 dias
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">Avaliações</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">Acompanhe a percepção dos clientes em tempo real.</p>
        </div>
        <div className="w-full sm:w-60">
          <Select value={filterPro} onValueChange={setFilterPro}>
            <SelectTrigger><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {(pros ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="glass shadow-elegant p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Média 30 dias</div>
          <div className="mt-2 flex items-baseline gap-2">
            <Star className="h-7 w-7 fill-accent text-accent" />
            <span className="font-display text-5xl text-gradient-gold">{stats.avg.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{stats.n} avaliações</div>
        </Card>
        <Card className="glass shadow-elegant p-6 md:col-span-2">
          <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Distribuição</div>
          <div className="space-y-2">
            {[5,4,3,2,1].map((s) => {
              const count = stats.dist[s-1];
              const pct = stats.n ? (count / stats.n) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span className="w-6 tabular-nums">{s}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Incentivo a coletar mais avaliações */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Pedir avaliações</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(pros ?? []).map((p) => (
            <Card key={p.id} className="glass shadow-elegant flex items-center gap-4 p-4">
              <img src={qrUrl(p.id)} alt={`QR avaliar ${p.name}`} className="h-20 w-20 rounded-md bg-white p-1" loading="lazy" />
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.role ?? "Profissional"}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => copyLink(p.id)}><LinkIcon className="mr-1 h-3 w-3" />Link</Button>
                  <Button size="sm" variant="outline" onClick={() => shareWA(p.id, p.name)}><Share2 className="mr-1 h-3 w-3" />WhatsApp</Button>
                  <a href={qrUrl(p.id)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost"><QrCode className="mr-1 h-3 w-3" />QR</Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Lista recente */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Recentes</h2>
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="glass p-10 text-center text-muted-foreground">
              <MessageCircleHeart className="mx-auto mb-2 h-8 w-8 text-accent" />
              Sem avaliações nos últimos 30 dias. Compartilhe os links acima.
            </Card>
          )}
          {filtered.map((e) => {
            const pro = proMap.get(e.professional_id);
            return (
              <Card key={e.id} className="glass shadow-elegant p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${n <= e.rating ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {pro ? <Link to={`/profissionais/${pro.id}`} className="hover:text-accent">{pro.name}</Link> : "—"}
                        {e.client_name ? ` · ${e.client_name}` : ""}
                      </span>
                    </div>
                    {e.comment && <p className="mt-2 text-sm">{e.comment}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString("pt-BR")}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
};

export default Avaliacoes;
