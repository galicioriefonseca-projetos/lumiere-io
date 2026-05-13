import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { LaunchModal } from "@/components/LaunchModal";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Scissors, ShoppingBag, Search, Filter } from "lucide-react";
import { fmtBRL, monthRange } from "@/lib/aura";
import { Skeleton } from "@/components/ui/skeleton";

const Lancamentos = () => {
  const { salon, loading: permsLoading, isMasterAdmin } = usePermissions();
  const { start, end } = monthRange();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");

  const { data, isLoading: queryLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["ach", salon?.id, start],
    queryFn: async () => {
      const { data: rows, error: achError } = await supabase
        .from("achievements")
        .select("id,kind,description,amount,client_name,occurred_at,professional_id")
        .eq("salon_id", salon!.id)
        .gte("occurred_at", start)
        .lt("occurred_at", end)
        .order("occurred_at", { ascending: false });
      
      if (achError) throw achError;

      const { data: pros, error: proError } = await supabase
        .from("professionals").select("id,name").eq("salon_id", salon!.id);
      
      if (proError) throw proError;

      const map = new Map((pros ?? []).map((p) => [p.id, p.name]));
      const total = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const count = rows?.length ?? 0;
      const avg = count ? total / count : 0;
      return { rows: rows ?? [], proName: map, total, count, avg };
    },
  });

  const isLoading = permsLoading || (!!salon?.id && queryLoading);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return data.rows.filter((r) => {
      const matchesSearch = r.description.toLowerCase().includes(search.toLowerCase()) || 
                            (r.client_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesKind = kindFilter === "all" || r.kind === kindFilter;
      return matchesSearch && matchesKind;
    });
  }, [data, search, kindFilter]);

  if (permsLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    );
  }

  if (!salon?.id && !isMasterAdmin) {
    return (
      <AppShell>
        <div className="text-center p-12 py-24">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
            <Receipt size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Não conseguimos identificar o seu estabelecimento para visualizar os lançamentos.
          </p>
          <Button variant="hero" className="mt-8 px-8" onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Receipt className="h-3 w-3" /> Performance financeira
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Lançamentos</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Mês atual · {data?.count ?? 0} atendimentos</p>
        </div>
        <div className="w-full sm:w-auto">
          <LaunchModal />
        </div>
      </header>

      <section id="performance-metrics" className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card id="revenue-total" className="glass shadow-elegant p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Faturamento</div>
          <div className="mt-2 font-display text-4xl text-gradient-gold">{fmtBRL(data?.total ?? 0)}</div>
        </Card>
        <Card id="average-ticket" className="glass shadow-elegant p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Ticket médio</div>
          <div className="mt-2 font-display text-4xl">{fmtBRL(data?.avg ?? 0)}</div>
        </Card>
        <Card id="service-count" className="glass shadow-elegant p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Atendimentos</div>
          <div className="mt-2 font-display text-4xl">{data?.count ?? 0}</div>
        </Card>
      </section>

      <Card id="history-header" className="mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input 
            placeholder="Buscar por descrição ou cliente..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 h-11 sm:h-10" 
            aria-label="Buscar lançamentos"
          />
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="flex-1 sm:w-[160px] h-11 sm:h-10" aria-label="Filtrar por tipo de lançamento">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="service">Apenas Serviços</SelectItem>
              <SelectItem value="product">Apenas Produtos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="glass shadow-elegant divide-y divide-border/60 overflow-hidden">
        {filteredRows.map((r) => (
          <div key={r.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${r.kind === "service" ? "bg-accent/15 text-accent" : "bg-secondary text-foreground"}`}>
                {r.kind === "service" ? <Scissors className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.description}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {data?.proName.get(r.professional_id) ?? "—"}
                  {r.client_name ? ` · ${r.client_name}` : ""}
                  {" · "}{new Date(r.occurred_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <Badge variant="outline" className="border-border/60">{r.kind === "service" ? "Serviço" : "Produto"}</Badge>
              <div className="font-display text-xl text-gradient-gold">{fmtBRL(Number(r.amount))}</div>
            </div>
          </div>
        ))}
        {filteredRows.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">Nenhum lançamento encontrado com este filtro.</div>
        )}
      </Card>
    </AppShell>
  );
};

export default Lancamentos;
