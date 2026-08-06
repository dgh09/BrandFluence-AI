/**
 * Algoritmo de matching creador ↔ campaña.
 *
 * Función pura, sin base de datos: entra un perfil y una campaña, sale un
 * score de 0 a 100 con su desglose. Eso permite testearla de verdad
 * (`src/lib/matching.test.ts`) en vez de comprobarla mirando la pantalla.
 *
 * El desglose se guarda en `matches.score_reason` (JSONB) para poder
 * responder a "¿por qué me sale esta campaña?" sin recalcular nada.
 */

// Extensión explícita: `node --test` resuelve como ESM y necesita el .ts.
import { NICHE_VALUES, type NicheValue } from "./taxonomy.ts";

/** Reparto de los 100 puntos. Cambiar aquí cambia el algoritmo entero. */
export const WEIGHTS = {
  niche: 40,
  audience: 25,
  engagement: 25,
  trust: 10,
} as const;

/**
 * Nichos afines. Un creador de fitness encaja razonablemente en una campaña
 * de salud, pero no en una de finanzas.
 *
 * La relación se declara en un sentido y se simetriza al construir el mapa:
 * si fitness→salud, entonces salud→fitness. Así no hay que mantener las dos
 * direcciones a mano y no pueden quedar desparejadas.
 */
const RELATED_PAIRS: [NicheValue, NicheValue][] = [
  ["fitness", "salud"],
  ["fitness", "lifestyle"],
  ["belleza", "moda"],
  ["belleza", "lifestyle"],
  ["moda", "lifestyle"],
  ["gastronomia", "salud"],
  ["gastronomia", "hogar"],
  ["viajes", "lifestyle"],
  ["viajes", "gastronomia"],
  ["tecnologia", "gaming"],
  ["tecnologia", "finanzas"],
  ["gaming", "musica"],
  ["finanzas", "educacion"],
  ["educacion", "tecnologia"],
  ["lifestyle", "hogar"],
  ["maternidad", "hogar"],
  ["maternidad", "salud"],
  ["maternidad", "educacion"],
  ["mascotas", "lifestyle"],
  ["mascotas", "hogar"],
  ["arte", "musica"],
  ["arte", "lifestyle"],
];

const RELATED = new Map<string, Set<string>>(
  NICHE_VALUES.map((n) => [n, new Set<string>()]),
);
for (const [a, b] of RELATED_PAIRS) {
  RELATED.get(a)?.add(b);
  RELATED.get(b)?.add(a);
}

export function areRelated(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return RELATED.get(a)?.has(b) ?? false;
}

/** Un creador con fraud_score por encima de esto no entra en ningún match. */
export const FRAUD_THRESHOLD = 0.7;
/** A partir de este engagement (%) se dan los puntos completos. */
export const ENGAGEMENT_TARGET = 6;
/** Suelo de audiencia cuando la campaña no exige mínimo. */
export const AUDIENCE_BASELINE = 1000;

export interface CreatorFacts {
  niche: string | null;
  followerCount: number;
  engagementRate: number | null;
  isVerified: boolean;
  fraudScore: number | null;
  hasBio: boolean;
}

export interface CampaignFacts {
  targetNiche: string | null;
  minFollowers: number;
}

export interface ScoreBreakdown {
  niche: number;
  audience: number;
  engagement: number;
  trust: number;
}

export interface MatchScore {
  /** false = no se crea match. `reason` dice por qué. */
  eligible: boolean;
  score: number;
  breakdown: ScoreBreakdown;
  notes: string[];
  reason?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round2 = (value: number) => Math.round(value * 100) / 100;

export function scoreMatch(
  creator: CreatorFacts,
  campaign: CampaignFacts,
): MatchScore {
  const empty: ScoreBreakdown = { niche: 0, audience: 0, engagement: 0, trust: 0 };
  const reject = (reason: string): MatchScore => ({
    eligible: false,
    score: 0,
    breakdown: empty,
    notes: [],
    reason,
  });

  // --- Filtros duros -------------------------------------------------------
  // No son penalizaciones: si no se cumplen, el match no debe existir.

  if (!creator.niche) return reject("El creador no tiene nicho definido");
  if (!campaign.targetNiche) return reject("La campaña no tiene nicho objetivo");

  if (creator.fraudScore !== null && creator.fraudScore > FRAUD_THRESHOLD) {
    return reject("Creador marcado por sospecha de fraude");
  }

  if (creator.followerCount < campaign.minFollowers) {
    return reject(
      `Audiencia insuficiente: ${creator.followerCount} < ${campaign.minFollowers}`,
    );
  }

  const exactNiche = creator.niche === campaign.targetNiche;
  const relatedNiche = areRelated(creator.niche, campaign.targetNiche);
  if (!exactNiche && !relatedNiche) {
    return reject(`Nicho no afín: ${creator.niche} vs ${campaign.targetNiche}`);
  }

  const notes: string[] = [];

  // --- Nicho (40) ----------------------------------------------------------
  const niche = exactNiche ? WEIGHTS.niche : WEIGHTS.niche * 0.6;
  notes.push(exactNiche ? "Nicho exacto" : "Nicho afín, no exacto");

  // --- Audiencia (25) ------------------------------------------------------
  // Superar el mínimo suma, pero con rendimientos decrecientes: pasar de 10x
  // a 100x el mínimo no hace a nadie diez veces mejor candidato, y los
  // micro-influencers suelen convertir mejor que los macro.
  const floor = Math.max(campaign.minFollowers, AUDIENCE_BASELINE);
  const ratio = creator.followerCount / floor;
  const growth = clamp(Math.log10(Math.max(ratio, 1)), 0, 1); // 1x→0, 10x+→1
  const audience = WEIGHTS.audience * (0.6 + 0.4 * growth);
  if (ratio >= 10) notes.push("Audiencia muy por encima del mínimo");

  // --- Engagement (25) -----------------------------------------------------
  let engagement: number;
  if (creator.engagementRate === null) {
    // Sin dato no penalizamos a cero: no es lo mismo "engagement malo" que
    // "todavía no lo ha rellenado". Damos un valor bajo pero no nulo.
    engagement = WEIGHTS.engagement * 0.4;
    notes.push("Sin datos de engagement");
  } else {
    engagement =
      WEIGHTS.engagement * clamp(creator.engagementRate / ENGAGEMENT_TARGET, 0, 1);
    if (creator.engagementRate >= ENGAGEMENT_TARGET) {
      notes.push("Engagement excelente");
    }
  }

  // --- Confianza (10) ------------------------------------------------------
  let trust = 0;
  if (creator.isVerified) {
    trust += 5;
    notes.push("Perfil verificado");
  }
  if (creator.hasBio) trust += 3;
  if (creator.fraudScore === null || creator.fraudScore < 0.3) trust += 2;

  const breakdown: ScoreBreakdown = {
    niche: round2(niche),
    audience: round2(audience),
    engagement: round2(engagement),
    trust: round2(trust),
  };

  const score = round2(
    breakdown.niche + breakdown.audience + breakdown.engagement + breakdown.trust,
  );

  return { eligible: true, score, breakdown, notes };
}
