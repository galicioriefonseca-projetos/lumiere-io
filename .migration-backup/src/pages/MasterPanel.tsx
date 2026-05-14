import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Crown, ShieldAlert, Clock, CheckCircle2, Trash2, UserX, Eye, Sparkles, Wand2, Database
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type SalonRow = {
  id: string;
  name: string;
  owner_name: string | null;
  business_type: "salon" | "clinic";
  plan: "studio" | "elite";
  is_active: boolean;
  activation_status: "pending" | "active" | "suspended";
  has_custom_branding: boolean;
  created_at: string;
  phone: string | null;
  tax_id: string | null;
};

type ProfileRow = {
  id: string;
  salon_id: string | null;
  email: string;
  full_name: string | null;
  birth_date: string | null;
  username: string | null;
  created_at: string;
};

const statusBadge = (s: SalonRow["activation_status"]) => {
  if (s === "active") return <Badge className="bg-emerald-500/20 text-emerald-300"><CheckCircle2 className="mr-1 h-3 w-3" />Ativo</Badge>;
  if (s === "pending") return <Badge variant="outline" className="border-accent text-accent"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
  return <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" />Suspenso</Badge>;
};

const MasterPanel = () => {
  const { isMasterAdmin, loading, profile: masterProfile, user: authUser } = usePermissions();
  const qc = useQueryClient();
  const [details, setDetails] = useState<SalonRow | null>(null);
  const [approvePlan, setApprovePlan] = useState<Record<string, "studio" | "elite">>({});
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: salons, isLoading: salonsLoading } = useQuery({
    enabled: isMasterAdmin,
    queryKey: ["all-salons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salons")
        .select("id,name,owner_name,business_type,plan,is_active,activation_status,has_custom_branding,created_at,phone,tax_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SalonRow[];
    },
  });

  const { data: profiles, isLoading: profsLoading } = useQuery({
    enabled: isMasterAdmin,
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,salon_id,email,full_name,birth_date,username,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  useEffect(() => {
    if (!isMasterAdmin) return;
    const instanceId = Math.random().toString(36).substring(7);
    const ch = supabase
      .channel(`master-salons-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "salons" }, () => {
        qc.invalidateQueries({ queryKey: ["all-salons"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["all-profiles"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isMasterAdmin, qc]);

  const updateSalon = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SalonRow> }) => {
      const { error } = await supabase.from("salons").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["all-salons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async ({ salon_id, plan }: { salon_id: string; plan: "studio" | "elite" }) => {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "approve_salon", salon_id, plan },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acesso liberado!");
      qc.invalidateQueries({ queryKey: ["all-salons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuário removido");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purgeAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "purge_non_master" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contas não-master removidas");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedFictionalSalon = async () => {
    setIsSeeding(true);
    const toastId = toast.loading("Gerando cenário demo...");
    let salonId = masterProfile?.salon_id;

    try {
      const userId = masterProfile?.id || authUser?.id;
      if (!userId) throw new Error("Usuário não identificado");

      // 1. Garantir que o usuário tem um salão
      if (!salonId) {
        toast.loading("Configurando salão master...", { id: toastId });
        
        const payload = {
          name: "Espaço Monte Moriá",
          owner_name: "Salomão",
          business_type: "salon",
          plan: "elite",
          is_active: true,
          activation_status: "active",
          onboarded_at: new Date().toISOString()
        };

        const { data: newSalonData, error: salonErr } = await supabase.rpc("create_salon_rpc", { _payload: payload });
        
        if (salonErr) throw salonErr;
        if (!newSalonData) throw new Error("Falha ao criar salão");
        
        const newSalon = newSalonData as { id: string };
        salonId = newSalon.id;

        const { error: profileErr } = await supabase.from("profiles").upsert({
          id: userId,
          salon_id: salonId,
          email: authUser?.email || "leandropfonseca20@gmail.com"
        } as never);
        
        if (profileErr) throw profileErr;
      } else {
        toast.loading("Atualizando salão existente...", { id: toastId });
        const { error: updErr } = await supabase.from("salons").update({
          name: "Espaço Monte Moriá",
          owner_name: "Salomão",
          business_type: "salon",
          plan: "elite",
          is_active: true,
          activation_status: "active"
        } as never).eq("id", salonId);
        if (updErr) throw updErr;
      }

      // 2. Categorias
      toast.loading("Criando categorias...", { id: toastId });
      const categories = [
        { name: "Cabelos", icon: "💇‍♂️", color: "#D4AF37" },
        { name: "Barbas", icon: "🧔", color: "#8E9196" },
        { name: "Estética", icon: "✨", color: "#D4AF37" },
        { name: "Produtos", icon: "🧴", color: "#D4AF37" }
      ];

      const { data: cats, error: catsErr } = await supabase.from("service_categories").insert(
        categories.map(c => ({ salon_id: salonId, ...c }))
      ).select();

      if (catsErr) throw catsErr;

      const catMap = (cats ?? []).reduce((acc: Record<string, string>, curr: { id: string; name: string }) => {
        acc[curr.name] = curr.id;
        return acc;
      }, {});

      // 3. Profissionais
      toast.loading("Contratando profissionais demo...", { id: toastId });
      const prosData = [
        { name: "Isaque", role: "Manager", active: true },
        { name: "Rute", role: "Hair Stylist", active: true },
        { name: "Boaz", role: "Barbeiro", active: true },
        { name: "Ester", role: "Maquiadora", active: true },
        { name: "Davi", role: "Especialista em Cortes", active: true }
      ];

      const { data: pros, error: prosErr } = await supabase.from("professionals").insert(
        prosData.map(p => ({ salon_id: salonId, ...p }))
      ).select();

      if (prosErr) throw prosErr;
      if (!pros || pros.length === 0) throw new Error("Nenhum profissional foi criado.");

      // 4. Metas
      toast.loading("Definindo metas...", { id: toastId });
      const now = new Date();
      const { error: goalErr } = await supabase.from("salon_goals").upsert({
        salon_id: salonId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        target_revenue: 25000
      }, { onConflict: 'salon_id,year,month' });

      if (goalErr) throw goalErr;

      // 5. Achievements (Vendas)
      toast.loading("Gerando histórico de vendas...", { id: toastId });
      const achievementsList = [];
      const descriptions = [
        { name: "Corte Degradê", cat: "Cabelos", price: 60, kind: 'service' },
        { name: "Barba Terapia", cat: "Barbas", price: 45, kind: 'service' },
        { name: "Selagem Capilar", cat: "Cabelos", price: 180, kind: 'service' },
        { name: "Maquiagem Social", cat: "Estética", price: 150, kind: 'service' },
        { name: "Pomada Modeladora", cat: "Produtos", price: 55, kind: 'product' },
        { name: "Shampoo Premium", cat: "Produtos", price: 85, kind: 'product' }
      ];

      const clients = ["Abraão", "Sara", "Jacó", "Lea", "Moisés", "Miriam", "Samuel", "Débora", "Gideão"];

      for (let i = 0; i < 40; i++) {
        const pro = pros[Math.floor(Math.random() * pros.length)];
        const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 25));
        
        achievementsList.push({
          salon_id: salonId,
          professional_id: pro.id,
          category_id: catMap[desc.cat],
          kind: desc.kind,
          description: desc.name,
          amount: Math.round((desc.price + (Math.random() * 20 - 10)) * 100) / 100,
          client_name: clients[Math.floor(Math.random() * clients.length)],
          occurred_at: date.toISOString()
        });
      }

      const { error: achErr } = await supabase.from("achievements").insert(achievementsList);
      if (achErr) throw achErr;

      // 6. Checklist
      toast.loading("Configurando processos...", { id: toastId });
      const { error: checkErr } = await supabase.from("checklist_templates").insert({
        salon_id: salonId,
        name: "Abertura Monte Moriá",
        description: "Rotina diária de excelência",
        items: [
          { label: "Verificar estoque de toalhas", required: true },
          { label: "Café e águas saborizadas", required: true },
          { label: "Som ambiente e temperatura", required: true },
          { label: "Sanitização das bancadas", required: true }
        ],
        active: true
      });
      if (checkErr) throw checkErr;

      toast.success("Cenário Monte Moriá gerado com sucesso!", { id: toastId });
      qc.invalidateQueries();
    } catch (err: unknown) {
      console.error("Critical Seed Error:", err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error("Erro na geração: " + msg, { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) return <AppShell><div className="text-muted-foreground">Carregando…</div></AppShell>;
  if (!isMasterAdmin) return <Navigate to="/dashboard" replace />;

  const total = salons?.length ?? 0;
  const elite = salons?.filter((s) => s.plan === "elite").length ?? 0;
  const studio = salons?.filter((s) => s.plan === "studio").length ?? 0;
  const pending = salons?.filter((s) => s.activation_status === "pending").length ?? 0;
  const suspended = salons?.filter((s) => !s.is_active || s.activation_status === "suspended").length ?? 0;

  const profileFor = (salonId: string) => profiles?.find((p) => p.salon_id === salonId);
  const isLoading = salonsLoading || profsLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Crown className="h-3 w-3" /> Painel Master · GF Estratégia Digital
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">Visão Global</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Aprove cadastros, defina planos e gerencie todas as contas da plataforma.</p>
        </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto border-accent/20 bg-accent/5 text-accent hover:bg-accent/10">
                  <Wand2 className="mr-2 h-4 w-4" /> Gerar Cenário Demo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Gerar Salão Fictício?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá renomear seu salão atual para **Monte Moriá** e popular com profissionais (Isaque, Rute, etc), metas e vendas de exemplo.
                    Útil para demonstrações de venda.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={seedFictionalSalon} disabled={isSeeding}>
                    {isSeeding ? "Gerando..." : "Gerar Agora"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full sm:w-auto"><UserX className="mr-2 h-4 w-4" /> Limpar contas</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar todas as contas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação remove permanentemente todas as contas exceto leandropfonseca20@gmail.com.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => purgeAll.mutate()} disabled={purgeAll.isPending}>
                    Confirmar exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="glass p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Salões</div><div className="font-display text-3xl text-gradient-gold">{total}</div></Card>
        <Card className="glass p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Elite</div><div className="font-display text-3xl">{elite}</div></Card>
        <Card className="glass p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Signature</div><div className="font-display text-3xl">{studio}</div></Card>
        <Card className="glass p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Pendentes</div><div className="font-display text-3xl text-accent">{pending}</div></Card>
        <Card className="glass p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Suspensos</div><div className="font-display text-3xl text-destructive">{suspended}</div></Card>
      </section>

      <h2 className="mt-12 mb-4 font-display text-2xl">Cadastros & Licenciamento</h2>
      <Card className="glass overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salons?.map((s) => {
              const p = profileFor(s.id);
              const planChoice = approvePlan[s.id] ?? s.plan;
              const isPending = s.activation_status === "pending" || !s.is_active;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-display text-base">{s.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {s.business_type === "clinic" ? "Clínica" : "Salão"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.owner_name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p?.email ?? "—"}</TableCell>
                  <TableCell>{statusBadge(s.activation_status)}</TableCell>
                  <TableCell>
                    <Select
                      value={s.plan}
                      onValueChange={(v) => updateSalon.mutate({ id: s.id, patch: { plan: v as SalonRow["plan"] } })}
                    >
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Signature</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(v) =>
                        updateSalon.mutate({
                          id: s.id,
                          patch: {
                            is_active: v,
                            activation_status: v ? "active" : "suspended",
                          },
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => setDetails(s)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-display text-2xl text-gradient-gold">
                              {details?.name || "Detalhes do Parceiro"}
                            </DialogTitle>
                          </DialogHeader>
                          {details && (
                            <div className="space-y-2 text-sm">
                              <div><span className="text-muted-foreground">Proprietário:</span> {details.owner_name ?? "—"}</div>
                              <div><span className="text-muted-foreground">Tipo:</span> {details.business_type === "clinic" ? "Clínica" : "Salão"}</div>
                              <div><span className="text-muted-foreground">Email:</span> {profileFor(details.id)?.email ?? "—"}</div>
                              <div><span className="text-muted-foreground">Telefone:</span> {details.phone ?? "—"}</div>
                              <div><span className="text-muted-foreground">CPF/CNPJ:</span> {details.tax_id ?? "—"}</div>
                              <div><span className="text-muted-foreground">Usuário:</span> {profileFor(details.id)?.username ?? "—"}</div>
                              <div><span className="text-muted-foreground">Nascimento:</span> {profileFor(details.id)?.birth_date ?? "—"}</div>
                              <div><span className="text-muted-foreground">Cadastrado em:</span> {new Date(details.created_at).toLocaleString("pt-BR")}</div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {isPending ? (
                        <div className="flex items-center gap-1">
                          <Select
                            value={planChoice}
                            onValueChange={(v) => setApprovePlan((m) => ({ ...m, [s.id]: v as "studio" | "elite" }))}
                          >
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="studio">Signature</SelectItem>
                              <SelectItem value="elite">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="hero"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate({ salon_id: s.id, plan: planChoice })}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
                          </Button>
                        </div>
                      ) : null}

                      {p && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apaga permanentemente {p.email} e todos os dados vinculados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser.mutate(p.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
};

export default MasterPanel;
