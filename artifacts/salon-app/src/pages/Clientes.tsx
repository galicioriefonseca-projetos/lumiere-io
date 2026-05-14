import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Search, User, Phone, Calendar, Camera, Trash2, Pencil, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { clientRecordSchema } from "@/lib/validators";

import { Navigate } from "react-router-dom";

const Clientes = () => {
  const { salon, user, isProfessionalOnly, loading, isMasterAdmin } = usePermissions();
  const { t, isClinic } = useVertical();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Record<string, unknown> | null>(null);
  const [editingClient, setEditingClient] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    birth_date: "",
    notes: "",
  });

  // Load form when editing
  const openEdit = (client: Record<string, unknown>) => {
    setEditingClient(client);
    setForm({
      client_name: client.client_name,
      client_phone: client.client_phone || "",
      client_email: client.client_email || "",
      birth_date: client.birth_date || "",
      notes: client.notes || "",
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditingClient(null);
    setForm({ client_name: "", client_phone: "", client_email: "", birth_date: "", notes: "" });
    setOpen(true);
  };

  // View Client Details
  const openDetails = (client: Record<string, unknown>) => {
    setSelectedClient(client);
    setDetailsOpen(true);
  };

  // Appointments for selected client
  const { data: clientAppointments, isLoading: loadingAppointments } = useQuery({
    enabled: !!salon?.id && !!selectedClient?.id && detailsOpen,
    queryKey: ["client-appointments", selectedClient?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          professional:professionals(name),
          service:services(name, price, duration)
        `)
        .eq("salon_id", salon!.id)
        .eq("client_id", selectedClient!.id as string)
        .order("appointment_date", { ascending: false });
      return data ?? [];
    },
  });

  const { data } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["client-records", salon?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_records")
        .select("*")
        .eq("salon_id", salon!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useRealtime("clients", salon?.id, [
    { table: "client_records", invalidate: [["client-records", salon?.id]] },
  ]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter(
      (r) =>
        r.client_name.toLowerCase().includes(s) ||
        (r.client_phone ?? "").toLowerCase().includes(s) ||
        (r.client_email ?? "").toLowerCase().includes(s),
    );
  }, [data, q]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const parsed = clientRecordSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("client_records").update({
        client_name: parsed.data.client_name,
        client_phone: parsed.data.client_phone || null,
        client_email: parsed.data.client_email || null,
        birth_date: parsed.data.birth_date || null,
        notes: parsed.data.notes || null,
      }).eq("id", editingClient.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${isClinic ? "Prontuário" : "Ficha"} atualizado`);
      setForm({ client_name: "", client_phone: "", client_email: "", birth_date: "", notes: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["client-records", salon?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = clientRecordSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("client_records").insert({
        salon_id: salon!.id,
        client_name: parsed.data.client_name,
        client_phone: parsed.data.client_phone || null,
        client_email: parsed.data.client_email || null,
        birth_date: parsed.data.birth_date || null,
        notes: parsed.data.notes || null,
        created_by: user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${isClinic ? "Prontuário" : "Ficha"} criado`);
      setForm({ client_name: "", client_phone: "", client_email: "", birth_date: "", notes: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["client-records", salon?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${isClinic ? "Prontuário" : "Ficha"} excluído`);
      qc.invalidateQueries({ queryKey: ["client-records", salon?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
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
            <User size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Não conseguimos identificar o seu estabelecimento para gerenciar os clientes.
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
          <h1 className="font-display text-4xl text-gradient-gold">{t.clients}</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">{t.records} · {data?.length ?? 0} cadastros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="w-full sm:w-auto" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo {t.client.toLowerCase()}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display text-2xl">{editingClient ? "Editar" : "Novo"} {t.client.toLowerCase()}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="w-full" />
              </div>
              <div>
                <Label>{isClinic ? "Anamnese / observações clínicas" : "Observações"}</Label>
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={isClinic ? "Alergias, histórico, contraindicações…" : "Preferências, alergias…"}
                  className="resize-none"
                />
              </div>
              <Button variant="hero" className="w-full" onClick={() => editingClient ? updateMutation.mutate() : create.mutate()} disabled={create.isPending || updateMutation.isPending}>
                {create.isPending || updateMutation.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mb-6 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder={`Buscar ${t.client.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Card 
            key={r.id} 
            className="glass p-5 cursor-pointer hover:border-accent/40 transition-colors group"
            onClick={() => openDetails(r)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><User className="h-4 w-4 text-accent" /></div>
                <div className="flex-1">
                  <div className="font-semibold">{r.client_name}</div>
                  {r.client_phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{r.client_phone}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:bg-accent/10" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {r.birth_date && (
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(r.birth_date).toLocaleDateString("pt-BR")}</div>
            )}
            {r.notes && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{r.notes}</p>}
            <div className="mt-3 flex items-center gap-1 text-xs text-accent"><Camera className="h-3 w-3" />{Array.isArray(r.photos) ? r.photos.length : 0} fotos</div>
          </Card>
        ))}
        {!filtered.length && <p className="text-sm text-muted-foreground">Nenhum cadastro.</p>}
      </div>
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-md glass border-border/40 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <SheetHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div>
                <SheetTitle className="font-display text-2xl tracking-tight text-gradient-gold">
                  {selectedClient?.client_name}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  Cliente desde {selectedClient?.created_at ? new Date(selectedClient.created_at as string).toLocaleDateString("pt-BR") : "N/A"}
                </SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => { setDetailsOpen(false); openEdit(selectedClient!); }}>
                <Pencil className="w-3 h-3 mr-2" /> Editar {isClinic ? "Prontuário" : "Ficha"}
              </Button>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="bg-background/40 rounded-xl p-4 border border-white/5 space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Contato</h4>
              {selectedClient?.client_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-accent/70" />
                  <span>{selectedClient.client_phone as string}</span>
                </div>
              )}
              {selectedClient?.client_email && (
                <div className="flex items-center gap-3 text-sm">
                  <ExternalLink className="h-4 w-4 text-accent/70" />
                  <span className="truncate">{selectedClient.client_email as string}</span>
                </div>
              )}
              {selectedClient?.birth_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-accent/70" />
                  <span>Nasc: {new Date(selectedClient.birth_date as string).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
            </div>

            {selectedClient?.notes && (
              <div className="bg-background/40 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  {isClinic ? "Anotações Clínicas & Histórico" : "Anotações & Preferências"}
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {selectedClient.notes as string}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Histórico de Atendimentos</h4>
              {loadingAppointments ? (
                <div className="space-y-3">
                  <div className="h-16 w-full animate-pulse bg-accent/5 rounded-xl"></div>
                  <div className="h-16 w-full animate-pulse bg-accent/5 rounded-xl"></div>
                </div>
              ) : clientAppointments && clientAppointments.length > 0 ? (
                <div className="space-y-3">
                  {clientAppointments.map((appt) => (
                    <div key={appt.id} className="bg-background/40 rounded-xl p-3 border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          {new Date(appt.appointment_date).toLocaleDateString("pt-BR", { weekday: 'short', day: '2-digit', month: 'short' })}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${appt.status === 'completed' ? 'border-green-500/50 text-green-500 bg-green-500/10' : appt.status === 'cancelled' ? 'border-destructive/50 text-destructive bg-destructive/10' : 'border-accent/50 text-accent bg-accent/10'}`}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="text-foreground">{appt.service?.name}</span> com {appt.professional?.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-white/10 rounded-xl">
                  Nenhum atendimento registrado para este cliente.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  );
};

export default Clientes;
