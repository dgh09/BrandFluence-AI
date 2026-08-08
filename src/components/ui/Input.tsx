import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Mensaje de error. Se enlaza al input vía aria-describedby. */
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-ink-secondary"
      >
        {label}
      </label>

      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          "h-12 rounded-tile bg-surface-2 px-4 text-base text-ink",
          "border transition-colors placeholder:text-ink-muted",
          error ? "border-critical" : "border-line-strong",
          "focus:outline-none focus:border-accent",
          className,
        ].join(" ")}
        {...props}
        // Va DESPUÉS del spread para que no lo pise un onWheel de fuera.
        onWheel={(event) => {
          // Chrome le suma o resta al `number` que tenga el foco cuando la
          // rueda pasa por encima. Quien baje por el formulario con el ratón
          // sobre el campo cambia la cifra sin enterarse: aquí eso son los
          // seguidores y el engagement, que alimentan el matching. Quitarle
          // el foco desactiva ese comportamiento sin bloquear el scroll.
          if (props.type === "number") event.currentTarget.blur();
          props.onWheel?.(event);
        }}
      />

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
