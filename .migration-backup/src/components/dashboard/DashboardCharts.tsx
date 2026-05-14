import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ScatterChart, Scatter, CartesianGrid, BarChart, Bar, Cell, LabelList } from "recharts";
import { fmtBRL } from "@/lib/aura";
import { CmdData } from "@/hooks/useCommandCenterData";
import { Receipt, Star, Target, Trophy } from "lucide-react";

export const ProfessionalGoalChart = ({ data }: { data?: CmdData }) => {
  if (!data) return null;

  const proData = Object.keys(data._proNames).map((id) => {
    const name = data._proNames[id].split(" ")[0]; // First name
    const revenue = data._proRev[id] ?? 0;
    const targetShare = data.prosCount > 0 ? (data.target / data.prosCount) : 0;
    const pct = targetShare > 0 ? (revenue / targetShare) * 100 : 0;
    return { name, revenue, targetShare, pct: Number(pct.toFixed(1)) };
  }).sort((a, b) => b.pct - a.pct);

  const top3 = proData.slice(0, 3);
  
  return (
    <Card className="glass shadow-elegant md:col-span-4 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Target className="h-4 w-4 text-accent" /> Progresso de Metas da Equipe
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={proData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number, n: string) => [n === "pct" ? `${v}%` : fmtBRL(v), undefined]}
                cursor={{ fill: "hsl(var(--accent)/0.05)" }}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]} name="% Atingido">
                {proData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pct >= 100 ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
            <Trophy className="h-3.5 w-3.5 text-accent" /> Top 3 Destaques
          </h3>
          {top3.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg border-border/50">
              Nenhuma meta definida ou atingida.
            </div>
          ) : (
            top3.map((pro, index) => (
              <div key={pro.name} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs
                  ${index === 0 ? 'bg-gradient-gold text-yellow-900 border border-yellow-500/50' : 
                    index === 1 ? 'bg-slate-200 text-slate-800 border border-slate-300' : 
                    'bg-[#ca8a04]/20 text-[#ca8a04] border border-[#ca8a04]/50'}`}
                >
                  {index + 1}º
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{pro.name}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtBRL(pro.revenue)} ({pro.pct}%)</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export const DailyEvolutionChart = ({ data }: { data: CmdData['series'] }) => (
  <Card className="glass shadow-elegant md:col-span-3 p-6">
    <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Evolução diária · faturamento</div>
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
          <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

export const QualityRevenueScatterCard = ({ data }: { data: CmdData['scatter'] }) => (
  <Card className="glass shadow-elegant md:col-span-3 p-6">
    <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
      <Star className="h-3 w-3" /> Excelência: Qualidade × Faturamento
    </div>
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="hsl(var(--border))" />
          <XAxis type="number" dataKey="quality" name="Qualidade" domain={[0, 5]} stroke="hsl(var(--muted-foreground))" fontSize={11} label={{ value: "Qualidade", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis type="number" dataKey="revenue" name="Faturamento" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number, n: string) => n === "Faturamento" ? fmtBRL(v) : v} />
          <Scatter data={data} fill="hsl(var(--accent))" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </Card>
);
