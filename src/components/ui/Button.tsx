import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Icono a la izquierda. Decorativo: el label lleva el significado. */
  icon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Botón pill de la referencia.
 * · primary   → coral relleno ("Play", "Aplicar")
 * · secondary → superficie elevada con borde ("Replace", "Descartar")
 * · ghost     → sin fondo, solo texto
 */
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-ink border border-line-strong hover:bg-surface-3 active:scale-[0.98]",
  ghost: "text-ink-secondary hover:text-ink hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-pill font-semibold",
        "transition-[background-color,transform] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}
