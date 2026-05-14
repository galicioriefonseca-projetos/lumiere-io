import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, ShieldCheck, Mail, Search, UserPlus, TrendingUp, UserCheck, UserMinus, MoreVertical, Edit2, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Professionals = () => {
  const { salon, limits, plan, isOwner, isMasterAdmin, isProfessionalOnly, loading, user } = usePermissions();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

  // Gerente
  const [mgrOpen, setMgrOpen] = useState(false);
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrPwd, setMgrPwd] = useState("");
  const [mgrName, setMgrName] = useState("");

  const { data: pros, isLoading: prosLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["pros", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*").eq("salon_id", salon!.id).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invitations, isLoading: invitesLoading } = useQuery({
    enabled: !!salon?.id && (isOwner || isMasterAdmin),
    queryKey: ["invitations", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salon_invitations")
        .select("*")
        .eq("salon_id", salon!.id)
        .eq("role", "manager")
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      return data ?? [];
    }
  });

  const createInvite = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { error } = await supabase
        .from("salon_invitations")
        .insert({
          salon_id: salon!.id,
          email: email.trim().toLowerCase(),
          role: role as "owner" | "manager" | "professional",
          invited_by: user!.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite enviado!");
      setMgrOpen(false); setMgrEmail(""); setMgrName("");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salon_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite cancelado");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: managers, isLoading: mgrLoading } = useQuery({
    enabled: !!salon?.id && (isOwner || isMasterAdmin),
    queryKey: ["managers", salon?.id],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("salon_id", salon!.id)
        .eq("role", "manager");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data: ps } = await supabase
        .from("profiles")
        .select("id,email,full_name,username,created_at")
        .in("id", ids);
      return ps ?? [];
  },
  });

  const filteredPros = useMemo(() => {
    if (!pros) return [];
    return pros.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [pros, search]);

  const filteredManagers = useMemo(() => {
    if (!managers) return [];
    return managers.filter((m) => (m.full_name ?? m.email).toLowerCase().includes(search.toLowerCase()));
  }, [managers, search]);

  const stats = useMemo(() => {
    if (!pros) return { total: 0, active: 0, inactive: 0 };
    return {
      total: pros.length,
      active: pros.filter(p => p.active).length,
      inactive: pros.filter(p => !p.active).length
    };
  }, [pros]);

  const toggleStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { error } = await supabase
        .from("professionals")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["pros"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profissional removido permanentemente");
      qc.invalidateQueries({ queryKey: ["pros"] });
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao excluir profissional"),
  });

  const create = useMutation({
    mutationFn: async ({ name, role }: { name: string; role: string }) => {
      const trimmedName = name.trim();
      const trimmedRole = role.trim();
      
      if (!trimmedName) throw new Error("Informe o nome do profissional");
      if (!salon?.id) throw new Error("Salão não identificado. Recarregue a página.");

      console.log("Tentando criar profissional:", { name: trimmedName, role: trimmedRole, salon_id: salon.id });

      const { data, error } = await supabase
        .from("professionals")
        .insert({
          salon_id: salon.id,
          name: trimmedName,
          role: trimmedRole || null,
          active: true
        })
        .select();

      if (error) {
        console.error("Erro ao inserir profissional:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Profissional adicionado!");
      setOpen(false);
      setName("");
      setRole("");
      qc.invalidateQueries({ queryKey: ["pros"] });
    },
    onError: (e: Error) => {
      console.error("Mutation error:", e);
      toast.error(e.message || "Erro ao adicionar profissional");
    },
  });

  const removeManager = useMutation({
    mutationFn: async (userId: string) => {
      // Remover o papel de gerente
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("salon_id", salon!.id)
        .eq("role", "manager");
      
      if (roleError) throw roleError;

      // Opcionalmente, desvincular do salão no perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ salon_id: null })
        .eq("id", userId);
      
      if (profileError) {
        console.warn("Gerente removido da role, mas houve erro ao limpar salon_id do perfil:", profileError);
      }
    },
    onSuccess: () => {
      toast.success("Acesso de gerente removido");
      qc.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createManager = useMutation({
    mutationFn: async () => {
      if (!mgrName.trim()) throw new Error("Informe o nome do gerente");
      if (!mgrEmail.trim()) throw new Error("Informe o email");
      if (mgrPwd.length < 8) throw new Error("Senha mínima de 8 caracteres");
      
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "create_manager",
          salon_id: salon!.id,
          email: mgrEmail.trim(),
          password: mgrPwd,
          full_name: mgrName.trim(),
        },
      });

      if (error) {
        if (error.message?.includes("404")) {
          throw new Error("Serviço de Gestão de Usuários (Edge Function) não implantado. Por favor, implante as funções no Supabase Dashboard.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Gerente cadastrado! Ele já pode entrar com email e senha.");
      setMgrOpen(false); setMgrEmail(""); setMgrPwd(""); setMgrName("");
      qc.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (e: Error) => {
      console.error("Erro na mutação createManager:", e);
      toast.error(e.message || "Erro na comunicação com a Edge Function");
    },
  });

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    );
  }

  if (isProfessionalOnly) return <Navigate to="/dashboard" replace />;

  if (!salon?.id) {
    return (
      <AppShell>
        <div className="text-center p-12 py-24">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Não conseguimos identificar o seu estabelecimento. Por favor, verifique se o seu perfil está corretamente configurado ou tente recarregar a página.
          </p>
          <Button variant="hero" className="mt-8 px-8" onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Users className="h-3 w-3" /> Gestão de Pessoal
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Equipe</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            Visualize e faça a gestão dos talentos do {salon?.name}
          </p>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
        <Card className="glass p-4 border-l-4 border-l-accent shadow-elegant flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total da Equipe</div>
            <div className="text-2xl font-display leading-none mt-1">{stats.total}</div>
          </div>
        </Card>
        
        <Card className="glass p-4 border-l-4 border-l-emerald-500 shadow-elegant flex items-center gap-4 text-emerald-500">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ativos</div>
            <div className="text-2xl font-display leading-none mt-1">{stats.active}</div>
          </div>
        </Card>

        <Card className="glass p-4 border-l-4 border-l-amber-500 shadow-elegant flex items-center gap-4 text-amber-500">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <UserMinus size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vagas Restantes</div>
            <div className="text-2xl font-display leading-none mt-1">
              {limits.maxProfessionals === Infinity ? "∞" : Math.max(0, limits.maxProfessionals - stats.active)}
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="pros" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <TabsList className="bg-secondary p-1 rounded-xl w-full sm:w-auto h-auto">
            <TabsTrigger value="pros" className="rounded-lg py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Profissionais
            </TabsTrigger>
            {(isOwner || isMasterAdmin) && (
              <TabsTrigger value="managers" className="rounded-lg py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Gerentes
              </TabsTrigger>
            )}
          </TabsList>

          <div className="relative w-full sm:w-64 order-first sm:order-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 h-10 border-accent/10 focus:border-accent/40 bg-secondary/50 rounded-xl" 
            />
          </div>
        </div>

        <TabsContent value="pros" className="mt-0">
          {prosLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto">
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="hero" 
                        className="w-full sm:w-auto shadow-elegant" 
                        aria-label="Adicionar novo profissional"
                        disabled={stats.active >= limits.maxProfessionals}
                      >
                        <Plus className="mr-2 h-4 w-4" /> 
                        {stats.active >= limits.maxProfessionals ? "Limite Atingido" : "Adicionar Profissional"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader><DialogTitle className="font-display text-2xl">Novo profissional</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="pro-name">Nome completo</Label>
                          <Input id="pro-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maria Silva" className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5 pt-2">
                          <Label htmlFor="pro-role">Especialidade / Função</Label>
                          <Input id="pro-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Cabeleireira, Recepção..." className="rounded-xl" />
                          <div className="flex flex-wrap gap-2 pt-2">
                            {["Recepção", "Cabeleireiro(a)", "Manicure", "Esteticista", "Barbeiro(a)"].map((r) => (
                              <Badge key={r} variant="outline" className="cursor-pointer hover:bg-accent/10" onClick={() => setRole(r)}>
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="hero" className="w-full mt-2 h-11" onClick={() => create.mutate({ name, role })} disabled={create.isPending}>
                          {create.isPending ? "Processando..." : "Confirmar Cadastro"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-accent/20 text-accent hover:bg-accent/5 rounded-xl h-10"
                    aria-label="Copiar link de convite para profissionais"
                    onClick={() => {
                        const link = `${window.location.origin}/convite/${salon?.id}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Link de convite copiado!");
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Link de Convite
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPros.map((p) => (
                  <Card key={p.id} className="group relative glass shadow-elegant p-0 transition-all hover:border-accent/40 overflow-hidden border-border/40">
                    <div className="absolute top-3 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem asChild>
                            <Link to={`/profissionais/${p.id}`} className="cursor-pointer">
                              <Edit2 size={14} className="mr-2" /> Editar Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleStatus.mutate({ id: p.id, active: !p.active })}
                            className="cursor-pointer"
                          >
                            <Power size={14} className="mr-2" /> 
                            {p.active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir permanentemente ${p.name}? Esta ação não pode ser desfeita.`)) {
                                deletePro.mutate(p.id);
                              }
                            }}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" /> 
                            Excluir Profissional
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link to={`/profissionais/${p.id}`} className="block p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-gold font-display text-2xl text-accent-foreground shadow-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 pr-4">
                          <div className="font-display text-xl leading-tight truncate">{p.name}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">{p.role ?? "Especialista"}</div>
                        </div>
                      </div>
                      
                      <div className="mt-5 flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`
                            border-none px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider
                            ${p.active ? "bg-emerald-500/10 text-emerald-500" : "bg-neutral-500/10 text-neutral-500"}
                          `}
                        >
                          {p.active ? (
                            <div className="flex items-center gap-1"><UserCheck size={10} /> Ativo</div>
                          ) : (
                            <div className="flex items-center gap-1"><UserMinus size={10} /> Inativo</div>
                          )}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ESTE MÊS: <span className="text-accent font-bold font-sans">Level 12</span>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}

                {filteredPros.length === 0 && !prosLoading && (
                  <Card className="p-12 text-center border-dashed bg-secondary/20 col-span-full">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
                      <Users size={32} />
                    </div>
                    <div className="text-lg font-display text-muted-foreground uppercase tracking-widest">Nenhum talento encontrado</div>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                       Aumente sua equipe para impulsionar a performance do seu negócio.
                    </p>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {(isOwner || isMasterAdmin) && (
          <TabsContent value="managers" className="mt-0">
            {mgrLoading ? (
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
               </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl leading-tight">Gestores do Salão</h3>
                    <p className="text-xs text-muted-foreground max-w-lg mt-1">
                      Gerentes podem gerenciar a equipe, metas, qualidade e clientes, mas não possuem acesso ao faturamento completo e branding.
                    </p>
                  </div>
                  <Dialog open={mgrOpen} onOpenChange={setMgrOpen}>
                    <DialogTrigger asChild>
                      <Button variant="hero" className="w-full sm:w-auto shadow-elegant">
                        <Plus className="mr-2 h-4 w-4" /> Novo Gerente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-display text-3xl text-gradient-gold">
                          Cadastrar Gerente
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label>Nome completo *</Label>
                          <Input value={mgrName} onChange={(e) => setMgrName(e.target.value)} placeholder="Nome do gerente" className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email corporativo *</Label>
                          <Input
                            type="email"
                            value={mgrEmail}
                            onChange={(e) => setMgrEmail(e.target.value)}
                            placeholder="gerente@exemplo.com"
                            className="rounded-xl h-11"
                          />
                        </div>
                        <div className="rounded-2xl border border-accent/10 bg-accent/5 p-4 text-xs text-muted-foreground flex gap-3 items-center italic">
                          <ShieldCheck className="h-6 w-6 text-accent shrink-0" />
                          <span>
                            Ao convidar um gerente, ele receberá permissões administrativas para gerenciar a equipe e checklists. 
                            Ele deve se cadastrar com o mesmo email informado para assumir o cargo automaticamente.
                          </span>
                        </div>
                        <Button
                          variant="hero"
                          className="w-full h-12 text-lg shadow-elegant mt-2"
                          onClick={() => createInvite.mutate({ email: mgrEmail, role: "manager" })}
                          disabled={createInvite.isPending}
                        >
                          {createInvite.isPending ? "Enviando Convite..." : "Enviar Convite de Gerente"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {invitations && invitations.length > 0 && (
                  <div className="mb-8 p-4 rounded-xl border border-dashed border-accent/20 bg-accent/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                       <Mail size={12} /> Convites Pendentes ({invitations.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {invitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{inv.email}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Expira em {new Date(inv.expires_at).toLocaleDateString()}</div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteInvite.mutate(inv.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredManagers.map((m) => (
                    <Card key={m.id} className="glass shadow-elegant p-6 border-border/40 relative overflow-hidden group transition-all hover:border-accent/30">
                      <div className="absolute top-0 right-0 w-24 h-24 -mt-12 -mr-12 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all"></div>
                      
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem 
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja remover o acesso de gerente de ${m.full_name ?? m.email}?`)) {
                                  removeManager.mutate(m.id);
                                }
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> 
                              Remover Acesso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-gold font-display text-3xl text-accent-foreground shadow-elegant">
                          {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-2xl truncate mb-1">{m.full_name ?? "Gerente"}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate opacity-80">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <Mail size={14} className="text-accent" />
                            </div>
                            {m.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between border-t border-border/30 pt-4">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-accent/5 border-accent/20 text-accent font-semibold px-3">
                            <ShieldCheck size={12} className="mr-1.5" /> Nível Manager
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase font-mono tracking-tighter">
                          Ingressou em {new Date(m.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </Card>
                  ))}
                  
                  {filteredManagers.length === 0 && (
                    <Card className="glass p-12 text-center border-dashed md:col-span-2 opacity-60">
                      <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 stroke-[1px]" />
                      <div className="text-lg font-display uppercase tracking-widest text-muted-foreground">Sem gestores adicionais</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Somente gerentes cadastrados aparecerão nesta lista.
                      </p>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </AppShell>
  );
};

export default Professionals;
