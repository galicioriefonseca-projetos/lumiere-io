import { supabase } from "@/integrations/supabase/client";

export interface AIInsightPayload {
  title: string;
  summary: string;
  body: {
    findings: {
      title: string;
      severity: "low" | "medium" | "high";
      recommendation: string;
    }[];
  };
}

export const geminiService = {
  async generateSalonInsight(salonId: string): Promise<AIInsightPayload> {
    const { data, error } = await supabase.functions.invoke("generate-insight", {
      body: { salon_id: salonId },
    });
    if (error) throw error;
    return data as AIInsightPayload;
  },

  async saveInsight(salonId: string, insight: AIInsightPayload) {
    const signature = `sha256:ai_${Math.random().toString(36).substring(2)}${Date.now().toString(16)}`;
    const { error } = await supabase.from("ai_insights").insert({
      salon_id: salonId,
      kind: "salon_overview",
      title: insight.title,
      summary: insight.summary,
      body: insight.body as unknown as Record<string, unknown>,
      model: "google/gemini-2.5-flash",
      digital_signature: signature,
    });
    if (error) throw error;
  },
};
