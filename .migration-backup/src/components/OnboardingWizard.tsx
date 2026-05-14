import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Scissors, Stethoscope, Check } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { verticalDict, BusinessType } from "@/lib/vertical";
import { fmtBRL } from "@/lib/aura";

/**
 * Onboarding obrigatório:
 *  Step 0: Nome do dono + Nome do estabelecimento + Tipo (salon/clinic) — REQUIRED
 *  Step 1: Categorias preset
 *  Step 2: Meta mensal
 *  Step 3: Equipe demo (opcional)
 *
 * Modal não-fechável enquanto onboarded_at IS NULL e o salão estiver ativo.
 */
export const OnboardingWizard = () => {
  const { salon, needsOnboarding, isSalonActive } = usePermissions();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<BusinessType>("salon");
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [target, setTarget] = useState("80000");
  const [pros, setPros] = useState<{ name: string; role: string }[]>([
    { name: "", role: "" },
    { name: "", role: "" },
    { name: "", role: "" },
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const dict = verticalDict(type);

  useEffect(() => {
    if (dict.presetCategories.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories(dict.presetCategories.map(c => c.name));
    }
  }, [dict.presetCategories, selectedCategories.length]);

  useEffect(() => {
    if (!salon) return;
    if (needsOnboarding && isSalonActive) {
      setSalonName(salon.name);
      setOwnerName(salon.owner_name ?? "");
      if ((salon.business_type as BusinessType) === "clinic") setType("clinic");
      // Se já preencheu dono+nome no /setup, pula direto para categorias.
      const hasIdentity = !!salon.owner_name && !!salon.name && salon.name !== "Meu Salão";
      setStep(hasIdentity ? 1 : 0);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [salon, needsOnboarding, isSalonActive]);

  const finish = useMutation({
    mutationFn: async () => {
      if (!salon?.id) throw new Error("Salão indisponível");
      if (!ownerName.trim()) throw new Error("Informe o nome do dono");
      if (!salonName.trim()) throw new Error("Informe o nome do estabelecimento");
      const targetNum = Math.max(0, Number(target.replace(/\D/g, "")) || 0);
      const now = new Date();

      const { error: e1 } = await supabase
        .from("salons")
        .update({
          name: salonName.trim(),
          owner_name: ownerName.trim(),
          business_type: type,
          onboarded_at: new Date().toISOString(),
        } as never)
        .eq("id", salon.id);
      if (e1) throw e1;

      const cats = dict.presetCategories
        .filter(c => selectedCategories.includes(c.name))
        .map((c) => ({
          salon_id: salon.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
        }));
      
      if (cats.length > 0) {
        const { error: e2 } = await supabase.from("service_categories").insert(cats as never);
        if (e2) throw e2;
      }

      const { error: e3 } = await supabase.from("salon_goals").upsert(
        {
          salon_id: salon.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          target_revenue: targetNum,
        } as never,
        { onConflict: "salon_id,year,month" } as never,
      );
      if (e3) throw e3;

      const proRows = pros
        .filter((p) => p.name.trim().length > 1)
        .map((p) => ({ salon_id: salon.id, name: p.name.trim(), role: p.role.trim() || null }));
      if (proRows.length) {
        const { error: e4 } = await supabase.from("professionals").insert(proRows as never);
        if (e4) throw e4;
      }
    },
    onSuccess: () => {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#FFFFFF", "#B0399A"]
      });
      toast.success("Tudo pronto! Bem-vindo à Lumière.io ✨");
      qc.invalidateQueries();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const next = () => {
    if (step === 0) {
      if (!ownerName.trim()) return toast.error("Informe o nome do dono");
      if (!salonName.trim()) return toast.error("Informe o nome do estabelecimento");
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* não-fechável */ }}>
      <DialogContent
        className="sm:max-w-lg overflow-hidden border-white/5 bg-[#0D0D0D]/95 backdrop-blur-xl shadow-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold opacity-50" />
        
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight text-gradient-gold">
            <Sparkles className="mr-3 inline h-5 w-5 text-accent animate-pulse" />
            Configuração Inicial
          </DialogTitle>
        </DialogHeader>

        <div className="mb-8 mt-2 flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "bg-white/5"}`}
            />
          ))}
        </div>

        <div className="min-h-[300px] flex flex-col justify-center">
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-foreground">Identidade do Negócio</h3>
                <p className="text-sm text-muted-foreground">Conte-nos sobre você e seu estabelecimento.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Seu Nome</Label>
                  <Input 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)} 
                    placeholder="Ex: Alexandre Dumas" 
                    className="bg-white/5 border-white/10 focus-visible:border-accent focus-visible:ring-0 rounded-none h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome do Estabelecimento</Label>
                  <Input 
                    value={salonName} 
                    onChange={(e) => setSalonName(e.target.value)} 
                    placeholder="Ex: Maison de Beauté" 
                    className="bg-white/5 border-white/10 focus-visible:border-accent focus-visible:ring-0 rounded-none h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Vertical de Atuação</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("salon")}
                      className={`group relative flex flex-col items-center justify-center rounded-none border p-6 transition-all duration-300 ${type === "salon" ? "border-accent bg-accent/5" : "border-white/5 bg-white/[0.02] hover:border-white/20"}`}
                    >
                      <Scissors className={`mb-3 h-6 w-6 transition-colors ${type === "salon" ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <div className={`text-xs font-bold uppercase tracking-widest ${type === "salon" ? "text-accent" : "text-muted-foreground"}`}>Salão</div>
                      {type === "salon" && <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-accent animate-ping" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("clinic")}
                      className={`group relative flex flex-col items-center justify-center rounded-none border p-6 transition-all duration-300 ${type === "clinic" ? "border-accent bg-accent/5" : "border-white/5 bg-white/[0.02] hover:border-white/20"}`}
                    >
                      <Stethoscope className={`mb-3 h-6 w-6 transition-colors ${type === "clinic" ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <div className={`text-xs font-bold uppercase tracking-widest ${type === "clinic" ? "text-accent" : "text-muted-foreground"}`}>Estética</div>
                      {type === "clinic" && <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-accent animate-ping" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-foreground">Menu de {dict.categories}</h3>
                <p className="text-sm text-muted-foreground">Selecione as áreas que seu time atende.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {dict.presetCategories.map((c) => {
                  const isSelected = selectedCategories.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleCategory(c.name)}
                      className={`flex items-center gap-3 rounded-none border p-3 text-left transition-all ${isSelected ? "border-accent bg-accent/5 ring-1 ring-accent/20" : "border-white/5 bg-white/[0.02] opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:border-white/20"}`}
                    >
                      <span className="text-xl">{c.icon}</span>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{c.name}</div>
                        <div className="text-[9px] text-muted-foreground font-light">{isSelected ? "Incluído" : "Omitir"}</div>
                      </div>
                      {isSelected && <Check className="ml-auto h-3 w-3 text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-foreground">Objetivo de Faturamento</h3>
                <p className="text-sm text-muted-foreground">Qual o faturamento bruto ideal para seu negócio?</p>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl font-light">R$</span>
                  <Input
                    inputMode="numeric"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="pl-12 bg-white/5 border-white/10 focus-visible:border-accent focus-visible:ring-0 rounded-none h-16 text-2xl font-light tracking-tight"
                    placeholder="80.000"
                  />
                </div>
                <div className="p-4 bg-accent/5 border border-accent/10 rounded-none">
                  <div className="text-[10px] uppercase tracking-widest text-accent mb-1 font-bold">Resumo Aura</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Com faturamento de <span className="text-foreground font-medium">{fmtBRL(Number(target.replace(/\D/g, "")) || 0)}</span>, 
                    o sistema irá orquestrar a gamificação do seu time automaticamente.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-foreground">Equipe Inicial</h3>
                <p className="text-sm text-muted-foreground">Cadastre até 3 profissionais para liberar a agenda.</p>
              </div>
              <div className="space-y-3">
                {pros.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-[2]">
                      <Input
                        placeholder="Nome do Pro"
                        value={p.name}
                        onChange={(e) => setPros(pros.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                        className="bg-white/5 border-white/10 focus-visible:border-accent focus-visible:ring-0 rounded-none h-11 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder={type === "clinic" ? "Especialidade" : "Função"}
                        value={p.role}
                        onChange={(e) => setPros(pros.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                        className="bg-white/5 border-white/10 focus-visible:border-accent focus-visible:ring-0 rounded-none h-11 text-xs"
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center mt-4">
                  Os profissionais poderão baixar o app e acessar com login próprio futuramente.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={back} 
            disabled={step === 0}
            className="text-[10px] uppercase tracking-[0.2em] opacity-40 hover:opacity-100 disabled:opacity-0"
          >
            Voltar
          </Button>
          <div className="flex gap-3">
            {step < 3 ? (
              <Button 
                variant="hero" 
                onClick={next}
                className="px-10 h-11 rounded-none text-[10px] uppercase tracking-[0.3em] font-bold"
              >
                Próximo Passo
              </Button>
            ) : (
              <Button 
                variant="hero" 
                onClick={() => finish.mutate()} 
                disabled={finish.isPending}
                className="px-10 h-11 rounded-none text-[10px] uppercase tracking-[0.3em] font-bold"
              >
                {finish.isPending ? "Finalizando..." : "Iniciar Software ✨"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
