import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { credSchema, passwordStrength } from "@/lib/validators";

/**
 * Página acessada pelo link enviado no e-mail de recuperação.
 * O Supabase já loga o usuário com um token de "recovery" — basta
 * chamar updateUser({ password }).
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    const parsed = credSchema
      .pick({ password: true })
      .safeParse({ password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada com sucesso!");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const strength = passwordStrength(password);
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-accent"];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-aurora opacity-50" />
      <Card className="glass shadow-elegant relative w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Sparkles className="h-3 w-3" /> Lumière.io
          </div>
          <h1 className="font-display text-4xl text-gradient-gold">Nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Defina uma senha forte para sua conta.
          </p>
        </div>

        {!hasSession ? (
          <p className="text-center text-sm text-muted-foreground">
            Validando link de recuperação…
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres com letra e número"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Mostrar senha"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < strength.score ? strengthColors[strength.score] : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Força: {strength.label}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
            <Button variant="hero" className="w-full" disabled={busy} onClick={submit}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {busy ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
