import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay, addMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useVertical } from "@/contexts/VerticalContext";
import { useRealtime } from "@/hooks/useRealtime";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, Edit, Trash2, UserCircle2, Scissors, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Agendamentos() {
  const { salon, loading, isMasterAdmin } = usePermissions();
  const { t } = useVertical();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_id: "",
    professional_id: "",
    service_id: "",
    time: "10:00",
    notes: "",
  });

  const { data: clients } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["clients", salon?.id],
    queryFn: async () => {
      const { data } = await supabase.from("client_records").select("id, client_name").eq("salon_id", salon!.id).order("client_name");
      return data || [];
    }
  });

  const { data: professionals } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["professionals", salon?.id],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("id, name").eq("salon_id", salon!.id).eq("active", true).order("name");
      return data || [];
    }
  });

  const { data: services } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["services", salon?.id],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name, duration, price").eq("salon_id", salon!.id).eq("is_active", true).order("name");
      return data || [];
    }
  });

  const { data: appointments, isLoading } = useQuery({
    enabled: !!salon?.id && !!date,
    queryKey: ["appointments", salon?.id, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          client:client_records(client_name),
          professional:professionals(name),
          service:services(name, duration, price)
        `)
        .eq("salon_id", salon!.id)
        .gte("appointment_date", start)
        .lte("appointment_date", end)
        .order("appointment_date");
      return data || [];
    }
  });

  useRealtime("appointments", salon?.id, [
    { table: "appointments", invalidate: [["appointments", salon?.id]] }
  ]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.client_id || !form.professional_id || !form.service_id || !form.time) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const service = services?.find(s => s.id === form.service_id);
      if (!service) throw new Error("Serviço não encontrado");

      const [hours, minutes] = form.time.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(startDate, service.duration);

      const payload = {
        salon_id: salon!.id,
        client_id: form.client_id,
        professional_id: form.professional_id,
        service_id: form.service_id,
        appointment_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        notes: form.notes,
      };

      if (editingId) {
        const { error } = await supabase
          .from("appointments")
          .update(payload as never)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Agendamento atualizado" : "Agendamento criado");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["appointments", salon?.id] });
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento removido");
      queryClient.invalidateQueries({ queryKey: ["appointments", salon?.id] });
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from("appointments").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["appointments", salon?.id] });
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const resetForm = () => {
    setForm({
      client_id: "",
      professional_id: "",
      service_id: "",
      time: "10:00",
      notes: "",
    });
    setEditingId(null);
  };

  const openEdit = (appt: Record<string, unknown>) => {
    setForm({
      client_id: (appt.client_id as string) || "",
      professional_id: (appt.professional_id as string) || "",
      service_id: (appt.service_id as string) || "",
      time: format(parseISO(appt.appointment_date as string), "HH:mm"),
      notes: (appt.notes as string) || "",
    });
    setEditingId(appt.id as string);
    setOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-primary border-primary/50 bg-primary/10';
      case 'completed': return 'text-green-500 border-green-500/50 bg-green-500/10';
      case 'cancelled': return 'text-destructive border-destructive/50 bg-destructive/10';
      default: return 'text-muted-foreground border-border bg-accent/5';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
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
            <CalendarIcon size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Não conseguimos identificar o seu estabelecimento para gerenciar a agenda.
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
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <Breadcrumbs />
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-light">Agendamentos</h1>
            <p className="text-muted-foreground mt-1">Gerencie a agenda diária.</p>
          </div>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal border-border/40", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="hero">Novo Agendamento</Button>
              </DialogTrigger>
              <DialogContent className="glass border-border/40 sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.client_id}
                      onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                    >
                      <option value="">Selecione o Cliente</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>{c.client_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.professionals}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.professional_id}
                      onChange={(e) => setForm({ ...form, professional_id: e.target.value })}
                    >
                      <option value="">Selecione o Profissional</option>
                      {professionals?.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Serviço</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.service_id}
                      onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                    >
                      <option value="">Selecione o Serviço</option>
                      {services?.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Input
                      placeholder="Alguma nota especial?"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Linha do tempo visual (decorativa) */}
            <div className="absolute left-[80px] top-4 bottom-4 w-px bg-border/40 hidden md:block" />
            
            {appointments?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl glass">
                Nenhum agendamento para este dia.
              </div>
            ) : (
              appointments?.map((appt) => (
                <Card key={appt.id} className="relative glass p-4 hover:border-accent/40 transition-colors ml-0 md:pl-[100px] overflow-hidden">
                  {/* Time label on desktop */}
                  <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-[80px] items-start justify-center pt-5 border-r border-border/20">
                    <div className="font-mono text-lg font-medium text-accent">
                      {format(parseISO(appt.appointment_date), "HH:mm")}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 md:hidden">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="font-mono font-medium">{format(parseISO(appt.appointment_date), "HH:mm")} - {format(parseISO(appt.end_date), "HH:mm")}</span>
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg flex items-center gap-2">
                            {appt.client?.client_name || "Cliente excluído"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <UserCircle2 className="w-4 h-4" />
                              {appt.professional?.name || "Profissional excluído"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Scissors className="w-4 h-4" />
                              {appt.service?.name || "Serviço excluído"}
                            </div>
                            {appt.service && (
                              <div className="flex items-center gap-1.5 hidden sm:flex">
                                <Clock className="w-4 h-4" />
                                {appt.service.duration} min
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={cn("px-3 py-1 rounded-full text-xs font-medium border", getStatusColor(appt.status))}>
                          {getStatusText(appt.status)}
                        </div>
                      </div>
                      
                      {appt.notes && (
                        <div className="mt-3 text-sm text-muted-foreground bg-accent/5 p-2 rounded-md border border-white/5">
                          {appt.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10" 
                            onClick={() => updateStatus.mutate({ id: appt.id, status: 'completed' })}
                            title="Marcar como Concluído"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                            onClick={() => updateStatus.mutate({ id: appt.id, status: 'cancelled' })}
                            title="Cancelar Agendamento"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => openEdit(appt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => remove.mutate(appt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

