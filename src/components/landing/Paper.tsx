import type { ReactNode } from "react";

interface PaperProps {
  children: ReactNode;
  /** Grados de rotación. El papel apoyado en una mesa nunca cae recto. */
  rotate?: number;
  /** `paper` para lo que lleva contenido, `paper-2` para lo secundario. */
  tone?: "paper" | "paper-2";
  /** Relleno interior. Hay que dejar margen al desgarro del borde. */
  padding?: string;
  className?: string;
}

/**
 * Una pieza de papel recortada sobre la tinta del fondo.
 *
 * El fondo va en una capa aparte, detrás del contenido, porque el filtro que
 * rasga el borde desplaza píxeles: aplicado al elemento entero también
 * desplazaría el texto. Separarlos deja el recorte irregular y la tipografía
 * intacta.
 *
 * Sin sombra difusa y sin radio: el papel se corta, no se redondea, y lo que
 * lo separa del fondo es el contraste del material, no una elevación falsa.
 */
export function Paper({
  children,
  rotate = 0,
  tone = "paper",
  padding = "p-6 sm:p-8",
  className = "",
}: PaperProps) {
  return (
    <div
      className={`relative ${className}`}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${tone === "paper" ? "bg-paper" : "bg-paper-2"}`}
        style={{ filter: "url(#borde-rasgado)" }}
      />
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  );
}
