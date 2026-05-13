import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Receipt, TrendingUp, Users } from "lucide-react";
import { fmtBRL } from "@/lib/aura";
import { Link } from "react-router-dom";
import { CmdData } from "@/hooks/useCommandCenterData";

export const RevenueCard = ({ data }: { data?: CmdData }) => (
  <Card className="glass shadow-elegant relative overflow-hidden p-7 md:col-span-4">
    <div className="absolute inset-0 bg-gradient-royal opacity-25" />
    <div className="relative">
      <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-accent-soft">
        <Receipt className="h-3 w-3" aria-hidden="true" /> Faturamento do mês
      </div>
      <div className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-gradient-gold break-words">
        {fmtBRL(data?.revenue ?? 0)}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Meta · {fmtBRL(data?.target ?? 0)}</span>
          <span className="text-accent">{(data?.pct ?? 0).toFixed(1)}%</span>
        </div>
        <Progress value={Math.min(100, data?.pct ?? 0)} className="mt-2 h-2" />
      </div>
    </div>
  </Card>
);

export const AverageTicketCard = ({ data }: { data?: CmdData }) => (
  <Card className="glass shadow-elegant h-full p-6 md:col-span-2">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Ticket médio</div>
      <TrendingUp className="h-4 w-4 text-accent" />
    </div>
    <div className="mt-3 font-display text-4xl">{fmtBRL(data?.avg ?? 0)}</div>
    <div className="mt-1 text-sm text-muted-foreground">{data?.count ?? 0} atendimentos</div>
  </Card>
);

export const ProfessionalsSummaryCard = ({ count, max }: { count: number; max: number | typeof Infinity }) => (
  <Card className="glass shadow-elegant h-full p-6 md:col-span-2">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Equipe</div>
      <Users className="h-4 w-4 text-accent" />
    </div>
    <div className="mt-3 font-display text-4xl">{count} <span className="text-base text-muted-foreground">/ {max === Infinity ? "∞" : max}</span></div>
    <Link to="/profissionais" className="mt-2 inline-block text-sm text-accent-soft hover:text-accent">Gerenciar →</Link>
  </Card>
);
