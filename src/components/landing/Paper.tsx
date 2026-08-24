import type { ReactNode } from "react";

interface PaperProps {
  children: ReactNode;
  /** Grados de rotación. Una hoja apoyada en una mesa nunca cae recta. */
  rotate?: number;
  /** Relleno interior. Hay que dejarle margen al desgarro del borde. */
  padding?: string;
  className?: string;
}

/**
 * Una hoja de papel recortada sobre la tinta del fondo.
 *
 * El fondo va en una capa aparte, detrás del contenido, porque el filtro que
 * rasga el borde desplaza píxeles: aplicado al elemento entero desplazaría
 * también el texto. Separarlos deja el recorte irregular y la tipografía
 * intacta.
 *
 * Sin radio y sin sombra. El papel se corta, y lo que lo separa del fondo es
 * el contraste del material, no una elevación fingida.
 */
export function Paper({
  children,
  rotate = 0,
  padding = "p-7 sm:p-9",
  className = "",
}: PaperProps) {
  return (
    <div
      className={`relative ${className}`}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-paper"
        style={{ filter: "url(#rasgado)" }}
      />
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
}
