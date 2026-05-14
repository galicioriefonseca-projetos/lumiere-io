import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useVertical } from "@/contexts/VerticalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Scissors, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { launchSchema, parseBRLNumber } from "@/lib/validators";

type Kind = "service" | "product";

export const LaunchModal = ({ trigger }: { trigger?: React.ReactNode }) => {
  const { salon, user } = usePermissions();
  const { t, isClinic } = useVertical();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("service");
  const [proId, setProId] = useState<string>("");
  const [catId, setCatId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [client, setClient] = useState("");

  const { data: pros } = useQuery({
    enabled: !!salon?.id && open,
    queryKey: ["pros-launch", salon?.id],
    queryFn: async () =>
      (await supabase.from("professionals").select("id,name").eq("salon_id", salon!.id).eq("active", true).order("name")).data ?? [],
  });

  const { data: cats } = useQuery({
    enabled: !!salon?.id && open,
    queryKey: ["cats-launch", salon?.id],
    queryFn: async () =>
      (await supabase.from("service_categories").select("id,name,icon").eq("salon_id", salon!.id).eq("active", true).order("name")).data ?? [],
  });

  const reset = () => { setDescription(""); setAmount(""); setClient(""); setProId(""); setCatId(""); setKind("service"); };

  const submit = useMutation({
    mutationFn: async () => {
      if (!salon?.id) throw new Error("Salão indisponível");
      const parsed = launchSchema.safeParse({
        kind,
        professional_id: proId,
        category_id: catId,
        amount: parseBRLNumber(amount),
        description,
        client_name: client,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      const v = parsed.data;
      const { error } = await supabase.from("achievements").insert({
        salon_id: salon.id,
        professional_id: v.professional_id,
        category_id: v.category_id || null,
        kind: v.kind,
        amount: v.amount,
        description: v.description,
        client_name: v.client_name ? v.client_name : null,
        created_by: user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento registrado");
      qc.invalidateQueries();
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!proId) {
      toast.error("Profissional inválido: Selecione um profissional para o lançamento.");
      return;
    }
    const parsedAmount = parseBRLNumber(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Valor inválido: Preencha o campo Valor com um número válido.");
      return;
    }
    submit.mutate();
  };

  const serviceLabel = isClinic ? "Procedimento" : "Serviço";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="hero">
            <Plus className="mr-2 h-4 w-4" /> Lançar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo lançamento</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setKind("service")}
            className={`rounded-lg border p-3 text-left transition ${kind === "service" ? "border-accent bg-accent/10" : "border-border/60 hover:border-accent/50"}`}
          >
            <Scissors className="mb-1 h-4 w-4 text-accent" />
            <div className="text-sm font-semibold">{serviceLabel}</div>
          </button>
          <button
            type="button"
            onClick={() => setKind("product")}
            className={`rounded-lg border p-3 text-left transition ${kind === "product" ? "border-accent bg-accent/10" : "border-border/60 hover:border-accent/50"}`}
          >
            <ShoppingBag className="mb-1 h-4 w-4 text-accent" />
            <div className="text-sm font-semibold">Produto</div>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label>{t.professional}</Label>
            <Select value={proId} onValueChange={setProId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(pros ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t.category} (opcional)</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
              <SelectContent>
                {(cats ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Valor (R$)</Label>
              <Input inputMode="decimal" placeholder="120,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>{t.client}</Label>
              <Input placeholder="Opcional" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input placeholder={kind === "service" ? (isClinic ? "Limpeza de pele" : "Corte + escova") : "Shampoo Premium"} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button variant="hero" className="w-full" disabled={submit.isPending} onClick={handleSave}>
            {submit.isPending ? "Lançando…" : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
