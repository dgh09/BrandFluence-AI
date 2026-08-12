/**
 * Logotipo de BrandFluence.
 *
 * Hasta ahora era un `<div>` coral con una «B» copiado en tres sitios (portada,
 * sidebar del panel y cabecera del alta). Al cambiar la marca eso garantizaba
 * que alguno se quedara atrás, así que vive aquí.
 *
 * El símbolo va en SVG en línea y no como fichero: son cinco trazos, y así
 * toma los colores de los tokens en vez de tenerlos escritos aparte.
 */

interface LogoMarkProps {
  /** Lado del cuadrado en px. */
  size?: number;
  className?: string;
}

/** Solo el símbolo: cuadrado coral con el cubo hexagonal. */
export function LogoMark({ size = 32, className = "" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      aria-hidden="true"
    >
      <rect width="128" height="128" rx="48" fill="var(--color-accent)" />
      <g
        fill="none"
        stroke="var(--color-accent-ink)"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <polygon points="64,24 98.64,44 98.64,84 64,104 29.36,84 29.36,44" />
        <polygon points="64,44 81.32,54 81.32,74 64,94 46.68,74 46.68,54" />
        <line x1="64" y1="44" x2="64" y2="24" />
        <line x1="46.68" y1="74" x2="29.36" y2="84" />
        <line x1="81.32" y1="74" x2="98.64" y2="84" />
      </g>
    </svg>
  );
}

interface LogoProps extends LogoMarkProps {
  /** La bajada solo cabe donde hay sitio: portada sí, sidebar no. */
  tagline?: boolean;
}

/**
 * Símbolo + palabra. La palabra va en minúscula a propósito: es la marca
 * escrita, no el nombre de la empresa.
 */
export function Logo({ size = 32, tagline = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3.5 ${className}`}>
      <LogoMark size={size} />

      {/* Barra separadora: sin ella el símbolo y la palabra se leen como una
          sola pieza y la bajada parece colgar del cuadrado. */}
      <span
        aria-hidden="true"
        className="bg-line-strong"
        style={{ width: 2, height: size * 0.92 }}
      />

      <span className="flex flex-col gap-0.5">
        <span
          className="font-extrabold leading-none tracking-tight"
          style={{ fontSize: size * 0.62 }}
        >
          brandfluence
        </span>
        {tagline ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-secondary">
            Cada match, con su porqué
          </span>
        ) : null}
      </span>
    </span>
  );
}
