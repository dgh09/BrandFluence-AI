import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Tarjeta de acento a todo color, como "Today's Training" de la referencia. */
  tone?: "surface" | "accent" | "purple" | "mint";
  children: ReactNode;
}

const tones: Record<NonNullable<CardProps["tone"]>, string> = {
  surface: "bg-surface border border-line text-ink",
  accent: "bg-accent text-accent-ink",
  purple: "bg-purple text-[#1B0B2E]",
  mint: "bg-mint text-[#06251F]",
};

/** Contenedor base. Radio de 24px, que es el de la referencia. */
export function Card({
  tone = "surface",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={["rounded-card p-4", tones[tone], className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  /** Icono decorativo arriba a la derecha, como en la referencia. */
  icon?: ReactNode;
  /** Línea de contexto bajo el valor (ej. "+3 esta semana"). */
  hint?: string;
}

/**
 * Tile de estadística: label pequeño arriba, cifra grande debajo.
 *
 * Es un número protagonista, no un gráfico: una sola magnitud sin
 * comparación no necesita ejes. Las cifras van en tabular-nums para que
 * dos tiles lado a lado alineen los dígitos.
 */
export function StatTile({ label, value, icon, hint }: StatTileProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-ink-secondary">{label}</span>
        {icon ? (
          <span className="text-ink-secondary" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <div>
        <p className="tabular text-3xl font-bold leading-none">{value}</p>
        {hint ? (
          <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}
