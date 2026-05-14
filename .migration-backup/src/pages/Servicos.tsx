import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { useVertical } from "@/contexts/VerticalContext";
import { useRealtime } from "@/hooks/useRealtime";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Trash2, Search, Edit } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Servicos() {
  const { salon, isProfessionalOnly, loading, isMasterAdmin } = usePermissions();

  const { t } = useVertical();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    duration: 60,
    price: 0,
    category_id: "",
  });

  const { data: categories } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["categories", salon?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("*")
        .eq("salon_id", salon!.id)
        .order("name");
      return data ?? [];
    },
  });

  const { data: services, isLoading } = useQuery({
    enabled: !!salon?.id,
    queryKey: ["services", salon?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*, service_categories(name)")
        .eq("salon_id", salon!.id)
        .order("name");
      return data ?? [];
    },
  });

  useRealtime("services", salon?.id, [
    { table: "services", invalidate: [["services", salon?.id]] },
  ]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [services, search]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name || form.duration <= 0 || form.price < 0) {
        throw new Error("Preencha os campos obrigatórios corretamente.");
      }

      if (editingId) {
        const { error } = await supabase
          .from("services")
          .update({
            name: form.name,
            duration: form.duration,
            price: form.price,
            category_id: form.category_id || null,
          } as never)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert({
          salon_id: salon!.id,
          name: form.name,
          duration: form.duration,
          price: form.price,
          category_id: form.category_id || null,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Serviço atualizado" : "Serviço criado");
      setOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Serviço removido"),
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
            <Scissors size={32} />
          </div>
          <h2 className="text-xl font-display text-muted-foreground uppercase tracking-widest">Salão não identificado</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Não conseguimos identificar o seu estabelecimento para gerenciar os serviços.
          </p>
          <Button variant="hero" className="mt-8 px-8" onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      </AppShell>
    );
  }

  const resetForm = () => {
    setForm({ name: "", duration: 60, price: 0, category_id: "" });
    setEditingId(null);
  };

  const openEdit = (service: Record<string, unknown>) => {
    setForm({
      name: service.name as string,
      duration: service.duration as number,
      price: service.price as number,
      category_id: (service.category_id as string) || "",
    });
    setEditingId(service.id);
    setOpen(true);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 p-6">
          <Skeleton className="h-20 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <Breadcrumbs />
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-light">Serviços</h1>
            <p className="text-muted-foreground mt-1">Configure os serviços e preços.</p>
          </div>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="hero">Adicionar Serviço</Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/40">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do serviço oferecido.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Serviço</Label>
                  <Input
                    placeholder="Ex: Corte Masculino"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duração (minutos)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Sem Categoria</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
        </header>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="glass p-5 hover:border-accent/40 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg leading-tight">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {service.service_categories?.name || "Geral"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => openEdit(service)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => remove.mutate(service.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="text-sm text-muted-foreground">
                  ⏱ {service.duration} min
                </div>
                <div className="font-semibold text-accent">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                </div>
              </div>
            </Card>
          ))}
          {filteredServices.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl glass">
              Nenhum serviço encontrado. Adicione seu primeiro serviço!
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
