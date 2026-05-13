import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Crown,
  Trophy,
} from "lucide-react";
import { credSchema, passwordStrength, maskPhoneBR } from "@/lib/validators";

type Mode = "signup" | "signin";
type SignupStep = 1 | 2;

const benefits = [
  { icon: Crown, title: "Performance de elite", desc: "Dashboards em tempo real para sua equipe brilhar." },
  { icon: Trophy, title: "Gamificação inteligente", desc: "Conquistas e metas que viram resultado todo mês." },
  { icon: Zap, title: "Insights com IA", desc: "Recomendações automáticas para crescer com método." },
  { icon: ShieldCheck, title: "Seguro por padrão", desc: "Criptografia de ponta e curadoria humana de acesso." },
];

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<SignupStep>(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState<"salon" | "clinic">("salon");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  // Anti-bot CAPTCHA (math challenge)
  const [captcha, setCaptcha] = useState(() => ({
    a: Math.floor(Math.random() * 9) + 1,
    b: Math.floor(Math.random() * 9) + 1,
  }));
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const captchaValid = parseInt(captchaAnswer, 10) === captcha.a + captcha.b;
  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthColors = ["bg-white/5", "bg-destructive/40", "bg-amber-500/40", "bg-accent/40", "bg-emerald-500/40"];
  const strengthLabels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Excelente"];

  const refreshCaptcha = () => {
    setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
    setCaptchaAnswer("");
  };

  useEffect(() => {
    if (!loading && user) {
      const from = (loc.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, loc.state]);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const handleNext = () => {
    if (!emailValid) {
      toast.error("Informe um e-mail válido para continuar.");
      return;
    }
    if (!fullName.trim() || !salonName.trim()) {
      toast.error("Informe seu nome e o nome do seu salão.");
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const parsed = credSchema.safeParse({ email: normalizedEmail, password });
    
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!accept) {
      toast.error("Você precisa aceitar os termos para continuar.");
      return;
    }
    if (!captchaValid) {
      toast.error("Resolva a verificação anti-robô para continuar.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Informe seu telefone para contato.");
      return;
    }

    setBusy(true);
    try {
      const redirectUrl = `${window.location.origin}/setup`.replace(/\/+$/, '/setup');
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: parsed.data.password,
        options: { 
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            salon_name: salonName.trim(),
            owner_name: fullName.trim(),
            phone: phone.trim(),
            business_type: businessType,
          }
        },
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("Este e-mail já está em nossa base exclusiva. Tente fazer login.");
        }
        throw error;
      }
      
      toast.success("Acesso concedido! Bem-vindo ao Lumière.");
      navigate("/setup", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na solicitação de acesso.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const parsed = credSchema.safeParse({ email: normalizedEmail, password });
    
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: parsed.data.password,
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Credenciais inválidas. Verifique seu e-mail e senha.");
        }
        throw error;
      }
      toast.success(`Bem-vindo de volta!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] selection:bg-accent/30">
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[70%] w-[70%] rounded-full bg-accent/[0.03] blur-[150px]" />
        <div className="absolute -right-[5%] bottom-[0%] h-[60%] w-[60%] rounded-full bg-primary/[0.08] blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {/* SIDE: brand & benefits */}
        <aside className="hidden flex-col justify-between border-r border-white/[0.03] p-16 lg:flex lg:w-[45%]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="mb-12 inline-flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none border border-accent/30 bg-accent/5 backdrop-blur-xl">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-accent-soft">
                  Lumière
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground/60">
                  Concierge Excellence
                </span>
              </div>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[5.2rem] leading-[0.9] tracking-tighter">
              A maestria<br /> 
              <span className="italic text-accent/40 font-light">da sua </span><br />
              <span className="text-gradient-gold">operação.</span>
            </h1>
            <p className="mt-6 font-display italic text-accent/60 text-lg">
              Visualize o agora, projete o futuro, brilhe como Lumière.
            </p>                
            <p className="mt-10 max-w-sm text-lg font-light leading-relaxed text-muted-foreground/80">
              Gestão de precisão para estúdios e clínicas de alto padrão que transformam o cotidiano em arte.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8">
            {benefits.map((b, i) => (
              <motion.div 
                key={b.title} 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 + (i * 0.15), ease: "easeOut" }}
                className="group flex items-start gap-6"
              >
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-none border border-white/10 text-muted-foreground/40 transition-all duration-500 group-hover:border-accent group-hover:text-accent group-hover:bg-accent/5">
                  <b.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground/70 group-hover:text-accent transition-colors">{b.title}</div>
                  <div className="mt-1.5 text-xs font-light leading-relaxed text-muted-foreground/60">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-5 pt-16 text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40">
            <span className="h-[1px] w-12 bg-white/5" />
            Curadoria Digital Exclusiva
          </div>
        </aside>

        {/* MAIN: form */}
        <main className="flex w-full flex-1 items-center justify-center p-6 sm:p-12 lg:w-[55%]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full max-w-[440px]"
          >
            <div className="glass shadow-[0_0_80px_-20px_rgba(202,176,112,0.15)] relative overflow-hidden rounded-none border border-white/[0.04] p-6 sm:p-14">
              <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode + (mode === "signup" ? step : "")}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                >
                  <div className="mb-8 sm:mb-12">
                    <h2 className="font-display text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                      {mode === "signup" ? (step === 1 ? "Solicite Acesso Lumière" : "Segurança e Tipo") : "Entrar no Ecossistema"}
                    </h2>
                    <p className="mt-3 text-sm font-light text-muted-foreground/70">
                      {mode === "signup"
                        ? (step === 1 ? "Dê o primeiro passo rumo à excelência na sua operação." : "Defina suas credenciais e detalhes do negócio.")
                        : "Sua conta é a chave para a gestão de alto padrão."}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  {mode === "signup" && (
                    <div className="mb-12 flex gap-2">
                      {[1, 2].map((s) => (
                        <div key={s} className="relative h-[1px] flex-1 overflow-hidden bg-white/5">
                          {step >= s && (
                            <motion.div 
                              layoutId="progress"
                              className="absolute inset-0 bg-accent"
                              transition={{ duration: 0.6, ease: "easeInOut" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SIGN IN */}
                  {mode === "signin" && (
                    <div className="space-y-8">
                      <div className="group space-y-2">
                        <Label htmlFor="si-email" className="text-xs uppercase tracking-wide text-muted-foreground group-focus-within:text-accent transition-colors duration-300">
                          E-mail Corporativo
                        </Label>
                        <div className="relative">
                          <Input
                            id="si-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemplo@estudio.com"
                            className={cn(
                              "border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-12 text-sm tracking-wide transition-all focus-visible:border-accent focus-visible:ring-0 placeholder:text-white/20",
                              email.length > 0 && !emailValid && "border-destructive/50"
                            )}
                          />
                        </div>
                      </div>
                      <div className="group space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="si-pw" className="text-xs uppercase tracking-wide text-muted-foreground group-focus-within:text-accent transition-colors duration-300">Senha de Acesso</Label>
                          <Link to="/forgot-password" title="Recuperar acesso" className="text-xs uppercase tracking-wide text-accent/70 hover:text-accent transition-colors">
                            Esqueci
                          </Link>
                        </div>
                        <div className="relative">
                          <Input
                            id="si-pw"
                            type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-12 text-sm tracking-widest transition-all focus-visible:border-accent focus-visible:ring-0 pr-10 placeholder:text-white/20"
                            onKeyDown={(e) => e.key === "Enter" && handleSignin()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          variant="hero" 
                          className="w-full h-14 rounded-none uppercase tracking-[0.4em] text-[10px] shadow-lg shadow-accent/5" 
                          disabled={busy} 
                          onClick={handleSignin}
                        >
                          {busy ? "Autenticando..." : "Acessar Sistema"}
                        </Button>
                      </div>

                      <div className="pt-8 text-center">
                        <button
                          type="button"
                          onClick={() => { setMode("signup"); setStep(1); }}
                          className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/50 hover:text-accent transition-all duration-300"
                        >
                          Não possui convite? <span className="text-accent/60">Solicitar agora</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SIGN UP - STEP 1 */}
                  {mode === "signup" && step === 1 && (
                    <div className="space-y-6">
                      <div className="group space-y-2">
                        <Label htmlFor="su-name" className="text-[10px] uppercase tracking-widest text-muted-foreground group-focus-within:text-accent duration-300">Seu Nome Completo</Label>
                        <Input
                          id="su-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Como deseja ser chamado"
                          className="border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-11 text-sm tracking-wide transition-all focus-visible:border-accent focus-visible:ring-0 placeholder:text-white/10"
                        />
                      </div>

                      <div className="group space-y-2">
                        <Label htmlFor="su-salon" className="text-[10px] uppercase tracking-widest text-muted-foreground group-focus-within:text-accent duration-300">Nome do seu Salão / Estúdio</Label>
                        <Input
                          id="su-salon"
                          type="text"
                          value={salonName}
                          onChange={(e) => setSalonName(e.target.value)}
                          placeholder="Ex: Studio Lumière"
                          className="border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-11 text-sm tracking-wide transition-all focus-visible:border-accent focus-visible:ring-0 placeholder:text-white/10"
                        />
                      </div>

                      <div className="group space-y-2">
                        <Label htmlFor="su-email" className="text-[10px] uppercase tracking-widest text-muted-foreground group-focus-within:text-accent duration-300">E-mail de Acesso</Label>
                        <Input
                          id="su-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="voce@exemplo.com"
                          className={cn(
                            "border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-11 text-sm tracking-wide transition-all focus-visible:border-accent focus-visible:ring-0 placeholder:text-white/10",
                            email.length > 0 && !emailValid && "border-destructive/50"
                          )}
                          onKeyDown={(e) => e.key === "Enter" && handleNext()}
                        />
                      </div>

                      <Button
                        variant="hero"
                        className="w-full h-14 rounded-none uppercase tracking-widest text-xs group"
                        disabled={!emailValid || !fullName.trim() || !salonName.trim()}
                        onClick={handleNext}
                      >
                        Próximo Passo <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>

                      <div className="pt-6 text-center border-t border-white/[0.05]">
                        <button
                          type="button"
                          onClick={() => setMode("signin")}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground/70 hover:text-accent transition-colors"
                        >
                          Já possui credencial de acesso
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SIGN UP - STEP 2 */}
                  {mode === "signup" && step === 2 && (
                    <div className="space-y-6">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground/80 hover:text-accent transition-colors mb-2"
                      >
                        <ArrowLeft className="h-3 w-3" /> Voltar
                      </button>

                      <div className="group space-y-2">
                        <Label htmlFor="su-pw" className="text-[10px] uppercase tracking-widest text-muted-foreground group-focus-within:text-accent duration-300">Escolha uma Senha</Label>
                        <div className="relative">
                          <Input
                            id="su-pw"
                            type={showPw ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-11 text-sm tracking-widest transition-all focus-visible:border-accent focus-visible:ring-0 pr-10 placeholder:text-white/10"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {password.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <div className="flex gap-1.5">
                              {[0, 1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "h-[1px] flex-1 transition-all duration-700",
                                    i < strength.score ? strengthColors[strength.score] : "bg-white/5"
                                  )}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
                              <span className={cn("transition-colors duration-500", strength.score > 0 ? "text-foreground/60" : "text-muted-foreground/30")}>
                                Força: <span className={cn("font-bold", strength.score >= 3 ? "text-accent" : "text-foreground/80")}>{strengthLabels[strength.score]}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="group space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground group-focus-within:text-accent">Telefone / WhatsApp</Label>
                          <Input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
                            placeholder="(00) 00000-0000"
                            className="border-0 border-b border-white/20 bg-transparent px-0 rounded-none h-11 text-sm tracking-wide focus-visible:border-accent focus-visible:ring-0"
                          />
                        </div>
                        <div className="group space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo de Negócio</Label>
                          <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value as "salon" | "clinic")}
                            className="w-full border-0 border-b border-white/20 bg-transparent px-0 h-11 text-sm tracking-wide focus:ring-0 focus:border-accent text-foreground"
                          >
                            <option value="salon" className="bg-[#0A0A0A]">Salão de Beleza</option>
                            <option value="clinic" className="bg-[#0A0A0A]">Clínica de Estética</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4 border border-white/5 bg-white/[0.01] p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.4em] text-muted-foreground/40">
                          <span>Verificação: {captcha.a} + {captcha.b}</span>
                          <button type="button" onClick={refreshCaptcha} className="hover:text-accent transition-colors">Novo</button>
                        </div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value.replace(/[^0-9-]/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                          placeholder="Resultado"
                          className="h-10 border-0 border-b border-white/10 bg-transparent px-0 text-sm tracking-widest focus-visible:border-accent focus-visible:ring-0 placeholder:text-white/10"
                        />
                      </div>

                      <label className="flex items-start gap-3 text-[9px] uppercase tracking-[0.2em] leading-relaxed text-muted-foreground/50 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={accept}
                          onChange={(e) => setAccept(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 border-white/10 bg-transparent text-accent rounded-none focus:ring-0 cursor-pointer"
                        />
                        <span className="group-hover:text-muted-foreground/80 transition-colors">
                          Li e aceito os <a href="#" className="text-accent/60">Termos</a> e <a href="#" className="text-accent/60">Privacidade</a>
                        </span>
                      </label>

                      <Button
                        variant="hero"
                        className="w-full h-14 rounded-none uppercase tracking-[0.4em] text-[10px]"
                        disabled={busy || !captchaValid || !phone.trim() || !password}
                        onClick={handleSignup}
                      >
                        {busy ? "Processando..." : "Finalizar Cadastro Lumière"}
                      </Button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="mt-16 text-center text-[8px] uppercase tracking-[0.6em] text-muted-foreground/20">
              © {new Date().getFullYear()} Lumière Concierge · Excellence in Digital Strategy
            </footer>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Auth;
