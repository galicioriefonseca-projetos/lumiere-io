import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const UpgradeGate = ({ feature }: { feature: string }) => (
  <Card className="glass shadow-elegant relative overflow-hidden p-10 text-center">
    <div className="absolute inset-0 bg-gradient-royal opacity-30" />
    <div className="relative mx-auto max-w-md">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
        <Crown className="h-6 w-6 text-accent-foreground" />
      </div>
      <h2 className="font-display text-3xl text-gradient-gold">{feature}</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Disponível no plano <strong className="text-accent-soft">Elite</strong>. Desbloqueie auditoria contínua,
        Modo TV ao vivo, insights de IA com assinatura digital e branding personalizado.
      </p>
      <Button variant="hero" className="mt-6">
        <Sparkles className="mr-2 h-4 w-4" /> Fazer Upgrade
      </Button>
    </div>
  </Card>
);
