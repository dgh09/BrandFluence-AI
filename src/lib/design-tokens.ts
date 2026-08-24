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

  /* --- La hoja calificada: material de la portada -----------------------
     Espejo del segundo bloque `@theme` de globals.css. Si cambias uno,
     cámbialo en los dos sitios.

     Son cuatro y no más a propósito: el fondo lo pone `canvas` y el acento
     lo pone `accent`. Un quinto gris sería una rampa, y la rampa es lo que
     convierte un documento impreso en un panel de control. */

  /** Papel bond: todo lo que lleva contenido. */
  paper: "#F0EDE4",
  /** Lo impreso sobre el papel. 15:1. */
  print: "#131316",
  /** El único gris de la portada. 5,2:1 sobre papel. */
  pencil: "#63615C",
  /** El coral, impreso. 4,87:1 sobre papel; el de UI se queda en 2,8:1. */
  accentPrint: "#C81C2E",
} as const;

/**
 * La rampa de tinta de la malla animada que hace de suelo de la portada.
 *
 * Vive aquí y no en `globals.css` porque no la consume ninguna regla de CSS:
 * son cuatro cadenas que se le pasan al shader por props, así que la regla de
 * mantener el espejo entre los dos ficheros no le aplica.
 *
 * Cuatro pasos y todos tinta. La malla no introduce color: un campo coral de
 * fondo convertiría el acento en decoración, y en este sistema el acento solo
 * califica.
 *
 * El recorrido es ancho a propósito, de #0B0B0C a #55555F. Empezó tres veces
 * más estrecho y no se veía. El techo lo pone el contraste: el texto en papel
 * (#F0EDE4) sobre el paso más claro da 6,0:1, así que los titulares sobre
 * tinta siguen pasando AA en el peor momento de la animación.
 */
export const inkWash = ["#0B0B0C", "#232329", "#3D3D46", "#55555F"] as const;

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
