import { matchScoreColor } from "@/lib/design-tokens";

interface ScoreRingProps {
  /** 0-100. */
  score: number;
  label?: string;
  /** Diámetro en px. */
  size?: number;
  /** Texto pequeño sobre la cifra, como el "Day 12" de la referencia. */
  caption?: string;
}

/**
 * Anillo de score de match — el medidor de la referencia.
 *
 * El color codifica calidad (crítico → bueno), no identidad, así que usa la
 * paleta de estado y no la categórica. Nunca es color-solo: la cifra está
 * escrita en el centro y el aria-label la repite para lectores de pantalla.
 */
export function ScoreRing({
  score,
  label = "Compatibilidad",
  size = 160,
  caption,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = Math.round(size * 0.075);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;
  const color = matchScoreColor(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(clamped)} de 100`}
    >
      <svg
        width={size}
        height={size}
        // Empieza arriba en vez de a las 3 en punto
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {caption ? (
          <span className="mb-0.5 text-[11px] font-medium text-ink-secondary">
            {caption}
          </span>
        ) : null}
        <span
          className="tabular font-bold leading-none"
          style={{ fontSize: size * 0.26 }}
        >
          {Math.round(clamped)}
        </span>
        <span className="mt-1 text-[11px] text-ink-muted">/ 100</span>
      </div>
    </div>
  );
}
