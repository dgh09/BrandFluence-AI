/**
 * Vocabulario controlado de nichos y sectores.
 *
 * El matching compara `creators.niche` con `campaigns.target_niche` por
 * igualdad exacta. Si fueran campos de texto libre, "Fitness", "fitness" y
 * "fitness 💪" serían tres nichos distintos y el algoritmo no encontraría
 * nada. Por eso el valor guardado siempre sale de esta lista.
 *
 * Para añadir un nicho: añádelo aquí. No hace falta migración — la columna
 * es VARCHAR y la validación se hace en Zod contra estas constantes.
 */

export const NICHES = [
  { value: "fitness", label: "Fitness y deporte" },
  { value: "belleza", label: "Belleza y cuidado personal" },
  { value: "moda", label: "Moda" },
  { value: "gastronomia", label: "Gastronomía y cocina" },
  { value: "viajes", label: "Viajes" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "gaming", label: "Gaming" },
  { value: "finanzas", label: "Finanzas personales" },
  { value: "educacion", label: "Educación" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "maternidad", label: "Maternidad y familia" },
  { value: "hogar", label: "Hogar y decoración" },
  { value: "mascotas", label: "Mascotas" },
  { value: "arte", label: "Arte y creatividad" },
  { value: "musica", label: "Música" },
  { value: "salud", label: "Salud y bienestar" },
] as const;

export const INDUSTRIES = [
  { value: "deporte", label: "Deporte y fitness" },
  { value: "cosmetica", label: "Cosmética" },
  { value: "moda", label: "Moda y textil" },
  { value: "alimentacion", label: "Alimentación y bebidas" },
  { value: "turismo", label: "Turismo y hostelería" },
  { value: "tecnologia", label: "Tecnología y software" },
  { value: "videojuegos", label: "Videojuegos" },
  { value: "finanzas", label: "Banca y finanzas" },
  { value: "educacion", label: "Educación y formación" },
  { value: "retail", label: "Retail y ecommerce" },
  { value: "hogar", label: "Hogar y mobiliario" },
  { value: "automocion", label: "Automoción" },
  { value: "salud", label: "Salud y farmacia" },
  { value: "entretenimiento", label: "Entretenimiento" },
] as const;

/**
 * Cómo se pagó, fuera de la plataforma.
 *
 * La lista es de Colombia a propósito: aquí Nequi y Daviplata mueven más
 * dinero entre particulares que las tarjetas, y una lista pensada para
 * Europa —"tarjeta, PayPal"— dejaría a casi todo el mundo eligiendo "otro".
 *
 * Vocabulario cerrado y no texto libre, para que el día que se concilie con
 * una pasarela se pueda agrupar por método sin normalizar cadenas a mano.
 */
export const PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
  { value: "efectivo", label: "Efectivo" },
  { value: "otro", label: "Otro" },
] as const;

export type NicheValue = (typeof NICHES)[number]["value"];
export type IndustryValue = (typeof INDUSTRIES)[number]["value"];
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export const NICHE_VALUES = NICHES.map((n) => n.value) as [NicheValue, ...NicheValue[]];
export const INDUSTRY_VALUES = INDUSTRIES.map((i) => i.value) as [
  IndustryValue,
  ...IndustryValue[],
];

export function nicheLabel(value: string | null): string | null {
  return NICHES.find((n) => n.value === value)?.label ?? value;
}

export function industryLabel(value: string | null): string | null {
  return INDUSTRIES.find((i) => i.value === value)?.label ?? value;
}

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value) as [
  PaymentMethodValue,
  ...PaymentMethodValue[],
];

export function paymentMethodLabel(value: string | null): string | null {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}
