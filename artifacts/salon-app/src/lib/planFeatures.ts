// Plano → feature flags. Mantém compat com nomes existentes em usePermissions.
export type PlanKey = "start" | "studio" | "performance" | "network" | "founder" | "elite";

export type PlanFeatures = {
  maxPros: number;
  categorias: boolean;
  comissoes: boolean;
  avaliacoes: boolean;
  gamificacao: boolean;
  insightsAI: boolean;
  modoTV: boolean;
  multiunidade: boolean;
  customBranding: boolean;
};

const STUDIO: PlanFeatures = {
  maxPros: 10,
  categorias: true,
  comissoes: false,
  avaliacoes: false,
  gamificacao: false,
  insightsAI: false,
  modoTV: false,
  multiunidade: false,
  customBranding: false,
};

const PERFORMANCE: PlanFeatures = {
  ...STUDIO,
  maxPros: 20,
  comissoes: true,
  avaliacoes: true,
  gamificacao: true,
  insightsAI: true,
  modoTV: true,
};

export const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  start: {
    maxPros: 3,
    categorias: false,
    comissoes: false,
    avaliacoes: false,
    gamificacao: false,
    insightsAI: false,
    modoTV: false,
    multiunidade: false,
    customBranding: false,
  },
  studio: STUDIO,
  performance: PERFORMANCE,
  network: {
    ...PERFORMANCE,
    maxPros: Number.POSITIVE_INFINITY,
    multiunidade: true,
    customBranding: true,
  },
  founder: { ...STUDIO },
  // Compat com salões existentes em "elite"
  elite: { ...PERFORMANCE, customBranding: true },
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  start: "Start",
  studio: "Studio",
  performance: "Performance",
  network: "Network",
  founder: "Founder",
  elite: "Elite",
};

export const PUBLIC_PLANS: Array<{
  key: Exclude<PlanKey, "founder" | "elite">;
  name: string;
  price: string;
  priceSuffix: string;
  tagline: string;
  highlights: string[];
  highlight?: boolean;
}> = [
  {
    key: "start",
    name: "Start",
    price: "197",
    priceSuffix: "/mês",
    tagline: "Para começar com organização e PWA instalável.",
    highlights: [
      "Até 3 profissionais",
      "Dashboard, Clientes, Serviços",
      "Agendamentos básicos",
      "Checklist diário",
      "Metas mensais",
    ],
  },
  {
    key: "studio",
    name: "Studio",
    price: "397",
    priceSuffix: "/mês",
    tagline: "Estúdios e clínicas em crescimento.",
    highlights: [
      "Até 10 profissionais",
      "Tudo do Start",
      "Categorias e histórico de checklist",
      "Metas por equipe",
      "Agendamentos completos",
    ],
    highlight: true,
  },
  {
    key: "performance",
    name: "Performance",
    price: "697",
    priceSuffix: "/mês",
    tagline: "Operações de alta performance com IA.",
    highlights: [
      "Até 20 profissionais",
      "Tudo do Studio",
      "Comissões e avaliações",
      "Gamificação Aura",
      "Insights com IA",
    ],
  },
  {
    key: "network",
    name: "Network",
    price: "1497",
    priceSuffix: "/mês a partir de",
    tagline: "Multiunidade e gestão de rede.",
    highlights: [
      "Profissionais ilimitados",
      "Tudo do Performance",
      "Multiunidade",
      "Painel master de rede",
      "Relatórios executivos",
    ],
  },
];

export function featuresForPlan(plan: string | null | undefined): PlanFeatures {
  const key = (plan ?? "start") as PlanKey;
  return PLAN_FEATURES[key] ?? PLAN_FEATURES.start;
}
