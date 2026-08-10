/**
 * Números en lenguaje humano.
 *
 * Módulo puro, y el tercero de la misma familia: `currency.ts` para el
 * dinero, `dates.ts` para las fechas, este para las cifras a secas. Todos
 * existen por la misma razón — había copias del mismo `Intl` repartidas por
 * pantallas, y cada copia es un sitio donde el formato se queda atrás.
 *
 * ## El locale importa más de lo que parece
 *
 * `es-CO`, como el resto. Y no da lo mismo que `es-ES` con los números de
 * cuatro dígitos: España **no** agrupa los miles hasta cinco cifras (`3100`,
 * `42.000`) y Colombia sí (`3.100`, `42.000`). Con el formato español, dos
 * cifras una al lado de la otra se leían con reglas distintas.
 */

const LOCALE = "es-CO";

/** Enteros con separador de miles: `42.000`. Seguidores, visualizaciones… */
const counts = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/**
 * Un decimal, ni más ni menos: `7,4`.
 *
 * Fijo a uno en los dos extremos para que una columna de porcentajes quede
 * alineada: `7,4` y `12,0`, no `7,4` y `12`.
 */
const percents = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `42.000`. Redondea: aquí no hay medias visualizaciones. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "";
  return counts.format(Math.round(value));
}

/** `7,4%`. El símbolo va pegado, como se escribe en español. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "";
  return `${percents.format(value)}%`;
}
