/**
 * Fechas en lenguaje humano.
 *
 * Módulo puro, como `currency.ts`: recibe datos y devuelve texto.
 *
 * `now` es un parámetro y no una llamada a `Date.now()` escondida dentro,
 * porque una función que lee el reloj por su cuenta no se puede testear sin
 * congelar el tiempo del proceso entero.
 *
 * OJO: esto se usa **solo en componentes de servidor**. Pintar un «hace 2
 * minutos» en cliente y en servidor da textos distintos si entre el render y
 * la hidratación cambia el minuto, y React tira el HTML del servidor para
 * volver a pintarlo — el mismo problema que documenta `currency.ts` con los
 * espacios duros de `Intl`.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Solo el día: `14 ago 2026`. Para cuando ya no interesa la hora exacta. */
const shortDate = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * `ahora mismo`, `hace 5 min`, `hace 3 h`, `ayer`, `hace 4 d`, y a partir de
 * una semana la fecha a secas.
 *
 * El corte en una semana no es arbitrario: «hace 23 días» obliga a hacer la
 * cuenta mentalmente, mientras que «14 ago 2026» se lee de una vez. Lo
 * relativo solo ayuda mientras el número es pequeño.
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

  return shortDate.format(then);
}
