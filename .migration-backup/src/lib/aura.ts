// Helpers de domínio Aura Performance
export const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export const monthRange = (d = new Date()) => {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString(), year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const last30Range = () => {
  const end = new Date();
  const start = new Date(Date.now() - 30 * 86400_000);
  return { start: start.toISOString(), end: end.toISOString() };
};
