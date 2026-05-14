import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, User, Mail, Lock, Briefcase } from "lucide-react";

const Convite = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setBusy(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      if (authData.user) {
        // 2. Create professional record
        const { error: profError } = await supabase.from("professionals").insert({
          salon_id: salonId,
          name: name,
          role: role,
          user_id: authData.user.id
        });
        if (profError) throw profError;
        
        toast.success("Cadastro realizado com sucesso!");
        navigate("/");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-lg border border-accent/20 p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-display text-gradient-gold">Convite Lumière</h1>
        </div>
        <p className="mb-6 text-center text-sm text-muted-foreground">Preencha seus dados para completar seu cadastro no salão.</p>
        
        <div className="space-y-4">
            <div>
                <Label>Nome Completo</Label>
                <div className="relative"><User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" /></div>
            </div>
            <div>
                <Label>Função</Label>
                <div className="relative"><Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={role} onChange={(e) => setRole(e.target.value)} className="pl-9" placeholder="Cabeleireiro…" /></div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {["Recepção", "Cabeleireiro(a)", "Manicure", "Esteticista", "Barbeiro(a)"].map((r) => (
                    <Badge key={r} variant="outline" className="cursor-pointer hover:bg-accent/10" onClick={() => setRole(r)}>
                      {r}
                    </Badge>
                  ))}
                </div>
            </div>
            <div>
                <Label>E-mail</Label>
                <div className="relative"><Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" /></div>
            </div>
            <div>
                <Label>Senha</Label>
                <div className="relative"><Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" /></div>
            </div>

            <Button variant="hero" className="w-full mt-4" onClick={handleRegister} disabled={busy}>
                {busy ? "Cadastrando..." : "Finalizar Cadastro"}
            </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Convite;
