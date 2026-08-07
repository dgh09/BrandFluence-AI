/**
 * Métricas de rendimiento de una colaboración.
 *
 * Módulo puro, sin base de datos, por el mismo motivo que `matching.ts`: la
 * derivación del engagement y el saneado del JSONB se pueden testear de
 * verdad (`src/lib/metrics.test.ts`) en vez de comprobarlos mirando la
 * pantalla. El acceso a datos vive en `queries/collaborations.ts`.
 */

export const METRIC_KEYS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export type PerformanceMetrics = Partial<Record<MetricKey, number>> & {
  /** Cuándo se reportaron por última vez. Lo sella el servidor. */
  reportedAt?: string;
};

/** Las cuatro que cuentan como interacción. `views` es el denominador. */
export const INTERACTION_KEYS = [
  "likes",
  "comments",
  "shares",
  "saves",
] as const satisfies readonly MetricKey[];

/**
 * Lee el JSONB defensivamente: puede ser null, venir de una versión anterior
 * del formato, o traer basura. Lo que no cuadra se descarta en vez de tumbar
 * la página entera.
 */
export function parseMetrics(raw: unknown): PerformanceMetrics | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const source = raw as Record<string, unknown>;
  const metrics: PerformanceMetrics = {};

  for (const key of METRIC_KEYS) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      metrics[key] = value;
    }
  }

  if (typeof source.reportedAt === "string") {
    metrics.reportedAt = source.reportedAt;
  }

  // Solo con la marca de tiempo no hay nada que enseñar.
  return METRIC_KEYS.some((key) => metrics[key] !== undefined) ? metrics : null;
}

/**
 * Engagement de la colaboración: interacciones sobre visualizaciones.
 *
 * Se calcula, no se guarda. Un porcentaje almacenado junto a los números de
 * los que sale es una contradicción esperando a ocurrir en cuanto alguien
 * corrija una cifra.
 *
 * Sin visualizaciones no hay denominador, y devolver 0 sería mentir: no es
 * "engagement cero", es "no se puede calcular". Misma distinción que hace el
 * algoritmo de matching entre "sin datos" y "un 0% real".
 */
export function engagementRate(metrics: PerformanceMetrics | null): number | null {
  if (!metrics?.views) return null;

  const interactions = INTERACTION_KEYS.reduce(
    (total, key) => total + (metrics[key] ?? 0),
    0,
  );

  return (interactions / metrics.views) * 100;
}
