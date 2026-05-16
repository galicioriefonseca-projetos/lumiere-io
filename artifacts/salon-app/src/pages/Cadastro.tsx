import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PUBLIC_PLANS, PLAN_LABELS, type PlanKey } from "@/lib/planFeatures";
import { maskPhoneBR } from "@/lib/validators";

const VALID_PLANS: PlanKey[] = ["start", "studio", "performance", "network", "founder"];

const BUSINESS_TYPES = [
  { value: "salon", label: "Salão" },
  { value: "clinic", label: "Clínica estética" },
  { value: "barber", label: "Barbearia" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Outro" },
];

export default function Cadastro() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const rawPlan = (params.get("plan") || "start").toLowerCase();
  const plan: PlanKey = (VALID_PLANS.includes(rawPlan as PlanKey) ? rawPlan : "start") as PlanKey;
  const founderCode = params.get("code") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [businessType, setBusinessType] = useState("salon");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [proCount, setProCount] = useState("");
  const [busy, setBusy] = useState(false);
  const [founderValid, setFounderValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (plan !== "founder") return;
    if (!founderCode) { setFounderValid(false); return; }
    supabase.rpc("validate_founder_code", { _code: founderCode }).then(({ data }) => {
      setFounderValid(!!data);
    });
  }, [plan, founderCode]);

  const planLabel = useMemo(() => PLAN_LABELS[plan], [plan]);
  const founderBlocked = plan === "founder" && founderValid === false;

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password || !salonName || !city || !state) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (password.length < 8) {
      toast.error("Senha precisa de pelo menos 8 caracteres.");
      return;
    }
    if (founderBlocked) {
      toast.error("Código Founder inválido.");
      return;
    }
    setBusy(true);
    try {
      const supaBusinessType = businessType === "clinic" ? "clinic" : "salon";
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding/equipe`,
          data: {
            full_name: fullName.trim(),
            owner_name: fullName.trim(),
            salon_name: salonName.trim(),
            phone: phone.trim(),
            business_type: supaBusinessType,
            business_type_label: businessType,
            city: city.trim(),
            state: state.trim(),
            professional_count_estimate: proCount,
            plan,
            ...(plan === "founder" ? { founder_code: founderCode } : {}),
          },
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("Este e-mail já está cadastrado. Faça login.");
        }
        throw error;
      }
      toast.success(`Bem-vindo ao Lumière · ${planLabel}!`);
      navigate("/onboarding/equipe", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no cadastro.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground">
      <nav className="border-b border-white/5 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gradient-gold font-display uppercase tracking-widest text-sm">
            <Sparkles className="h-4 w-4 text-accent" /> Lumière.io
          </Link>
          <Link to="/auth" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">Já tenho conta</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-accent">
            Plano {planLabel}{plan === "founder" && founderValid && " · código aceito"}
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gradient-gold tracking-tight">Crie sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">7 dias de avaliação · cancele quando quiser · sem cartão.</p>
          {plan === "founder" && (
            <p className="mt-2 text-xs text-accent/80">
              Founder: R$297/mês por 90 dias, depois migra automaticamente para Studio.
            </p>
          )}
          {founderBlocked && (
            <p className="mt-2 text-xs text-destructive">Código Founder inválido. Use um plano público.</p>
          )}
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Nome do responsável *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" /></Field>
            <Field label="E-mail *"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" /></Field>
            <Field label="WhatsApp *"><Input value={phone} onChange={(e) => setPhone(maskPhoneBR(e.target.value))} placeholder="(11) 90000-0000" /></Field>
            <Field label="Senha (mín. 8) *">
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Nome do salão / clínica *" className="md:col-span-2"><Input value={salonName} onChange={(e) => setSalonName(e.target.value)} placeholder="Ex: Studio Lumière" /></Field>
            <Field label="Tipo de negócio *">
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantidade de profissionais *">
              <Input type="number" min={1} value={proCount} onChange={(e) => setProCount(e.target.value)} placeholder="Ex: 5" />
            </Field>
            <Field label="Cidade *"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" /></Field>
            <Field label="Estado *"><Input maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="SP" /></Field>
          </div>

          <Button type="submit" variant="hero" size="lg" disabled={busy || founderBlocked} className="w-full rounded-none h-14 uppercase tracking-[0.3em] text-[11px] font-bold">
            {busy ? "Criando conta…" : <>Criar conta no plano {planLabel} <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Outros planos:{" "}
            {PUBLIC_PLANS.filter(p => p.key !== plan).map((p, i, arr) => (
              <span key={p.key}>
                <Link to={`/cadastro?plan=${p.key}`} className="text-accent hover:underline">{p.name}</Link>
                {i < arr.length - 1 && " · "}
              </span>
            ))}
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className ?? ""}>
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
