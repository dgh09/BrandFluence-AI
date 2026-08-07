const STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-good/15 text-good" },
  completed: { label: "Completada", className: "bg-surface-3 text-ink-secondary" },
  cancelled: { label: "Cancelada", className: "bg-critical/15 text-critical" },
};

export const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pago pendiente",
  processing: "Pago en curso",
  completed: "Pagada",
};

/**
 * Estado de una colaboración.
 *
 * Siempre lleva texto, nunca solo color: "Activa" y "Cancelada" se
 * distinguen leyéndolas, no por el verde y el rojo.
 */
export function StatusBadge({ status }: { status: string }) {
  const { label, className } = STATUS[status] ?? {
    label: status,
    className: "bg-surface-3 text-ink-secondary",
  };

  return (
    <span
      className={[
        "shrink-0 rounded-pill px-3 py-1 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
