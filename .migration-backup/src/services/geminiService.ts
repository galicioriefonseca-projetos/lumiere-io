
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/integrations/supabase/client";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Configuração de IA pendente (GEMINI_API_KEY ausente).");
    }

    // 1. Gather context data
    const [{ data: professionals }, { data: evals }, { data: goals }] = await Promise.all([
      supabase.from("professionals").select("*").eq("salon_id", salonId),
      supabase.from("evaluations").select("*").eq("salon_id", salonId).limit(20).order("created_at", { ascending: false }),
      supabase.from("salon_goals").select("*").eq("salon_id", salonId).eq("active", true),
    ]);

    const context = {
      prosCount: professionals?.length || 0,
      activePros: professionals?.filter(p => p.active).length || 0,
      recentEvaluations: evals?.map(e => ({ score: e.score, category: e.category, feedback: e.feedback })) || [],
      activeGoals: goals?.map(g => ({ title: g.title, target: g.target_value, current: g.current_value })) || [],
    };

    // 2. Query Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um consultor de elite para salões de beleza. Analise os seguintes dados e gere um relatório de insights estratégicos.
      
      DADOS DO SALÃO:
      - Profissionais: ${context.activePros} ativos de ${context.prosCount} total.
      - Avaliações recentes: ${JSON.stringify(context.recentEvaluations)}
      - Metas ativas: ${JSON.stringify(context.activeGoals)}
      
      Gere um objeto JSON com:
      - title: Título impactante do relatório.
      - summary: Resumo executivo curto.
      - findings: Lista de 3 achados com title, severity (low, medium, high) e recommendation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                  recommendation: { type: Type.STRING }
                },
                required: ["title", "severity", "recommendation"]
              }
            }
          },
          required: ["title", "summary", "findings"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result as AIInsightPayload;
  },

  async saveInsight(salonId: string, insight: AIInsightPayload) {
    // Simulate digital signature (SHA-256 placeholder)
    const signature = `sha256:ai_${Math.random().toString(36).substring(2)}${Date.now().toString(16)}`;
    
    const { error } = await supabase.from("ai_insights").insert({
      salon_id: salonId,
      title: insight.title,
      summary: insight.summary,
      body: insight.body,
      model: "gemini-3-flash-preview",
      digital_signature: signature
    });

    if (error) throw error;
  }
};
