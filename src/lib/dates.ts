/**
 * Fechas en lenguaje humano.
 *
 * Módulo puro, como `currency.ts`: recibe datos y devuelve texto. Y, como
 * allí, **el único sitio** donde se decide cómo se ve una fecha. Antes había
 * cuatro `Intl.DateTimeFormat` sueltos por componentes, con tres formatos
 * distintos y un locale que no era el del resto de la app.
 *
 * ## Nunca con hora
 *
 * Pedirle a `Intl` fecha **y** hora a la vez da cadenas distintas en Node y
 * en el navegador —«8 de agosto, 13:10» contra «8 de agosto a las 13:10»,
 * según la versión de ICU de cada uno—, y eso rompe la hidratación: React
 * tira el HTML del servidor y vuelve a pintar. En producción sería peor
 * todavía, porque el servidor corre en UTC y quien mira está en hora de
 * Colombia. Para «cuándo se declaró un pago», el día es la precisión que
 * importa. Por eso aquí no hay ningún formato con hora, y no debería
 * añadirse uno sin resolver antes esas dos cosas.
 *
 * ## Siempre con año
 *
 * Estas fechas se quedan escritas para siempre en la colaboración. «10 de
 * ago» se lee bien esta semana y es ambiguo dentro de catorce meses.
 *
 * ## El locale es el de Colombia
 *
 * `es-CO`, igual que `currency.ts`. No es lo mismo que `es-ES`: con mes
 * corto, España escribe «10 ago 2026» y Colombia «10 de ago de 2026».
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const LOCALE = "es-CO";

const long = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const short = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * `10 de agosto de 2026`. Para los sitios donde la fecha es parte de la
 * frase: «Desde el…», «Reportado el…».
 */
export function longDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "" : long.format(date);
}

/**
 * `10 de ago de 2026`. Para tablas y listas, donde la fecha es un dato al
 * lado de otros y el mes entero ocuparía demasiado.
 */
export function shortDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "" : short.format(date);
}

/**
 * `ahora mismo`, `hace 5 min`, `hace 3 h`, `ayer`, `hace 4 d`, y a partir de
 * una semana la fecha a secas.
 *
 * El corte en una semana no es arbitrario: «hace 23 días» obliga a hacer la
 * cuenta mentalmente, mientras que «14 de ago de 2026» se lee de una vez. Lo
 * relativo solo ayuda mientras el número es pequeño.
 *
 * OJO: esto sí depende del reloj, así que va **solo en servidor**. Pintar un
 * «hace 2 minutos» en cliente y en servidor da textos distintos si entre el
 * render y la hidratación cambia el minuto.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const elapsed = now - then;

  // Un reloj adelantado en el cliente, o una fila escrita por el servidor un
  // instante después, no deben producir «hace -1 min».
  if (elapsed < MINUTE) return "ahora mismo";
  if (elapsed < HOUR) return `hace ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `hace ${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < 2 * DAY) return "ayer";
  if (elapsed < 7 * DAY) return `hace ${Math.floor(elapsed / DAY)} d`;

  return shortDate(new Date(then));
}
