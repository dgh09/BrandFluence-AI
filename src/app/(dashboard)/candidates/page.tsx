import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { CandidateCard } from "@/components/dashboard/CandidateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { listBrandCandidates } from "@/lib/queries/matches";

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
          Creadores que se han postulado a tus campañas. Los pendientes van
          primero.
        </p>
      </header>

      {candidates.length > 0 ? (
        <div className="flex flex-col gap-3">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.matchId} candidate={candidate} />
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
