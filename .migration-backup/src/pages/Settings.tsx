import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { usePermissions } from "@/hooks/usePermissions";
import { UpgradeGate } from "@/components/UpgradeGate";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Crown } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { salon, can, isMasterAdmin } = usePermissions();
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("#1a2a52");
  const [accent, setAccent] = useState("#d4af37");
  const [logo, setLogo] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!salon) return;
    setName(salon.name);
    setPrimary(salon.brand_primary_color ?? "#1a2a52");
    setAccent(salon.brand_accent_color ?? "#d4af37");
    setLogo(salon.logo_url ?? "");
    setEnabled(salon.has_custom_branding);
  }, [salon]);

  const save = async () => {
    if (!salon) return;
    setSaving(true);
    const { error } = await supabase.from("salons").update({
      name, brand_primary_color: primary, brand_accent_color: accent,
      logo_url: logo || null, has_custom_branding: enabled,
    }).eq("id", salon.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  };

  const eliteFeatureAvailable = can.useCustomBranding || isMasterAdmin;

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Palette className="h-3 w-3" /> Branding DLC
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Configurações</h1>
        </div>
      </header>

      <Card className="glass shadow-elegant p-6 max-w-2xl">
        <div className="space-y-5">
          <div>
            <Label>Nome do salão</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {!eliteFeatureAvailable ? (
            <UpgradeGate feature="Branding personalizado" />
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 p-4">
                <div>
                  <div className="font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-accent" /> Branding personalizado</div>
                  <div className="text-xs text-muted-foreground">Quando desligado, o tema padrão Deep Blue & Gold é aplicado.</div>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cor primária</Label>
                  <div className="flex gap-2"><Input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-16 p-1" /><Input value={primary} onChange={(e) => setPrimary(e.target.value)} /></div>
                </div>
                <div>
                  <Label>Cor de destaque</Label>
                  <div className="flex gap-2"><Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-16 p-1" /><Input value={accent} onChange={(e) => setAccent(e.target.value)} /></div>
                </div>
              </div>

              <div>
                <Label>URL do logo</Label>
                <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          <Button variant="hero" className="w-full" onClick={save} disabled={saving}>Salvar</Button>
        </div>
      </Card>

      <Card className="glass shadow-elegant p-6 max-w-2xl mt-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <h2 className="font-display text-2xl">App Desktop & Mobile</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Você pode instalar este sistema como um aplicativo no seu celular ou computador para acesso rápido e melhor performance.
          </p>
          <div className="bg-secondary/40 rounded-xl p-4 border border-border/60">
            <div className="text-sm font-medium mb-1">Como instalar:</div>
            <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
              <li><strong>Android:</strong> Clique no botão "Instalar" que aparece na parte inferior da tela ou no menu do Chrome "Instalar aplicativo".</li>
              <li><strong>iPhone (iOS):</strong> Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta pra cima) e escolha <strong>Adicionar à Tela de Início</strong>.</li>
              <li><strong>Computador:</strong> Clique no ícone de instalação na barra de endereços do Chrome/Edge.</li>
            </ul>
          </div>
        </div>
      </Card>
    </AppShell>
  );
};

export default Settings;
