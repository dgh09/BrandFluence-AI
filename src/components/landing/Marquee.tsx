interface MarqueeProps {
  /** Los tramos que desfilan. Se repiten hasta llenar la cinta. */
  items: string[];
}

/**
 * La cinta de la rúbrica, justo encima de la llamada final.
 *
 * Es el único movimiento de la página además del revelado al hacer scroll, y
 * está aquí porque el cierre es donde el reparto de puntos tiene que quedar
 * grabado. Sin JavaScript: dos copias idénticas del tramo y un `translateX`
 * del 50%, que es lo que hace el bucle invisible.
 *
 * `aria-hidden` porque el reparto ya se lee entero, y en su sitio, en la
 * auditoría. Un lector de pantalla no tiene por qué oír «nicho cuarenta» doce
 * veces.
 */
export function Marquee({ items }: MarqueeProps) {
  const tramo = [...items, ...items, ...items];

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y-2 border-accent bg-accent py-3"
    >
      <div className="marquesina flex w-max">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0">
            {tramo.map((item, i) => (
              <span
                key={`${copia}-${i}`}
                className="utility flex items-center gap-6 whitespace-nowrap px-6 text-base text-print"
              >
                {item}
                <span className="text-print/40">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
