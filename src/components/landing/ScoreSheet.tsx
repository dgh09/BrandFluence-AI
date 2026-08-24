import { Check } from "lucide-react";

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
  /** Quién es. Va en la cabecera, en versalitas de utilidad. */
  name: string;
  /** Nicho, audiencia, engagement. Ya formateado en es-CO. */
  meta: string;
  score: number;
  lines: ScoreLine[];
  /** Las notas que devuelve `scoreMatch`, como correcciones a mano. */
  notes?: string[];
  size?: "lg" | "sm";
  rotate?: number;
  className?: string;
}

/**
 * La ficha de score. El objeto firma de la portada.
 *
 * Es lo único que se repite: grande en el hero, mediana en el ejemplo, y el
 * día que el panel se rediseñe, funcional dentro de `/matches`. Por eso recibe
 * el desglose entero en vez de una nota suelta — una ficha sin desglose sería
 * exactamente el «96% de compatibilidad» que el producto discute.
 *
 * Las barras no llevan pista de fondo. Una pista gris convierte el desglose en
 * un panel de control; sin ella, son cuatro trazos impresos de distinto largo,
 * que es lo que hay en un boletín de notas.
 */
export function ScoreSheet({
  name,
  meta,
  score,
  lines,
  notes = [],
  size = "lg",
  rotate = -1.1,
  className = "",
}: ScoreSheetProps) {
  const grande = size === "lg";

  return (
    <Paper
      rotate={rotate}
      padding={grande ? "p-7 sm:p-9" : "p-6"}
      className={className}
    >
      <p className="utility text-[0.625rem] text-graphite sm:text-[0.6875rem]">
        {name} · {meta}
      </p>

      {/* La nota y el desglose se apilan, no van en columnas. Un número de
          este cuerpo y cuatro filas de datos no caben lado a lado en el ancho
          real de la ficha, y forzarlo sacaba el desglose fuera del papel. */}
      <div className="mt-5">
        <p
          className={`display tabular text-print ${
            grande ? "text-score" : "text-6xl leading-[0.82]"
          }`}
        >
          {formatScore(score)}
        </p>
        <p className="utility mt-3 border-t-2 border-print pt-2.5 text-[0.625rem] text-graphite">
          sobre 100
        </p>

        {/* Etiqueta · barra · cifra. La barra ocupa la columna elástica, así
            que los cuatro números quedan alineados a la derecha pase lo que
            pase con el ancho del contenedor. */}
        <ul className="mt-6 grid grid-cols-[auto_minmax(1.5rem,1fr)_auto] items-center gap-x-3 gap-y-3.5 sm:gap-x-4">
          {lines.map((line) => (
            <li
              key={line.label}
              className="col-span-3 grid grid-cols-subgrid items-center"
            >
              <span className="utility text-[0.625rem] text-graphite">
                {line.label}
              </span>
              <span className="flex h-[3px] w-full">
                <span
                  className="block h-full bg-print"
                  style={{ width: `${(line.value / line.max) * 100}%` }}
                />
              </span>
              <span className="display tabular text-lg text-print">
                {formatScore(line.value)}
                <span className="utility ml-1 text-[0.625rem] font-normal text-graphite">
                  /{line.max}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {notes.length > 0 ? (
        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-print/20 pt-4">
          {notes.map((note) => (
            <li
              key={note}
              className="utility flex items-center gap-1.5 text-[0.625rem] text-accent-print"
            >
              <Check size={13} strokeWidth={2.5} aria-hidden="true" />
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </Paper>
  );
}
