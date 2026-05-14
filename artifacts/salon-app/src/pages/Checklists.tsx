import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ListChecks, ClipboardCheck, Star, CheckCircle2, ChevronRight, Calculator, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Navigate } from "react-router-dom";

const SIMPLE_SCHEMA = [
  { id: "apresentacao", title: "Apresentação Pessoal", desc: "Uniforme, cabelo alinhado, postura profissional." },
  { id: "pontualidade", title: "Pontualidade e Organização", desc: "Chegou no horário, preparou estação, cumpriu agenda." },
  { id: "atendimento", title: "Atendimento à Cliente", desc: "Recepção cordial, escuta ativa, explicação clara." },
  { id: "qualidade", title: "Qualidade do Serviço", desc: "Técnica, atenção aos detalhes, satisfação final." },
  { id: "ambiente", title: "Organização do Ambiente", desc: "Bancada e chão limpos, descarte correto." },
  { id: "colaboracao", title: "Colaboração com a Equipe", desc: "Respeito com colegas, cooperação." },
  { id: "responsabilidades", title: "Responsabilidades do Dia", desc: "Cumpriu cronograma, ajudou na manutenção." },
  { id: "comercial", title: "Desempenho Comercial", desc: "Sugeriu serviços/produtos, incentivou retorno." },
];

type ChecklistItem = string | { label: string; required?: boolean };
type Tpl = { id: string; name: string; description: string | null; items: ChecklistItem[]; active: boolean };

