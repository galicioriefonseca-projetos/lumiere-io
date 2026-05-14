import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtime } from "@/hooks/useRealtime";
import { monthRange } from "@/lib/aura";

export type CmdData = {
  revenue: number; count: number; avg: number; target: number; pct: number;
  series: { d: string; v: number }[];
  scatter: { name: string; quality: number; revenue: number }[];
  prosCount: number;
  _proNames: Record<string, string>;
  _proRev: Record<string, number>;
  _proQ: Record<string, { sum: number; n: number }>;
  _days: Record<string, number>;
};

const buildScatter = (
  proNames: Record<string, string>,
  proRev: Record<string, number>,
  proQ: Record<string, { sum: number; n: number }>,
) =>
  Object.keys(proNames)
    .map((id) => {
      const q = proQ[id];
      return {
        name: proNames[id],
        quality: q ? Number((q.sum / q.n).toFixed(2)) : 0,
        revenue: Math.round(proRev[id] ?? 0),
      };
    })
    .filter((d) => d.revenue > 0 || d.quality > 0);

const buildSeries = (days: Record<string, number>) =>
  Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ d: d.slice(8) + "/" + d.slice(5, 7), v: Math.round(v) }));

export const useCommandCenterData = () => {
  const { salon } = usePermissions();
  const qc = useQueryClient();
  const { start, end, year, month } = monthRange();
  const queryKey = ["cmd-center", salon?.id, start];

  const query = useQuery<CmdData>({
    enabled: !!salon?.id,
    queryKey,
    queryFn: async () => {
      const [pros, ach, goal, evals] = await Promise.all([
        supabase.from("professionals").select("id,name").eq("salon_id", salon!.id).eq("active", true),
        supabase.from("achievements").select("amount,occurred_at,professional_id").eq("salon_id", salon!.id).gte("occurred_at", start).lt("occurred_at", end),
        supabase.from("salon_goals").select("target_revenue").eq("salon_id", salon!.id).eq("year", year).eq("month", month).maybeSingle(),
        supabase.from("evaluations").select("rating,professional_id,created_at").eq("salon_id", salon!.id).gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
      ]);
      const proNames: Record<string, string> = {};
      (pros.data ?? []).forEach((p) => { proNames[p.id] = p.name; });
      const revenue = (ach.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const count = ach.data?.length ?? 0;
      const avg = count ? revenue / count : 0;
      const target = Number(goal.data?.target_revenue ?? 0);
      const pct = target ? (revenue / target) * 100 : 0;

      const days: Record<string, number> = {};
      (ach.data ?? []).forEach((r) => {
        const d = new Date(r.occurred_at).toISOString().slice(0, 10);
        days[d] = (days[d] ?? 0) + Number(r.amount);
      });

      const proRev: Record<string, number> = {};
      (ach.data ?? []).forEach((r) => { proRev[r.professional_id] = (proRev[r.professional_id] ?? 0) + Number(r.amount); });
      const proQ: Record<string, { sum: number; n: number }> = {};
      (evals.data ?? []).forEach((r) => {
        const cur = proQ[r.professional_id] ?? { sum: 0, n: 0 };
        cur.sum += r.rating; cur.n += 1; proQ[r.professional_id] = cur;
      });

      return {
        revenue, count, avg, target, pct,
        series: buildSeries(days),
        scatter: buildScatter(proNames, proRev, proQ),
        prosCount: pros.data?.length ?? 0,
        _proNames: proNames, _proRev: proRev, _proQ: proQ, _days: days,
      };
    },
  });

  useRealtime("cmd", salon?.id, [
    {
      table: "achievements",
      event: "INSERT",
      onChange: (payload) => {
        const row = payload.new as unknown as { amount: number | string; occurred_at: string; professional_id: string };
        const occurred = row.occurred_at;
        if (occurred < start || occurred >= end) return;
        const amount = Number(row.amount);
        qc.setQueryData<CmdData>(queryKey, (prev) => {
          if (!prev) return prev;
          const _proRev = { ...prev._proRev, [row.professional_id]: (prev._proRev[row.professional_id] ?? 0) + amount };
          const dKey = new Date(occurred).toISOString().slice(0, 10);
          const _days = { ...prev._days, [dKey]: (prev._days[dKey] ?? 0) + amount };
          const revenue = prev.revenue + amount;
          const count = prev.count + 1;
          return {
            ...prev,
            revenue,
            count,
            avg: count ? revenue / count : 0,
            pct: prev.target ? (revenue / prev.target) * 100 : 0,
            _proRev,
            _days,
            series: buildSeries(_days),
            scatter: buildScatter(prev._proNames, _proRev, prev._proQ),
          };
        });
      },
    },
    {
      table: "evaluations",
      event: "INSERT",
      onChange: (payload) => {
        const row = payload.new as unknown as { rating: number; professional_id: string };
        qc.setQueryData<CmdData>(queryKey, (prev) => {
          if (!prev) return prev;
          const cur = prev._proQ[row.professional_id] ?? { sum: 0, n: 0 };
          const _proQ = { ...prev._proQ, [row.professional_id]: { sum: cur.sum + row.rating, n: cur.n + 1 } };
          return { ...prev, _proQ, scatter: buildScatter(prev._proNames, prev._proRev, _proQ) };
        });
      },
    },
    { table: "salon_goals", invalidate: [queryKey] },
  ]);

  return query;
};
