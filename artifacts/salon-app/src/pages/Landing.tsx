import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Diamond, Target, Tv, Check, ChevronDown, LockKeyhole, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground font-sans selection:bg-accent/30 overflow-x-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xl font-display uppercase tracking-widest text-gradient-gold">
                   <Sparkles className="h-5 w-5 text-accent" />
                   Lumière.io
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/auth" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Login</Link>
                    <Button variant="hero" className="rounded-none text-[10px] uppercase tracking-widest h-10 px-6 font-bold" asChild>
                        <Link to="/auth">Garantir Meu Acesso VIP</Link>
                    </Button>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col justify-center items-center text-center">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 blur-[150px] rounded-full" />
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.4em] text-accent backdrop-blur-sm shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
                <Sparkles className="h-3 w-3 animate-pulse" /> Apenas 5 Vagas para Onboarding Exclusivo
            </motion.div>

            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-white max-w-5xl leading-[1.05]"
            >
                Sua equipe desmotivada está custando <span className="text-gradient-gold italic font-light">MUITO CARO</span>.
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 text-lg text-muted-foreground/80 max-w-2xl font-light leading-relaxed mx-auto"
            >
                Pare de deixar dinheiro na mesa. Enquanto seus concorrentes usam planilhas arcaicas, nossos clientes retomam o controle absoluto em menos de 7 dias com nosso sistema de Gamificação e Dashboard Executivo.
            </motion.p>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 flex flex-col sm:flex-row gap-6 justify-center relative z-10 w-full sm:w-auto"
            >
                <Button variant="hero" className="group rounded-none h-16 w-full sm:w-auto px-8 text-[11px] uppercase tracking-[0.2em] font-bold shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]" asChild>
                    <Link to="/auth">
                        Recuperar Controle Agora
                        <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-[10px] text-muted-foreground uppercase tracking-widest"
            >
              Cancele quando quiser · Sem fidelidade invisível
            </motion.p>
        </section>

        {/* Features / Value Prop */}
        <section className="py-24 px-6 bg-[#0D0D0D] border-y border-white/5 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="font-display text-4xl text-gradient-gold tracking-tight mb-4">A Anatomia da Excelência</h2>
                    <p className="text-muted-foreground font-light max-w-xl mx-auto">Por que gerenciar problemas quando você pode orquestrar resultados?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureBox 
                        icon={<Target className="h-8 w-8 text-accent" />}
                        title="Gamificação Aura"
                        description="Ative o gatilho da recompensa instantânea na sua equipe. Metas viram um jogo impossível de perder. Faturamento cresce no piloto automático."
                    />
                    <FeatureBox 
                        icon={<Tv className="h-8 w-8 text-accent" />}
                        title="Modo TV Executivo"
                        description="Exiba métricas elegantes e rankings na TV da sua sala ou recepção. Status elevado para o salão e clareza brutal para os profissionais."
                    />
                    <FeatureBox 
                        icon={<Diamond className="h-8 w-8 text-accent" />}
                        title="Comissões Cirúrgicas"
                        description="Chega de perder horas calculando quem fez o quê. Divisão automática, justa e livre de erros humanos que causam atritos."
                    />
                    <FeatureBox 
                        icon={<ShieldCheck className="h-8 w-8 text-accent" />}
                        title="Blindagem Total"
                        description="Dados de clientes e relatórios financeiros sob proteção de nível militar (Supabase RLS). Ninguém vê o que não deveria ver."
                    />
                </div>
            </div>
        </section>

        {/* Pricing */}
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <LockKeyhole className="h-4 w-4 text-accent" />
                        <span className="text-[10px] text-accent uppercase tracking-[0.3em] font-bold">Investimento Seguro</span>
                    </div>
                    <h2 className="font-display text-4xl lg:text-5xl text-gradient-gold tracking-tight mb-4">Quanto vale a sua paz de espírito?</h2>
                    <p className="text-muted-foreground font-light max-w-2xl mx-auto text-lg leading-relaxed">
                        Um único cliente retido pela equipe paga o sistema pelo ano inteiro. Você não está contratando software, está comprando <span className="font-medium text-foreground">liberdade</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Plano Studio */}
                    <div className="border border-white/10 bg-white/[0.01] p-10 flex flex-col justify-between hover:border-white/20 transition-all rounded-none relative">
                        <div>
                            <h3 className="text-2xl font-display text-foreground mb-2">Signature</h3>
                            <p className="text-sm text-muted-foreground/60 mb-6 font-light">Para estabelecimentos em ascensão que exigem organização infalível.</p>
                            <div className="mb-8 flex items-end gap-2">
                                <span className="text-sm text-muted-foreground mb-2">R$</span>
                                <span className="text-5xl font-display text-white">197</span>
                                <span className="text-sm text-muted-foreground mb-2">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-4 text-sm text-muted-foreground/90"><Check className="h-5 w-5 text-accent shrink-0" /> Gestão Completa de Agendamentos</li>
                                <li className="flex items-start gap-4 text-sm text-muted-foreground/90"><Check className="h-5 w-5 text-accent shrink-0" /> Financeiro e Divisão de Comissões</li>
                                <li className="flex items-start gap-4 text-sm text-muted-foreground/90"><Check className="h-5 w-5 text-accent shrink-0" /> Checklists de Qualidade (Limitado a 30/mês)</li>
                                <li className="flex items-start gap-4 text-sm text-muted-foreground/90"><Check className="h-5 w-5 text-accent shrink-0" /> Suporte em até 24h</li>
                            </ul>
                        </div>
                        <Button variant="outline" className="w-full rounded-none h-14 uppercase tracking-widest text-[11px] font-bold border-white/10" asChild>
                            <Link to="/auth">Começar com Signature</Link>
                        </Button>
                    </div>

                    {/* Plano Elite */}
                    <div className="border border-accent shadow-[0_0_30px_rgba(212,175,55,0.1)] bg-accent/5 p-10 flex flex-col justify-between relative rounded-none overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-accent text-[#0A0A0A] text-[9px] font-bold uppercase tracking-widest px-4 py-1">Mais Escolhido</div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
                        <div>
                            <h3 className="text-2xl font-display text-gradient-gold mb-2 flex items-center gap-2"><Diamond className="h-5 w-5" /> Elite</h3>
                            <p className="text-sm text-muted-foreground/80 mb-6 font-light">O arsenal completo para dominação de mercado e retenção de talentos.</p>
                            <div className="mb-8 flex items-end gap-2">
                                <span className="text-sm text-accent mb-2">R$</span>
                                <span className="text-5xl font-display text-white">297</span>
                                <span className="text-sm text-muted-foreground mb-2">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-4 text-sm text-foreground"><Check className="h-5 w-5 text-accent shrink-0" /> <span className="font-medium text-gradient-gold">Gamificação Aura Premium</span></li>
                                <li className="flex items-start gap-4 text-sm text-foreground"><Check className="h-5 w-5 text-accent shrink-0" /> <span className="font-medium text-gradient-gold">Modo TV para Recepção</span></li>
                                <li className="flex items-start gap-4 text-sm text-foreground"><Check className="h-5 w-5 text-accent shrink-0" /> Checklists de Qualidade Ilimitados</li>
                                <li className="flex items-start gap-4 text-sm text-foreground"><Check className="h-5 w-5 text-accent shrink-0" /> Inteligência e Insights Executivos</li>
                                <li className="flex items-start gap-4 text-sm text-foreground"><Check className="h-5 w-5 text-accent shrink-0" /> Suporte Prioritário VIP 1:1</li>
                            </ul>
                        </div>
                        <Button variant="hero" className="w-full rounded-none h-14 uppercase tracking-widest text-[11px] font-bold group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-shadow" asChild>
                            <Link to="/auth">Assinar Elite Agora</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-6 bg-[#0D0D0D] border-t border-white/5">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="font-display text-3xl md:text-4xl text-gradient-gold tracking-tight mb-4">Dúvidas Frequentes</h2>
                    <p className="text-muted-foreground font-light">Elimine todas as suas ressalvas antes de tomar a decisão que mudará seu negócio.</p>
                </div>
                
                <div className="space-y-2">
                    <FaqItem 
                      question="É muito difícil migrar de sistema?" 
                      answer="Zero. Nossa interface exige baixíssima carga cognitiva. É mais fácil que usar o Instagram. Além disso, criamos um Assistente de Onboarding (o 'Concierge') que configura quase tudo sozinho em 3 cliques." 
                    />
                    <FaqItem 
                      question="O que acontece se um funcionário sair?" 
                      answer="Nada de pânico. Com nosso controle absoluto, você o remove do painel com 1 clique e ele perde imediatamente todo acesso aos dados, clientes e agenda da plataforma." 
                    />
                    <FaqItem 
                      question="Posso acessar pelo celular?" 
                      answer="Com certeza. O Lumière foi criado 'Mobile First'. Você pode verificar o faturamento ou aprovar comissões deitado no sofá ou durante uma viagem para Paris." 
                    />
                    <FaqItem 
                      question="Tenho alguma multa se quiser cancelar?" 
                      answer="Absolutamente não. Acreditamos que você deve ficar porque o sistema te dá lucro, não porque está preso a um contrato abusivo. Cancele a qualquer momento com zero taxas extras." 
                    />
                </div>
            </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-32 px-6 text-center relative overflow-hidden bg-black">
            <div className="absolute inset-0 bg-gradient-to-t from-accent/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-gradient-gold tracking-tight mb-6 leading-tight">Chegou a hora de decidir.</h2>
            <p className="text-muted-foreground font-light max-w-xl mx-auto mb-10 leading-relaxed text-sm md:text-lg">
                Você pode fechar esta página e voltar para o mesmo caos de ontem, ou pode assumir seu lugar na vanguarda da gestão elegante e lucrativa.
            </p>
            <Button variant="hero" className="rounded-none h-16 px-12 text-[11px] uppercase tracking-[0.2em] font-bold shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)] transition-all" asChild>
                <Link to="/auth">Destravar Meu Acesso Vip</Link>
            </Button>
            <p className="mt-8 text-[10px] text-muted-foreground/60 uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" /> 100% de Satisfação ou Reembolso em 7 dias
            </p>
        </section>
        
        <footer className="py-12 border-t border-white/5 text-center bg-[#070707]">
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 text-gradient-gold uppercase tracking-[0.3em] font-bold text-xs">
                    <Sparkles className="h-4 w-4" /> Lumière.io
                </div>
                <div className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em] font-light italic">
                    Excellence in Management &copy; {new Date().getFullYear()}
                </div>
            </div>
        </footer>
    </div>
  )
}

function FeatureBox({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col gap-6 border border-white/5 bg-white/[0.01] p-10 hover:bg-white/[0.03] transition-colors relative group h-full">
            <div className="absolute inset-0 border border-accent/0 group-hover:border-accent/10 transition-colors" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 ease-out" />
            <div className="p-4 bg-accent/5 w-fit rounded-none border border-accent/10 group-hover:bg-accent/10 transition-colors">{icon}</div>
            <div>
                <h3 className="text-xl font-display text-foreground tracking-tight mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground/70 font-light leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
    const [open, setOpen] = useState(false);
    
    return (
        <div className="border border-white/5 bg-white/[0.01] rounded-none overflow-hidden transition-colors hover:border-white/10">
            <button 
                onClick={() => setOpen(!open)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 focus:outline-none"
            >
                <span className="text-base font-medium text-foreground/90">{question}</span>
                <ChevronDown className={cn("h-5 w-5 text-accent transition-transform duration-300", open && "rotate-180")} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-2 text-sm text-muted-foreground/80 font-light leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
