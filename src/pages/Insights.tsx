import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { UpgradeGate } from "@/components/UpgradeGate";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { geminiService } from "@/services/geminiService";

const Insights = () => {
  const { can, salon } = usePermissions();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    enabled: !!salon?.id && can.useAIInsights,
    queryKey: ["insights", salon?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_insights").select("*").eq("salon_id", salon!.id).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!can.useAIInsights) {
    return <AppShell><UpgradeGate feature="Insights de IA" /></AppShell>;
  }

  const generate = async () => {
    if (!salon?.id) return;
    setBusy(true);
    try {
      const insight = await geminiService.generateSalonInsight(salon.id);
      await geminiService.saveInsight(salon.id, insight);
      toast.success("Relatório gerado e assinado via Gemini AI");
      qc.invalidateQueries({ queryKey: ["insights"] });
    } catch (e) {
      console.error("AI Generation Error:", e);
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Sparkles className="h-3 w-3" /> Inteligência Artificial
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">Insights</h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Relatórios executivos com assinatura digital SHA-256.</p>
        </div>
        <Button variant="hero" className="w-full sm:w-auto" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gerar relatório
        </Button>
      </header>

      <div className="space-y-5">
        {(data ?? []).length === 0 && (
          <Card className="glass p-10 text-center text-muted-foreground">Nenhum relatório ainda. Gere o primeiro.</Card>
        )}
        {data?.map((ins) => {
          const findings = (ins.body as { findings?: { title: string; severity: string; recommendation: string }[] })?.findings ?? [];
          return (
            <Card key={ins.id} className="glass shadow-elegant p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-3xl">{ins.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{ins.summary}</p>
                </div>
                <Badge variant="outline" className="border-accent text-accent shrink-0">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Assinado
                </Badge>
              </div>
              {findings.length > 0 && (
                <ul className="mt-5 space-y-3">
                  {findings.map((f, i) => (
                    <li key={i} className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{f.title}</div>
                        <Badge className={f.severity === "high" ? "bg-destructive" : f.severity === "medium" ? "bg-accent text-accent-foreground" : "bg-secondary"}>
                          {f.severity}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{f.recommendation}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{new Date(ins.created_at).toLocaleString("pt-BR")} · {ins.model}</span>
                <code className="truncate font-mono text-[10px] text-accent-soft" title={ins.digital_signature}>
                  sig: {ins.digital_signature.slice(0, 24)}…
                </code>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
};

export default Insights;
