"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { matchScoreColor } from "@/lib/design-tokens";
import type { MatchRow } from "@/lib/queries/dashboard";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const STATUS_LABEL: Record<string, string> = {
  interested: "Aplicada",
  rejected: "Descartada",
  accepted: "Aceptada",
};

/**
 * Fila de match, calcada de las tarjetas de ejercicio de la referencia:
 * título, línea de meta, y dos acciones (una primaria coral, una secundaria).
 *
 * El score no va solo por color: el número está escrito al lado del punto,
 * así que se lee igual sin distinguir el verde del rojo.
 */
export function MatchCard({ match }: { match: MatchRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(match.status);
  const [pending, setPending] = useState<null | "apply" | "dismiss">(null);
  const [error, setError] = useState<string | null>(null);

  const color = matchScoreColor(match.matchScore);
  const decided = status !== "suggested";

  async function act(action: "apply" | "dismiss") {
    setPending(action);
    setError(null);

    const response = await fetch(`/api/matches/${match.id}/${action}`, {
      method: "POST",
    });

    setPending(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo completar la acción");
      return;
    }

    const data = (await response.json()) as { status: string };
    setStatus(data.status);
    // Refresca los contadores del dashboard, que los calcula el servidor.
    router.refresh();
  }

  return (
    <Card className={["flex flex-col gap-4", decided ? "opacity-60" : ""].join(" ")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{match.campaignTitle}</p>
          <p className="mt-0.5 truncate text-sm text-ink-secondary">
            {match.brandName ?? "Marca"}
            {match.campaignBudget !== null
              ? ` · ${currency.format(match.campaignBudget)}`
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="tabular text-sm font-bold">
            {Math.round(match.matchScore)}
          </span>
          <span className="text-xs text-ink-muted">/100</span>
        </div>
      </div>

      {/* Explicabilidad: por qué le sale esta campaña. Sale del desglose
          que guardó el algoritmo, no de un texto inventado en el cliente. */}
      {match.notes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {match.notes.map((note) => (
            <li
              key={note}
              className="rounded-pill bg-surface-2 px-2.5 py-1 text-xs text-ink-secondary"
            >
              {note}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}

      {decided ? (
        <p role="status" className="text-sm font-medium text-ink-secondary">
          {STATUS_LABEL[status] ?? status}
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<X size={16} />}
            fullWidth
            disabled={pending !== null}
            onClick={() => act("dismiss")}
          >
            {pending === "dismiss" ? "…" : "Descartar"}
          </Button>
          <Button
            size="sm"
            icon={<Check size={16} />}
            fullWidth
            disabled={pending !== null}
            onClick={() => act("apply")}
          >
            {pending === "apply" ? "…" : "Aplicar"}
          </Button>
        </div>
      )}
    </Card>
  );
}
