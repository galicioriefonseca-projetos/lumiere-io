import { z } from "zod";

/** Email + senha forte (8+, com letra e número). */
export const credSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .max(72, "Máximo de 72 caracteres")
    .regex(/[A-Za-z]/, "Inclua ao menos uma letra")
    .regex(/[0-9]/, "Inclua ao menos um número"),
});

/** Score 0–4 para medidor de força. */
export const passwordStrength = (pw: string): { score: number; label: string } => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Excelente"];
  return { score: s, label: labels[s] };
};

/** Máscara BR para telefone celular: (11) 99999-9999. */
export const maskPhoneBR = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const isValidPhoneBR = (v: string) => v.replace(/\D/g, "").length >= 10;

/** Máscara CPF/CNPJ — escolhe automaticamente. */
export const maskTaxId = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  // CNPJ: 00.000.000/0000-00
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

/** Validação real de CPF (dígitos verificadores). */
const isValidCPF = (raw: string): boolean => {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
};

/** Validação real de CNPJ. */
const isValidCNPJ = (raw: string): boolean => {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(base[i], 10) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(c, w1);
  const d2 = calc(c, w2);
  return d1 === parseInt(c[12], 10) && d2 === parseInt(c[13], 10);
};

export const isValidTaxId = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length === 11 ? isValidCPF(d) : d.length === 14 ? isValidCNPJ(d) : false;
};

/* ============================================================
 * Schemas usados em outras telas (mantidos do projeto original)
 * ============================================================ */

export const parseBRLNumber = (v: string): number => {
  if (!v) return NaN;
  const cleaned = v.replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", ".");
  return Number(cleaned);
};

const uuid = z.string().uuid("ID inválido");
const optionalUuid = z.union([uuid, z.literal(""), z.null()]).optional();

export const launchSchema = z.object({
  kind: z.enum(["service", "product"]),
  professional_id: uuid,
  category_id: optionalUuid,
  amount: z.number({ invalid_type_error: "Valor inválido" }).positive("Valor deve ser positivo").max(1_000_000),
  description: z.string().trim().min(1, "Descreva o lançamento").max(200),
  client_name: z.string().trim().max(120).optional().or(z.literal("")),
});

export const evaluationSchema = z.object({
  salon_id: uuid,
  professional_id: uuid,
  rating: z.number().int().min(1, "Selecione uma nota").max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
  client_name: z.string().trim().max(120).optional().or(z.literal("")),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(80),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional().or(z.literal("")),
});

export const clientRecordSchema = z.object({
  client_name: z.string().trim().min(1, "Informe o nome do cliente").max(120),
  client_phone: z.string().trim().max(40).optional().or(z.literal("")),
  client_email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  birth_date: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const commissionSchema = z.object({
  professional_id: uuid,
  category_id: optionalUuid,
  percent: z.number({ invalid_type_error: "Percentual inválido" }).min(0).max(100),
});
