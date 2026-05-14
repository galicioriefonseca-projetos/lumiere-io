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
import { Plus, Trash2, Tag, Search } from "lucide-react";
import { toast } from "sonner";
import { categorySchema } from "@/lib/validators";
import { Skeleton } from "@/components/ui/skeleton";

const Categorias = () => {
  const { salon } = usePermissions();
  const { t } = useVertical();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#D4AF37");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
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

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    return data.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  useRealtime("categories", salon?.id, [
    { table: "service_categories", invalidate: [["categories", salon?.id]] },
  ]);

  const create = useMutation({
    mutationFn: async () => {
      const parsed = categorySchema.safeParse({ name, icon, color });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("service_categories").insert({
        salon_id: salon!.id,
        name: parsed.data.name,
        icon: parsed.data.icon || null,
        color: parsed.data.color || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria criada");
      setName(""); setIcon(""); setColor("#D4AF37");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Removida"),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-gradient-gold">{t.categories}</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Organize seus {t.services.toLowerCase()}.</p>
        </div>
      </header>

      <Card className="glass mb-6 p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_140px_auto]">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Coloração" />
          </div>
          <div>
            <Label>Ícone (emoji)</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🎨" />
          </div>
          <div>
            <Label>Cor</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="hero" onClick={() => create.mutate()} disabled={create.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar categorias..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((c) => (
          <Card key={c.id} className="glass flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ background: `${c.color ?? "#D4AF37"}22`, color: c.color ?? "#D4AF37" }}
            >
              {c.icon ?? <Tag className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.active ? "Ativa" : "Inativa"}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </Card>
        ))}
        {filteredCategories.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
        )}
      </div>
    </AppShell>
  );
};

export default Categorias;
