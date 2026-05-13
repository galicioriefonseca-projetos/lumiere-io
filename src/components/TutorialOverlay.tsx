import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Step = {
  title: string;
  body: string;
  cta?: { label: string; to?: string };
};

const baseSteps: Step[] = [
  {
    title: "Bem-vindo à Lumière.io ✨",
    body:
      "Sua plataforma de performance para salões e clínicas premium. Vamos te guiar pelos primeiros passos.",
  },
  {
    title: "Lançamentos rápidos",
    body:
      "Em 'Lançamentos' sua equipe registra serviços e produtos. Esses dados alimentam metas, comissões e Insights IA.",
    cta: { label: "Conhecer Lançamentos", to: "/lancamentos" },
  },
  {
    title: "Cadastre seu Gerente",
    body:
      "Vá em 'Profissionais' → 'Gerentes' para criar o acesso do seu gerente. Defina email e senha — ele entrará por essas credenciais.",
    cta: { label: "Ir para Profissionais", to: "/profissionais" },
  },
  {
    title: "Defina suas metas",
    body:
      "Em 'Metas' você define o faturamento mensal — distribuído automaticamente entre seus profissionais para gamificação.",
    cta: { label: "Definir Metas", to: "/metas" },
  },
  {
    title: "Tudo pronto!",
    body:
      "Explore Insights IA, Modo TV e o Painel de Avaliações. Boas vendas! 💎",
  },
];

/**
 * Tutorial guiado exibido apenas no primeiro acesso após aprovação.
 * Marca salons.tutorial_seen_at quando concluído.
 */
export const TutorialOverlay = () => {
  const { salon, isMasterAdmin, isOwner, isSalonActive } = usePermissions();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    enabled: !!salon?.id && !isMasterAdmin && isOwner && isSalonActive,
    queryKey: ["tutorial-flag", salon?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("salons")
        .select("tutorial_seen_at,onboarded_at")
        .eq("id", salon!.id)
        .maybeSingle();
      return data as { tutorial_seen_at: string | null; onboarded_at: string | null } | null;
    },
  });

  useEffect(() => {
    if (!data) return;
    if (!data.tutorial_seen_at && data.onboarded_at) setOpen(true);
  }, [data]);

  const markSeen = useMutation({
    mutationFn: async () => {
      if (!salon?.id) return;
      await supabase
        .from("salons")
        .update({ tutorial_seen_at: new Date().toISOString() } as never)
        .eq("id", salon.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutorial-flag"] });
      toast.success("Tutorial concluído. Bons negócios!");
    },
  });

  if (!open) return null;
  const current = baseSteps[step];
  const isLast = step === baseSteps.length - 1;

  const next = () => {
    if (isLast) {
      markSeen.mutate();
      setOpen(false);
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { markSeen.mutate(); setOpen(false); } }}>
      <DialogContent
        className="sm:max-w-lg overflow-hidden border-white/5 bg-[#0D0D0D]/95 backdrop-blur-xl shadow-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold opacity-50" />
        
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight text-gradient-gold">
            <Sparkles className="mr-3 inline h-5 w-5 text-accent" />
            {current.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6 mt-4 flex items-center gap-2">
          {baseSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "bg-white/5"}`}
            />
          ))}
        </div>

        <div className="relative p-6 bg-white/[0.02] border border-white/5 rounded-none min-h-[140px] flex items-center">
          <div className="absolute top-4 right-4 opacity-5">
            <Sparkles size={80} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground relative z-10 font-light">
            {current.body}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { markSeen.mutate(); setOpen(false); }}
            className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100"
          >
            Pular tour
          </Button>
          <div className="flex items-center gap-2">
            {current.cta && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-[10px] uppercase tracking-widest border-white/10 hover:bg-white/5"
                onClick={() => {
                  markSeen.mutate();
                  setOpen(false);
                  if (current.cta?.to) navigate(current.cta.to);
                }}
              >
                {current.cta.label}
              </Button>
            )}
            <Button 
              variant="hero" 
              size="sm" 
              onClick={next}
              className="rounded-none px-6 text-[10px] uppercase tracking-widest font-bold"
            >
              {isLast ? (
                <>Concluir <CheckCircle2 className="ml-2 h-3 w-3" /></>
              ) : (
                <>Próximo <ArrowRight className="ml-2 h-3 w-3" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
