import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handle = async () => {
    const parsed = z.string().email("E-mail inválido").safeParse(email.trim());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-aurora opacity-50" />
      <Card className="glass shadow-elegant relative w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Sparkles className="h-3 w-3" /> Lumière.io
          </div>
          <h1 className="font-display text-4xl text-gradient-gold">Recuperar senha</h1>
        </div>

        {sent ? (
          <div className="text-center">
            <MailCheck className="mx-auto mb-3 h-12 w-12 text-accent" />
            <p className="text-sm text-muted-foreground">
              Se o e-mail estiver cadastrado, enviaremos um link para redefinir
              sua senha. Verifique também a pasta de spam.
            </p>
            <Button
              variant="hero"
              className="mt-6 w-full"
              onClick={() => navigate("/auth")}
            >
              Voltar para entrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Informe o e-mail cadastrado e enviaremos um link para você definir
              uma nova senha.
            </p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@salon.com"
              />
            </div>
            <Button variant="hero" className="w-full" disabled={busy} onClick={handle}>
              {busy ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
            <Link
              to="/auth"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-accent"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
