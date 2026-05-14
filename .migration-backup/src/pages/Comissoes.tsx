import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { useVertical } from "@/contexts/VerticalContext";
import { useRealtime } from "@/hooks/useRealtime";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Percent, Search, WalletCards, ArrowRightLeft, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { commissionSchema } from "@/lib/validators";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtBRL, monthRange } from "@/lib/aura";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Comissoes = () => {
  const { salon } = usePermissions();
  const { t } = useVertical();
  const qc = useQueryClient();
  const [proId, setProId] = useState("");
  const [catId, setCatId] = useState<string>("");
  const [percent, setPercent] = useState("40");
  const [search, setSearch] = useState("");
  const { start, end } = monthRange();

  const { data: pros, isLoading: prosLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["pros-list", salon?.id],
    queryFn: async () => (await supabase.from("professionals").select("id,name").eq("salon_id", salon!.id).eq("active", true).order("name")).data ?? [],
  });
  const { data: cats, isLoading: catsLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["cats-list", salon?.id],
    queryFn: async () => (await supabase.from("service_categories").select("id,name").eq("salon_id", salon!.id).order("name")).data ?? [],
  });
  const { data: rows, isLoading: rowsLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["commissions", salon?.id],
    queryFn: async () => (await supabase.from("commissions").select("*").eq("salon_id", salon!.id)).data ?? [],
  });
  
  const { data: achievements, isLoading: achLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["achievements-for-commissions", salon?.id, start, end],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("professional_id, amount, category_id, kind, created_at")
        .eq("salon_id", salon!.id)
        .gte("occurred_at", start)
        .lt("occurred_at", end);
      return data ?? [];
    }
  });

  const isLoading = prosLoading || catsLoading || rowsLoading || achLoading;

  useRealtime("commissions", salon?.id, [
    { table: "commissions", invalidate: [["commissions", salon?.id]] },
  ]);

  const proName = useMemo(() => (id: string) => pros?.find((p) => p.id === id)?.name ?? "—", [pros]);
  const catName = useMemo(() => (id?: string | null) => cats?.find((c) => c.id === id)?.name ?? "Geral (todas)", [cats]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => proName(r.professional_id).toLowerCase().includes(search.toLowerCase()));
  }, [rows, search, proName]);
  
  const fechamento = useMemo(() => {
     if (!achievements || !rows || !pros) return [];
     
     const result: Record<string, { proName: string; totalRevenue: number; totalCut: number; services: number }> = {};
     
     pros.forEach(p => {
       result[p.id] = { proName: p.name, totalRevenue: 0, totalCut: 0, services: 0 };
     });
     
     achievements.forEach(ach => {
        const amt = Number(ach.amount);
        if (!result[ach.professional_id]) return;
        
        result[ach.professional_id].totalRevenue += amt;
        result[ach.professional_id].services += 1;
        
        // Match rule
        // 1st try exact category match
        let rule = rows.find(r => r.professional_id === ach.professional_id && r.category_id === ach.category_id);
        // 2nd try general rule (category_id = null)
        if (!rule) {
           rule = rows.find(r => r.professional_id === ach.professional_id && !r.category_id);
        }
        
        const pct = rule ? Number(rule.percent) : 0;
        result[ach.professional_id].totalCut += (amt * (pct / 100));
     });
     
     // Filter out strictly 0s if they have no services, but keep if revenue > 0
     return Object.values(result)
        .filter(r => r.totalRevenue > 0 || r.services > 0)
        .sort((a,b) => b.totalRevenue - a.totalRevenue);
  }, [achievements, rows, pros]);

  const create = useMutation({
    mutationFn: async () => {
      const parsed = commissionSchema.safeParse({
        professional_id: proId,
        category_id: catId,
        percent: Number(percent),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("commissions").insert({
        salon_id: salon!.id,
        professional_id: parsed.data.professional_id,
        category_id: parsed.data.category_id || null,
        percent: parsed.data.percent,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comissão definida"); setProId(""); setCatId(""); setPercent("40"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Removida"),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-gradient-gold">Financeiro & Repasses</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Mês atual: repassando lucros com transparência.</p>
        </div>
      </header>

      <Tabs defaultValue="fechamento" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 w-full sm:w-auto p-1">
          <TabsTrigger value="fechamento" className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
             <WalletCards className="h-4 w-4" /> Resumo do Mês
          </TabsTrigger>
          <TabsTrigger value="regras" className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold data-[state=active]:bg-white/10">
             <Percent className="h-4 w-4" /> Regras de Comissão
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fechamento" className="space-y-4 outline-none">
          {fechamento.length === 0 ? (
             <div className="p-12 glass border-border/40 rounded-xl text-center flex flex-col items-center gap-4">
                <Sparkles className="h-10 w-10 text-accent/50" />
                <div>
                   <h3 className="font-display text-2xl text-foreground mb-2">Mês ainda não iniciou as trações</h3>
                   <p className="text-muted-foreground text-sm max-w-md mx-auto">Assim que os profissionais realizarem atendimentos ou vendas neste mês, os repasses aparecerão aqui magicamente.</p>
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {fechamento.map(f => {
                   const sCut = f.totalRevenue - f.totalCut;
                   return (
                     <Card key={f.proName} className="glass p-0 overflow-hidden border-border/40 hover:border-accent/40 transition-colors">
                        <div className="p-5 flex items-center justify-between border-b border-border/30 bg-white/[0.02]">
                           <div className="font-display text-2xl text-foreground">{f.proName}</div>
                           <div className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/40 px-2 py-1 rounded border border-white/10">
                              {f.services} Lançamentos
                           </div>
                        </div>
                        <div className="p-5 grid grid-cols-3 gap-4">
                           <div className="space-y-1">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Faturamento</div>
                              <div className="text-lg font-medium text-white/90">{fmtBRL(f.totalRevenue)}</div>
                           </div>
                           <div className="space-y-1">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Lucro Salão</div>
                              <div className="text-lg font-medium text-emerald-400">{fmtBRL(sCut)}</div>
                           </div>
                           <div className="space-y-1">
                              <div className="text-[10px] uppercase tracking-widest text-accent font-bold font-mono">Repasse p/ Ele</div>
                              <div className="text-xl font-display text-accent bg-accent/10 px-2 py-1 -mx-2 rounded inline-block shadow-[0_0_15px_rgba(212,175,55,0.15)] flex items-center gap-1.5 border border-accent/20">
                                 <ArrowRightLeft className="h-4 w-4" />
                                 {fmtBRL(f.totalCut)}
                              </div>
                           </div>
                        </div>
                     </Card>
                   )
               })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="regras" className="space-y-6 outline-none">
          <Card className="glass p-6 border-border/30 shadow-[0_0_30px_rgba(212,175,55,0.02)]">
            <h3 className="font-display text-xl mb-6">Nova Regra</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_120px_auto]">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Profissional</Label>
                <Select value={proId} onValueChange={setProId}>
                  <SelectTrigger className="h-12 bg-black/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(pros ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Categoria (opcional)</Label>
                <Select value={catId} onValueChange={setCatId}>
                  <SelectTrigger className="h-12 bg-black/40"><SelectValue placeholder="Geral (todas)" /></SelectTrigger>
                  <SelectContent>
                    {(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Repasse %</Label>
                <Input className="h-12 bg-black/40 font-mono text-lg" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button variant="hero" className="h-12 w-full rounded-md" onClick={() => create.mutate()} disabled={create.isPending}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>
          </Card>

          <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar regra por profissional..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-12 bg-white/5 border-white/10" />
          </div>

          <div className="space-y-3">
            {filteredRows.length === 0 ? (
               <div className="p-8 text-center text-sm text-muted-foreground italic glass rounded-xl border border-border/30">Nenhuma regra de comissão cadastrada.</div>
            ) : filteredRows.map((r) => (
              <Card key={r.id} className="glass p-4 sm:flex-row sm:items-center sm:justify-between border-border/30 hover:border-white/20 transition-colors flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10"><Percent className="h-5 w-5 text-accent shrink-0" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-lg text-white truncate">{proName(r.professional_id)}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest truncate">{catName(r.category_id)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="font-mono text-2xl text-gradient-gold px-4 py-1.5 bg-accent/5 rounded border border-accent/10">{Number(r.percent).toFixed(1)}%</div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)} className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <Trash2 className="h-5 w-5 text-destructive/80" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
    </AppShell>
  );
};

export default Comissoes;