const Checklists = () => {
  const { salon, user, isProfessionalOnly, loading, isMasterAdmin } = usePermissions();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [itemsText, setItemsText] = useState("");

  // Eval Form State
  const [selectedPro, setSelectedPro] = useState("");
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalNotes, setEvalNotes] = useState("");

  const tplQuery = useQuery({
    enabled: !!salon?.id,
    queryKey: ["templates", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates").select("*").eq("salon_id", salon!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d) => ({ ...d, items: Array.isArray(d.items) ? (d.items as string[]) : [] })) as Tpl[];
    },
  });

  const prosQuery = useQuery({
    enabled: !!salon?.id,
    queryKey: ["pros", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("id, name").eq("salon_id", salon!.id).eq("active", true);
      if (error) throw error;
      return data ?? [];
    }
  });

  const runsQuery = useQuery({
    enabled: !!salon?.id,
    queryKey: ["runs", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_runs")
        .select(`*, professional:professionals(name)`)
        .eq("salon_id", salon!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTpl = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Dê um nome ao checklist");
      const items = itemsText.split("\n").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("checklist_templates").insert({
        salon_id: salon!.id, name: name.trim(), description: desc.trim() || null, items,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Modelo salvo");
      setOpen(false); setName(""); setDesc(""); setItemsText("");
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEvaluation = useMutation({
    mutationFn: async () => {
      if (!selectedPro) throw new Error("Selecione o profissional para salvar.");
      const total = Object.values(evalScores).reduce((acc, val) => acc + (val || 0), 0);
      
      const { data: run, error } = await supabase.from("checklist_runs").insert({
        salon_id: salon!.id,
        professional_id: selectedPro,
        score: total,
        notes: evalNotes,
        created_by: user?.id,
      }).select("id").single();

      if (error) throw error;

      const itemsMeta = SIMPLE_SCHEMA.map(cat => ({
        run_id: run.id,
        label: cat.title,
        rating: evalScores[cat.id] || 0,
        comment: "",
      }));

      const { error: errItems } = await supabase.from("checklist_run_items").insert(itemsMeta);
      if (errItems) throw errItems;
    },
    onSuccess: () => {
      toast.success("Auditado! Pontuação computada.");
      setEvalOpen(false);
      setSelectedPro("");
      setEvalScores({});
      setEvalNotes("");
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getClassification = (score: number) => {
    if (score >= 35) return { label: "Excelência", color: "text-emerald-500", icon: "⭐", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    if (score >= 30) return { label: "Muito bom", color: "text-blue-500", icon: "✨", bg: "bg-blue-500/10", border: "border-blue-500/30" };
    if (score >= 25) return { label: "Bom", color: "text-orange-400", icon: "✓", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    if (score >= 20) return { label: "Atenção", color: "text-amber-600", icon: "⚠️", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    return { label: "Precisa de alinhamento", color: "text-destructive", icon: "❌", bg: "bg-destructive/10", border: "border-destructive/30" };
  };

  const totalScore = Object.values(evalScores).reduce((acc, val) => acc + (val || 0), 0);
  const isLoading = tplQuery.isLoading || runsQuery.isLoading;

  if (loading || isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    );
  }

  if (isProfessionalOnly) return <Navigate to="/dashboard" replace />;

  if (!salon?.id && !isMasterAdmin) {
    return (
      <AppShell>
        <div className="text-center p-12 py-24">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
            <ListChecks size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <Button variant="hero" className="mt-8 px-8" onClick={() => window.location.reload()}>Recarregar Página</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <ClipboardCheck className="h-3 w-3" /> Gestão de Qualidade
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Auditoria</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Mantenha a excelência visualmente. Sem planilhas chatas.</p>
        </div>
        
        <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="w-full sm:w-auto h-14 px-8 text-sm font-bold shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <Plus className="mr-2 h-5 w-5" /> Nova Auditoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-accent/20">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-display text-center text-gradient-gold">Auditoria Rápida</DialogTitle>
              <p className="text-center text-muted-foreground text-sm font-light mt-1">Leva menos de 30 segundos.</p>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="p-1 rounded-xl bg-gradient-to-b from-white/10 to-transparent">
                 <div className="bg-background rounded-lg p-3">
                    <Select value={selectedPro} onValueChange={setSelectedPro}>
                      <SelectTrigger className="h-14 font-display text-xl bg-transparent border-none focus:ring-0">
                        <SelectValue placeholder="👤 Quem está sendo avaliado?" />
                      </SelectTrigger>
                      <SelectContent>
                        {prosQuery.data?.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="grid gap-3">
                {SIMPLE_SCHEMA.map((cat) => (
                  <div key={cat.id} className="glass border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                    <div className="pr-4">
                      <h3 className="font-semibold text-white/90 text-sm">{cat.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cat.desc}</p>
                    </div>
                    <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setEvalScores(prev => ({ ...prev, [cat.id]: score }))}
                          className={cn(
                            "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-sm font-bold transition-all",
                            evalScores[cat.id] === score 
                              ? (score >= 4 ? "bg-emerald-500/20 text-emerald-500" : score === 3 ? "bg-blue-500/20 text-blue-500" : score === 2 ? "bg-amber-500/20 text-amber-500" : "bg-destructive/20 text-destructive")
                              : "text-muted-foreground hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                 <Textarea 
                   value={evalNotes} 
                   onChange={e => setEvalNotes(e.target.value)}
                   placeholder="Anotações opcionais (ex: 'Precisa melhorar a bancada')..."
                   className="h-20 min-h-[5rem] glass text-sm"
                 />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                 <div className="flex-1 flex items-center gap-4 bg-accent/5 p-4 rounded-xl border border-accent/20 w-full">
                    <div className="font-display text-4xl text-accent">
                      {totalScore} <span className="text-sm text-muted-foreground font-sans">/ 40</span>
                    </div>
                    <div className="flex-1">
                       <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Nota do dia</div>
                       <div className={cn("text-sm font-semibold", getClassification(totalScore).color)}>
                         {getClassification(totalScore).label}
                       </div>
                    </div>
                 </div>
                 <Button 
                   className="w-full sm:w-auto px-10 h-16 rounded-xl text-[11px] uppercase tracking-widest font-bold shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all" 
                   variant="hero"
                   disabled={saveEvaluation.isPending || !selectedPro || Object.keys(evalScores).length < SIMPLE_SCHEMA.length}
                   onClick={() => saveEvaluation.mutate()}
                 >
                   Salvar Avaliação
                 </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass overflow-hidden border-border/30">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
               <h2 className="font-display text-xl text-white">Histórico de Performance</h2>
            </div>
            {(runsQuery.data ?? []).length === 0 ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
                <ClipboardCheck className="h-12 w-12 opacity-20 mb-4" />
                <p className="text-sm">Nenhuma auditoria registrada nesta semana.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {runsQuery.data!.map((r: { id: string; created_at: string; score: number; professional?: { name: string } }) => {
                  const cls = getClassification(Number(r.score));
                  return (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-colors hover:bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl font-display text-xl border", cls.bg, cls.color, cls.border)}>
                          {Number(r.score)}
                        </div>
                        <div>
                          <div className="font-semibold text-white/90 text-sm">{r.professional?.name || "Desconhecido"}</div>
                          <div className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")} • {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className={cn("text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border", cls.border, cls.color, cls.bg)}>
                           {cls.label} {cls.icon}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass p-6 text-center border-accent/20 bg-accent/5">
              <Star className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Por que Auditar?</h3>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                 O padrão que você não audita é o padrão que você não exige. 
                 Realize avaliações relâmpago de 30 segundos ao final do dia para manter a barra alta e justificar prêmios (ou advertências) no fim do mês.
              </p>
          </Card>

          <div className="flex items-center justify-between px-2">
            <h2 className="font-display text-xl text-white">Outros Checklists</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="text-accent text-xs font-bold uppercase hover:underline">Novo Modelo</button>
              </DialogTrigger>
              <DialogContent className="border-white/10 glass bg-black/95">
                <DialogHeader><DialogTitle>Criar Checklist Customizado</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Nome (ex: Limpeza Fim de Semana)</Label>
                    <Input className="h-12 bg-black/50 border-white/10" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Itens (um por linha)</Label>
                    <Textarea className="h-32 bg-black/50 border-white/10" value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
                  </div>
                  <Button variant="hero" className="w-full h-12" disabled={createTpl.isPending} onClick={() => createTpl.mutate()}>Salvar Formulário</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tplQuery.data?.map((t) => (
            <Card key={t.id} className="glass shadow-[0_0_20px_rgba(0,0,0,0.2)] p-5 border-white/5 bg-background">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                   <FileText className="h-4 w-4 text-muted-foreground" />
                   <div className="font-medium text-white/90">{t.name}</div>
                </div>
                <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5">{t.items.length} itens</Badge>
              </div>
              <Button className="mt-3 w-full border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors" variant="outline" size="sm">
                Imprimir Documento
              </Button>
            </Card>
          ))}
          
        </div>
      </section>
    </AppShell>
  );
};

export default Checklists;
