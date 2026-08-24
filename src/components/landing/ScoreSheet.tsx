import { formatScore } from "@/lib/numbers";
import { Paper } from "./Paper";

export interface ScoreLine {
  label: string;
  /** Valor exacto de `scoreMatch`, sin redondear a mano. */
  value: number;
  /** Techo del componente en `WEIGHTS`: 40, 25, 25, 10. */
  max: number;
}

interface ScoreSheetProps {
  name: string;
  /** Nicho, audiencia, engagement. Ya formateado en es-CO. */
  meta: string;
  score: number;
  lines: ScoreLine[];
  rotate?: number;
  className?: string;
}

/**
 * La ficha de score. El objeto que la página quiere que recuerdes.
 *
 * Enseña la nota, el desglose y **lo que le falta a cada componente**. Ese
 * tercer dato es lo que separa una calificación de un veredicto: un 5 sobre 10
 * en confianza no dice nada por sí solo, «faltan 5» dice qué se puede mover.
 *
 * Las barras no llevan pista de fondo. Una pista gris convierte el desglose en
 * un panel de control; sin ella son cuatro trazos impresos de distinto largo,
 * que es lo que hay en un boletín de notas.
 */
export function ScoreSheet({
  name,
  meta,
  score,
  lines,
  rotate = -0.9,
  className = "",
}: ScoreSheetProps) {
  // Las cuatro barras se miden contra el mismo techo, el mayor de los cuatro.
  // Normalizada cada una contra el suyo, un 40 de 40 y un 10 de 10 salían del
  // mismo largo, y el reparto 40/25/25/10 —que es justo lo que esta página
  // audita— quedaba invisible.
  const techoComun = Math.max(...lines.map((l) => l.max));

  return (
    <Paper rotate={rotate} className={className}>
      {/* El sello: Lucía no es una usuaria real, y una ficha con nombre y
          seguidores concretos sin marcar se lee como el expediente de alguien.
          Además gasta una de las marcas de calificación del vocabulario que
          hasta ahora no se usaba. */}
      <p className="utility w-fit rotate-[-2deg] border-2 border-accent-print px-2.5 py-1 text-base text-accent-print">
        ejemplo
      </p>

      <p className="utility mt-6 text-base text-pencil">{name}</p>
      <p className="utility mt-1.5 text-base text-pencil">{meta}</p>

      <p className="nota mt-7 text-score text-print">{formatScore(score)}</p>
      <p className="utility mt-3 border-t-2 border-print pt-3 text-base text-print">
        sobre 100
      </p>

      {/* La barra va siempre en su propia línea, también en escritorio.
          Encajada entre la etiqueta y la cifra le quedaban noventa píxeles de
          una ficha de cuatrocientos, y a ese largo cuatro barras no se
          comparan entre sí: se leen como los puntos de relleno de un
          formulario. */}
      <ul className="mt-7 flex flex-col gap-5">
        {lines.map((line) => (
          <li key={line.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="utility text-base text-pencil">
                {line.label}
              </span>
              <span className="utility text-base text-print">
                {formatScore(line.value)}
                <span className="text-pencil">/{line.max}</span>
              </span>
            </div>

            {/* La barra tiene que leerse como una medida, no como otro filete
                de la hoja. Dos cosas la separan de los filetes: pesa 5px
                contra el 1–2px de los separadores, y lleva su propia marca de
                tope. La marca va donde estaría el techo de ESE componente
                sobre la escala común, así que la distancia entre el final de
                la barra y su marca es el déficit, dibujado. */}
            <span className="relative mt-2.5 flex h-[5px] w-full">
              <span
                className="block h-full bg-print"
                style={{ width: `${(line.value / techoComun) * 100}%` }}
              />
              <span
                aria-hidden="true"
                className="absolute top-[-4px] h-[13px] w-px bg-print/50"
                style={{
                  left: `${(line.max / techoComun) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              />
            </span>
          </li>
        ))}
      </ul>

      {/* Lo que falta, sumado. Una ficha que solo dice lo que tienes es una
          medalla; con el déficit delante es una nota con retroalimentación. */}
      <p className="utility mt-6 border-t border-print/20 pt-4 text-base text-accent-print">
        faltan {formatScore(100 - score)} puntos
      </p>
    </Paper>
  );
}
