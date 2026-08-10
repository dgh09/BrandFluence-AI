"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCOP } from "@/lib/currency";
import { formatCount } from "@/lib/numbers";
import { matchScoreColor } from "@/lib/design-tokens";
import type { CandidateRow } from "@/lib/queries/matches";
import { nicheLabel } from "@/lib/taxonomy";

/**
 * Candidato visto por la marca, con las acciones de aceptarlo y rechazarlo.
 *
 * Es el espejo de MatchCard: allí el creador aplica o descarta, aquí la marca
 * acepta o rechaza. Misma jerarquía visual —nombre, línea de meta, score— y
 * el mismo par de botones (secundario a la izquierda, primario a la derecha)
 * para que las dos bandejas se lean igual aunque el rol sea el contrario.
 */
export function CandidateCard({ candidate }: { candidate: CandidateRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(candidate.status);
  const [amount, setAmount] = useState(candidate.agreedAmount);
  const [pending, setPending] = useState<null | "accept" | "decline">(null);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setPending("accept");
    setError(null);

    const response = await fetch(`/api/matches/${candidate.matchId}/accept`, {
      method: "POST",
    });

    setPending(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo aceptar al candidato");
      return;
    }

    const data = (await response.json()) as { agreedAmount: number | null };
    setStatus("accepted");
    setAmount(data.agreedAmount);
    // La colaboración recién creada cambia los contadores del dashboard y
    // la lista de /collaborations, que se calculan en el servidor.
    router.refresh();
  }

  async function decline() {
    setPending("decline");
    setError(null);

    const response = await fetch(`/api/matches/${candidate.matchId}/decline`, {
      method: "POST",
    });

    setPending(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo rechazar al candidato");
      return;
    }

    // Aquí NO va router.refresh(), a diferencia de accept(). La consulta de
    // la bandeja no trae los rechazados, así que refrescar borraría la
    // tarjeta de debajo del cursor y el usuario no llegaría a leer qué pasó.
    // Se queda en pantalla confirmando, y desaparece al recargar.
    //
    // Los contadores de Inicio y Campañas cuentan los 'interested', así que
    // este rechazo los cambia — pero esas páginas son force-dynamic y se
    // recalculan al navegar a ellas, que es cuando se ven.
    setStatus("declined");
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            @{candidate.creatorUsername ?? "sin-usuario"}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink-secondary">
            {nicheLabel(candidate.creatorNiche) ?? "Sin nicho"} ·{" "}
            {formatCount(candidate.creatorFollowers)} seguidores
            {candidate.creatorEngagement !== null
              ? ` · ${candidate.creatorEngagement}% engagement`
              : ""}
          </p>
        </div>

        {/* El score no va solo por color: el número está escrito al lado. */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: matchScoreColor(candidate.matchScore) }}
            aria-hidden="true"
          />
          <span className="tabular text-sm font-bold">
            {Math.round(candidate.matchScore)}
          </span>
          <span className="text-xs text-ink-muted">/100</span>
        </div>
      </div>

      <p className="border-t border-line pt-3 text-sm text-ink-secondary">
        Se postuló a{" "}
        <span className="font-medium text-ink">{candidate.campaignTitle}</span>
      </p>

      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}

      {status === "accepted" ? (
        <p
          role="status"
          className="flex items-center justify-between text-sm font-medium text-good"
        >
          <span>Colaboración abierta</span>
          {amount !== null ? (
            <span className="tabular font-bold">{formatCOP(amount)}</span>
          ) : null}
        </p>
      ) : status === "declined" ? (
        <p role="status" className="text-sm font-medium text-ink-secondary">
          Candidato rechazado
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<X size={16} />}
            fullWidth
            disabled={pending !== null}
            onClick={decline}
          >
            {pending === "decline" ? "…" : "Rechazar"}
          </Button>
          <Button
            size="sm"
            icon={<Handshake size={16} />}
            fullWidth
            disabled={pending !== null}
            onClick={accept}
          >
            {pending === "accept"
              ? "…"
              : candidate.campaignBudget !== null
                ? `Aceptar por ${formatCOP(candidate.campaignBudget)}`
                : "Aceptar"}
          </Button>
        </div>
      )}
    </Card>
  );
}
