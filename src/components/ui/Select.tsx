import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

export function Select({
  label,
  options,
  error,
  placeholder,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-ink-secondary">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={[
          "h-12 rounded-tile bg-surface-2 px-4 text-base text-ink",
          "border transition-colors",
          error ? "border-critical" : "border-line-strong",
          "focus:outline-none focus:border-accent",
          className,
        ].join(" ")}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const areaId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={areaId} className="text-sm font-medium text-ink-secondary">
        {label}
      </label>
      <textarea
        id={areaId}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${areaId}-error` : hint ? `${areaId}-hint` : undefined}
        className={[
          "rounded-tile bg-surface-2 p-4 text-base text-ink",
          "border transition-colors placeholder:text-ink-muted resize-y",
          error ? "border-critical" : "border-line-strong",
          "focus:outline-none focus:border-accent",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p id={`${areaId}-error`} className="text-xs text-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={`${areaId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
