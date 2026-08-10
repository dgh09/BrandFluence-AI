/**
 * Importes en pesos colombianos.
 *
 * Módulo puro, como `matching.ts` o `metrics.ts`, y **el único sitio** donde
 * se decide cómo se ve un importe. Antes había siete copias del mismo
 * `Intl.NumberFormat` repartidas por pantallas y componentes: siete sitios
 * donde cambiar la moneda y siete oportunidades de que uno se quedara atrás.
 */

/** Lo que se guarda en la base. Un solo sitio del que tirar el día que haya más. */
export const CURRENCY_CODE = "COP";

// El agrupado de miles sale de `numbers.ts`, que es el mismo que usan los
// seguidores y las métricas. Import relativo y con extensión: los tests
// corren sin bundler y ahí el alias `@/` no se resuelve.
import { formatCount } from "./numbers.ts";

/**
 * `$2.500.000`, que es como se escribe un precio en Colombia.
 *
 * **El símbolo lo ponemos nosotros.** Pedirle a `Intl` el formato de moneda
 * completo devuelve `$` + **U+00A0** (espacio duro) + la cifra, y ese
 * carácter invisible depende de la versión de ICU: la de Node y la del
 * navegador no tienen por qué coincidir. Como estos importes se pintan
 * dentro de componentes cliente, una diferencia ahí rompe la hidratación
 * —ya pasó con las fechas del panel de pago— y React tira el HTML del
 * servidor para volver a pintarlo. El agrupado de miles, en cambio, es
 * estable entre versiones.
 *
 * Sin decimales a propósito: el centavo de peso no circula, y arrastrar
 * `,00` en cada cifra solo añade ruido a los números que la gente compara.
 */
export function formatCOP(value: number): string {
  return `$${formatCount(value)}`;
}

/**
 * Igual, pero diciendo la moneda en voz alta: `$2.500.000 COP`.
 *
 * Para donde el importe **es** el asunto —lo que una marca va a transferir de
 * verdad— y confundirlo con dólares saldría caro. En el resto de la interfaz
 * el contexto ya es colombiano y el símbolo basta.
 */
export function formatCOPExplicit(value: number): string {
  return `${formatCOP(value)} ${CURRENCY_CODE}`;
}
