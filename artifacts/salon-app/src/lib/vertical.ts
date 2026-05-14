// Dicionário de termos por vertical de negócio
export type BusinessType = "salon" | "clinic";

export type VerticalDict = {
  brand: string;
  professional: string;
  professionals: string;
  professionalShort: string;
  service: string;
  services: string;
  client: string;
  clients: string;
  appointment: string;
  appointments: string;
  category: string;
  categories: string;
  records: string;
  recordsShort: string;
  greeting: string;
  // categorias preset
  presetCategories: { name: string; icon: string; color: string }[];
};

const SALON: VerticalDict = {
  brand: "Lumière.io",
  professional: "Profissional",
  professionals: "Profissionais",
  professionalShort: "Pro",
  service: "Serviço",
  services: "Serviços",
  client: "Cliente",
  clients: "Clientes",
  appointment: "Atendimento",
  appointments: "Atendimentos",
  category: "Categoria",
  categories: "Categorias",
  records: "Fichas de Cliente",
  recordsShort: "Fichas",
  greeting: "Excelência em performance",
  presetCategories: [
    { name: "Corte", icon: "✂️", color: "#D4AF37" },
    { name: "Coloração", icon: "🎨", color: "#B0399A" },
    { name: "Manicure & Pedicure", icon: "💅", color: "#E29DBE" },
    { name: "Tratamento Capilar", icon: "💆", color: "#7BC4B6" },
    { name: "Maquiagem", icon: "💄", color: "#C2185B" },
    { name: "Penteado / Noivas", icon: "👰", color: "#9F86C0" },
    { name: "Produtos", icon: "🛍️", color: "#5B8DEF" },
  ],
};

const CLINIC: VerticalDict = {
  brand: "Lumière.io Clinic",
  professional: "Especialista",
  professionals: "Especialistas",
  professionalShort: "Espec.",
  service: "Procedimento",
  services: "Procedimentos",
  client: "Paciente",
  clients: "Pacientes",
  appointment: "Atendimento",
  appointments: "Atendimentos",
  category: "Categoria",
  categories: "Categorias",
  records: "Prontuários",
  recordsShort: "Prontuários",
  greeting: "Excelência em estética",
  presetCategories: [
    { name: "Limpeza de Pele", icon: "🧖", color: "#7BC4B6" },
    { name: "Toxina Botulínica", icon: "💉", color: "#5B8DEF" },
    { name: "Preenchimento", icon: "💎", color: "#B0399A" },
    { name: "Drenagem Linfática", icon: "🌊", color: "#9F86C0" },
    { name: "Peeling", icon: "✨", color: "#D4AF37" },
    { name: "Depilação a Laser", icon: "🔆", color: "#E29DBE" },
    { name: "Massagem Modeladora", icon: "💆", color: "#C2185B" },
    { name: "Produtos / Cosmecêuticos", icon: "🧴", color: "#5B8DEF" },
  ],
};

export const verticalDict = (t: BusinessType | null | undefined): VerticalDict =>
  t === "clinic" ? CLINIC : SALON;
