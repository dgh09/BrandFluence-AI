import { matchScoreColor } from "@/lib/design-tokens";

interface ScoreDotProps {
  /** 0-100. Se pasa el valor exacto que devuelve `scoreMatch`; aquí se redondea
      solo para mostrarlo, igual que hace `ScoreRing`. */
  score: number;
  label?: string;
}

/**
 * La versión compacta de `ScoreRing`: punto de color + cifra + «/100».
 *
 * Para listas, donde un anillo de 160px no cabe. Mismas reglas que el anillo:
 * paleta de estado y no categórica, y nunca color-solo — la cifra siempre está
 * escrita al lado del punto.
 */
export function ScoreDot({ score, label = "Compatibilidad" }: ScoreDotProps) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div
      className="flex shrink-0 items-center gap-1.5"
      role="img"
      aria-label={`${label}: ${Math.round(clamped)} de 100`}
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-pill"
        style={{ backgroundColor: matchScoreColor(clamped) }}
      />
      <span className="tabular text-sm font-bold" aria-hidden="true">
        {Math.round(clamped)}
      </span>
      <span className="text-xs text-ink-muted" aria-hidden="true">
        /100
      </span>
    </div>
  );
}
