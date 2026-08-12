/**
 * Tokens de diseño en TypeScript.
 *
 * Duplican a propósito los valores de globals.css: React Native no entiende
 * CSS custom properties, así que cuando llegue la app Expo este fichero se
 * mueve a un paquete compartido y se consume tal cual desde StyleSheet.
 *
 * Si cambias un color, cámbialo en LOS DOS sitios.
 */

export const colors = {
  canvas: "#0B0B0C",
  surface: "#151517",
  surface2: "#1E1E21",
  surface3: "#2A2A2E",
  line: "#26262A",
  lineStrong: "#3A3A40",

  ink: "#FFFFFF",
  inkSecondary: "#9A9AA0",
  inkMuted: "#6B6B72",

  accent: "#FF3B4F",
  accentHover: "#FF5566",
  accentInk: "#FFFFFF",
  mint: "#62D9C8",
  purple: "#A97BF0",
  sun: "#FFD54A",

  /** Tinta sobre mint y púrpura: blanco encima no llega a 4.5:1. */
  onMint: "#06251F",
  onPurple: "#1B0B2E",
} as const;

/**
 * Paleta categórica de datos, en ORDEN FIJO.
 * Se asigna por posición y nunca se cicla: una novena serie va a "Otros",
 * no a un color generado.
 *
 * Validada sobre el fondo #0B0B0C: banda de luminosidad OKLCH 0.48–0.67,
 * ΔE mínimo 11.5 en deuteranopía, contraste ≥ 3:1.
 */
export const dataColors = ["#FF3B4F", "#2FA898", "#9463E0", "#BE8A15"] as const;

/** Reservados para estado. Nunca reutilizar como color de serie. */
export const statusColors = {
  good: "#2FA898",
  warning: "#BE8A15",
  critical: "#FF3B4F",
} as const;

export const radii = {
  chip: 12,
  tile: 20,
  card: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Color del score de match (0-100). Escala de estado, no categórica:
 * el color codifica "qué tan bueno es", así que va de crítico a bueno.
 */
export function matchScoreColor(score: number): string {
  if (score >= 75) return statusColors.good;
  if (score >= 50) return statusColors.warning;
  return statusColors.critical;
}
