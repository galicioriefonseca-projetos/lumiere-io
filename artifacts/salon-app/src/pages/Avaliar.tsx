import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Sparkles, Heart, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { evaluationSchema } from "@/lib/validators";

const isUuid = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const Avaliar = () => {
  const { salonId, proId } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validParams = isUuid(salonId) && isUuid(proId);

  const { data: pro, isLoading } = useQuery({
    enabled: validParams,
    queryKey: ["pro-public", proId, salonId],
    queryFn: async () => {
      // RLS garante: só profissional ativo do salão correto retorna
      const { data } = await supabase
        .from("professionals")
        .select("name,role,salon_id,active")
        .eq("id", proId!)
        .eq("salon_id", salonId!)
        .eq("active", true)
        .maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    const parsed = evaluationSchema.safeParse({
      salon_id: salonId,
      professional_id: proId,
      rating,
      comment,
      client_name: name,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSubmitting(true);
    const v = parsed.data;
    const { error } = await supabase.from("evaluations").insert({
      salon_id: v.salon_id,
      professional_id: v.professional_id,
      rating: v.rating,
      comment: v.comment ? v.comment : null,
      client_name: v.client_name ? v.client_name : null,
    });
    setSubmitting(false);
    if (error) { toast.error("Não foi possível registrar. Verifique o link."); return; }
    setDone(true);
  };

  if (!validParams || (!isLoading && !pro)) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-5">
        <Card className="glass shadow-elegant w-full p-7 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-3 font-display text-2xl">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link de avaliação não está mais disponível ou foi adulterado.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-5">
      <Card className="glass shadow-elegant w-full p-7">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
          <Sparkles className="h-3 w-3" /> Sua opinião importa
        </div>
        <h1 className="font-display text-3xl">{done ? "Obrigado!" : `Como foi com ${pro?.name ?? "…"}?`}</h1>
        {!done && pro?.role && <p className="mt-1 text-sm text-muted-foreground">{pro.role}</p>}

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <Heart className="h-10 w-10 text-accent" />
            <p className="text-muted-foreground">Avaliação registrada com sucesso.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="transition hover:scale-110" aria-label={`Nota ${n}`}>
                  <Star className={`h-10 w-10 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <div>
              <Label>Comentário (opcional)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} placeholder="Conte sobre sua experiência…" />
            </div>
            <div>
              <Label>Seu nome (opcional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <Button variant="hero" className="w-full" disabled={submitting || rating === 0} onClick={submit}>
              {submitting ? "Enviando…" : "Enviar avaliação"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Avaliar;
