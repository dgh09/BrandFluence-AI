import { ImageIcon } from "lucide-react";

interface Props {
  url: string | null;
  alt: string;
  size?: number;
  /** Los logos de marca se ven mejor con esquinas que con círculo. */
  shape?: "circle" | "tile";
}

/**
 * Foto de perfil o logo, con su hueco cuando todavía no hay ninguna.
 *
 * Va con `<img>` y no con `next/image` a propósito: son imágenes pequeñas de
 * tamaño fijo, así que el optimizador no ahorraría nada que compense meter
 * el host de Supabase en la configuración de dominios remotos.
 */
export function Avatar({ url, alt, size = 64, shape = "circle" }: Props) {
  const radius = shape === "circle" ? "rounded-full" : "rounded-tile";

  return (
    <span
      className={[
        "grid shrink-0 place-items-center overflow-hidden bg-surface-2",
        "border border-line-strong text-ink-muted",
        radius,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <ImageIcon size={Math.round(size / 3)} aria-hidden="true" />
      )}
    </span>
  );
}
