import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { LaunchModal } from "@/components/LaunchModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useVertical } from "@/contexts/VerticalContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Target, Tv, Lock, CalendarPlus, BadgeDollarSign, UserPlus, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProfessionalHomeView } from "@/components/ProfessionalHomeView";
import { useCommandCenterData } from "@/hooks/useCommandCenterData";
import { RevenueCard, AverageTicketCard, ProfessionalsSummaryCard } from "@/components/dashboard/DashboardCards";
import { DailyEvolutionChart, QualityRevenueScatterCard, ProfessionalGoalChart } from "@/components/dashboard/DashboardCharts";
import { Skeleton } from "@/components/ui/skeleton";

const IndexInner = () => {
  const { profile, salon, plan, isMasterAdmin, isOwner, can, limits } = usePermissions();
  const { t } = useVertical();
  const greeting = profile?.display_name?.split(" ")[0] ?? "Bem-vindo";
  const { data, isLoading } = useCommandCenterData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            <Skeleton className="h-40 md:col-span-4" />
            <Skeleton className="h-40 md:col-span-2" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent-soft">
            <Sparkles className="h-3 w-3" /> Command Center · {t.brand}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl">
            Olá, <span className="text-gradient-gold">{greeting}</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground text-sm sm:text-base">{salon?.name ?? "Seu negócio"} — {t.greeting} em tempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
          {isMasterAdmin && <Badge variant="outline" className="border-accent text-accent"><Crown className="mr-1 h-3 w-3" /> Master Admin</Badge>}
          <Badge className={plan === "elite" ? "bg-gradient-gold text-accent-foreground" : "bg-secondary"}>Plano {plan === "elite" ? "Elite" : "Studio"}</Badge>
          <LaunchModal />
        </div>
      </header>

      <section id="dashboard-summary" className="grid grid-cols-1 gap-5 md:grid-cols-6 mb-8">
        <motion.div id="revenue-overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-4">
          <RevenueCard data={data} />
        </motion.div>
        <motion.div id="ticket-overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="md:col-span-2">
          <AverageTicketCard data={data} />
        </motion.div>
      </section>

      {/* Ações Rápidas e Atalhos */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="md:col-span-3">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 shadow-sm border-accent/20 hover:border-accent hover:bg-accent/5 justify-start px-6" 
              onClick={() => navigate('/agendamentos')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/10 text-accent">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-base">Novo Agendamento</span>
                  <span className="text-xs text-muted-foreground font-normal">Agendar cliente agora</span>
                </div>
              </div>
            </Button>
            
            {(isOwner || isMasterAdmin) && (
              <Button 
                variant="outline" 
                className="h-20 shadow-sm border-green-500/20 hover:border-green-500 hover:bg-green-500/5 justify-start px-6" 
                onClick={() => navigate('/lancamentos')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base whitespace-normal text-left">Registrar Venda/Gasto</span>
                    <span className="text-xs text-muted-foreground font-normal">Lançamento financeiro</span>
                  </div>
                </div>
              </Button>
            )}

            <Button 
              variant="outline" 
              className="h-20 shadow-sm border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/5 justify-start px-6" 
              onClick={() => navigate('/clientes')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-base">Novo Cliente</span>
                  <span className="text-xs text-muted-foreground font-normal">Cadastrar rapidamente</span>
                </div>
              </div>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-6">
        <motion.div id="pros-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 flex flex-col gap-5">
          <ProfessionalsSummaryCard count={data?.prosCount ?? 0} max={limits.maxProfessionals} />

          <Link to="/metas" className="flex-1 block group">
            <Card className="h-full glass shadow-elegant p-6 transition-all hover:bg-accent/5 hover:border-accent/40 relative overflow-hidden flex flex-col justify-center min-h-[120px]">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-accent/10 rounded-full blur-xl group-hover:bg-accent/20 transition-all"></div>
              <div className="relative z-10 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-lg font-semibold">Metas da Equipe</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-transform group-hover:translate-x-1" />
              </div>
              <p className="relative z-10 text-sm text-muted-foreground mt-1">Acompanhe e configure a meta de faturamento mensal.</p>
            </Card>
          </Link>
        </motion.div>

        <ProfessionalGoalChart data={data} />
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-6">
        <DailyEvolutionChart data={data?.series ?? []} />
        <QualityRevenueScatterCard data={data?.scatter ?? []} />
      </section>

      <footer className="mt-12 text-center text-xs text-muted-foreground pb-8">Lumière.io · v1.2</footer>
    </AppShell>
  );
};

const Index = () => {
  const { isProfessionalOnly, loading } = usePermissions();
  if (loading) return null;
  if (isProfessionalOnly) return <ProfessionalHomeView />;
  return <IndexInner />;
};

export default Index;
