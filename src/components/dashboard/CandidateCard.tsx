"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCOP } from "@/lib/currency";
import { matchScoreColor } from "@/lib/design-tokens";
import type { CandidateRow } from "@/lib/queries/matches";
import { nicheLabel } from "@/lib/taxonomy";

/**
 * Candidato visto por la marca, con la acción de aceptarlo.
 *
 * Es el espejo de MatchCard: allí el creador aplica, aquí la marca acepta.
 * Misma jerarquía visual —nombre, línea de meta, score— para que las dos
 * bandejas se lean igual aunque el rol sea el contrario.
 */
export function CandidateCard({ candidate }: { candidate: CandidateRow }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(candidate.status === "accepted");
  const [amount, setAmount] = useState(candidate.agreedAmount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/matches/${candidate.matchId}/accept`, {
      method: "POST",
    });

    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo aceptar al candidato");
      return;
    }

    const data = (await response.json()) as { agreedAmount: number | null };
    setAccepted(true);
    setAmount(data.agreedAmount);
    // La colaboración recién creada cambia los contadores del dashboard y
    // la lista de /collaborations, que se calculan en el servidor.
    router.refresh();
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
            {candidate.creatorFollowers.toLocaleString("es-ES")} seguidores
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

      {accepted ? (
        <p
          role="status"
          className="flex items-center justify-between text-sm font-medium text-good"
        >
          <span>Colaboración abierta</span>
          {amount !== null ? (
            <span className="tabular font-bold">{formatCOP(amount)}</span>
          ) : null}
        </p>
      ) : (
        <Button
          size="sm"
          icon={<Handshake size={16} />}
          fullWidth
          disabled={pending}
          onClick={accept}
        >
          {pending
            ? "…"
            : candidate.campaignBudget !== null
              ? `Aceptar por ${formatCOP(candidate.campaignBudget)}`
              : "Aceptar candidato"}
        </Button>
      )}
    </Card>
  );
}
