import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { matchScoreColor } from "@/lib/design-tokens";
import { listBrandCandidates } from "@/lib/queries/matches";
import { nicheLabel } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Candidatos" };
export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "brand") redirect("/matches");

  const candidates = await listBrandCandidates(session.user.id);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Candidatos</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Creadores que se han postulado a tus campañas.
        </p>
      </header>

      {candidates.length > 0 ? (
        <div className="flex flex-col gap-3">
          {candidates.map((candidate) => (
            <Card key={candidate.matchId} className="flex flex-col gap-3">
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
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users size={28} />}
          title="Aún no hay candidatos"
          description="Cuando un creador aplique a alguna de tus campañas, aparecerá aquí."
        />
      )}
    </>
  );
}
