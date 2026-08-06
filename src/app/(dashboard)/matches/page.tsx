import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { MatchCard } from "@/components/dashboard/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { listCreatorMatches, type MatchStatus } from "@/lib/queries/matches";

export const metadata: Metadata = { title: "Matches" };
export const dynamic = "force-dynamic";

const FILTERS: { value: MatchStatus | "all"; label: string }[] = [
  { value: "suggested", label: "Sugeridas" },
  { value: "interested", label: "Aplicadas" },
  { value: "rejected", label: "Descartadas" },
  { value: "all", label: "Todas" },
];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType === "brand") redirect("/campaigns");

  const { estado } = await searchParams;
  const active = FILTERS.some((f) => f.value === estado)
    ? (estado as MatchStatus | "all")
    : "suggested";

  const matches = await listCreatorMatches(session.user.id, active);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Tus matches</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Campañas ordenadas por compatibilidad con tu perfil.
        </p>
      </header>

      {/* Filtros en una sola fila por encima del listado */}
      <nav aria-label="Filtrar por estado" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => {
          const selected = filter.value === active;
          return (
            <Link
              key={filter.value}
              href={`/matches?estado=${filter.value}`}
              aria-current={selected ? "true" : undefined}
              className={[
                "shrink-0 rounded-pill px-4 py-2 text-sm font-semibold transition-colors",
                selected
                  ? "bg-accent text-accent-ink"
                  : "bg-surface-2 text-ink-secondary hover:bg-surface-3",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {matches.length > 0 ? (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Nada por aquí"
          description={
            active === "suggested"
              ? "Cuando una marca publique una campaña de tu nicho, aparecerá aquí."
              : "No tienes campañas en este estado."
          }
        />
      )}
    </>
  );
}
