// Lumière — Generate AI Insight (Elite/Master only)
// Uses Lovable AI Gateway (no API key needed). Signs payload with SHA-256.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    // Resolve salon + plan
    const { data: profile } = await supabase.from("profiles").select("salon_id").eq("id", user.id).maybeSingle();
    if (!profile?.salon_id) return new Response(JSON.stringify({ error: "no_salon" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const { data: salon } = await supabase.from("salons").select("plan,name").eq("id", profile.salon_id).maybeSingle();
    const isMaster = (user.email ?? "").toLowerCase() === "leandropfonseca20@gmail.com";
    if (!isMaster && salon?.plan !== "elite") {
      return new Response(JSON.stringify({ error: "plan_required", required: "elite" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Snapshot últimos 14 dias de runs
    const { data: runs } = await supabase
      .from("checklist_runs")
      .select("run_date, score, notes, professional_id")
      .eq("salon_id", profile.salon_id)
      .order("run_date", { ascending: false })
      .limit(50);

    const { data: pros } = await supabase
      .from("professionals")
      .select("id,name,role")
      .eq("salon_id", profile.salon_id);

    const context = { salon: salon?.name, runs: runs ?? [], professionals: pros ?? [] };

    // Lovable AI Gateway
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um auditor sênior de salões de beleza de luxo. Devolva JSON estrito com {title, summary, findings:[{title,severity,recommendation}]}. Severity ∈ low|medium|high. Português do Brasil. Tom executivo." },
          { role: "user", content: `Analise os dados de auditoria deste salão e gere um relatório executivo. Dados:\n${JSON.stringify(context).slice(0, 8000)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "credits_required" }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    if (!aiRes.ok) throw new Error(`AI error ${aiRes.status}`);

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const payload = {
      salon_id: profile.salon_id,
      kind: "audit_report",
      model: "google/gemini-2.5-flash",
      title: parsed.title ?? "Relatório de Auditoria",
      summary: parsed.summary ?? "",
      body: parsed,
      generated_at: new Date().toISOString(),
    };

    // Digital signature: SHA-256 do conteúdo canônico
    const signature = await sha256(JSON.stringify(payload));

    const { data: inserted, error: insErr } = await supabase.from("ai_insights").insert({
      salon_id: profile.salon_id,
      kind: payload.kind,
      title: payload.title,
      summary: payload.summary,
      body: payload.body,
      model: payload.model,
      digital_signature: signature,
      generated_by: user.id,
    }).select("*").maybeSingle();

    if (insErr) throw insErr;

    await supabase.from("audit_log").insert({
      salon_id: profile.salon_id, actor_id: user.id, action: "ai_insight_generated",
      meta: { insight_id: inserted?.id, signature },
    });

    return new Response(JSON.stringify({ insight: inserted }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
