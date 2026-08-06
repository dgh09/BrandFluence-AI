import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, Handshake, Megaphone, Send, Sparkles, Users } from "lucide-react";

import { MatchCard } from "@/components/dashboard/MatchCard";
import { Button } from "@/components/ui/Button";
import { Card, StatTile } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { auth } from "@/lib/auth";
import { getBrandDashboard, getCreatorDashboard } from "@/lib/queries/dashboard";

export const metadata: Metadata = { title: "Inicio" };

// Los datos cambian con cada match: nada que cachear.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, userType, name } = session.user;
  const firstName = name?.split(" ")[0] ?? "";

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-secondary">Hola{firstName ? `, ${firstName}` : ""}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {userType === "brand" ? "Tus campañas" : "Tus oportunidades"}
          </h1>
        </div>
        <Button size="sm" icon={<Compass size={16} />}>
          Explorar
        </Button>
      </header>

      {userType === "brand" ? (
        <BrandView userId={userId} />
      ) : (
        <CreatorView userId={userId} />
      )}
    </>
  );
}

async function CreatorView({ userId }: { userId: string }) {
  const data = await getCreatorDashboard(userId);

  if (!data) {
    return (
      <EmptyState
        icon={<Sparkles size={28} />}
        title="Completa tu perfil"
        description="Necesitamos tu nicho y tu audiencia para empezar a buscarte marcas."
        action={
          <Link href="/profile">
            <Button size="sm">Completar perfil</Button>
          </Link>
        }
      />
    );
  }

  const best = data.topMatches[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Número protagonista: el mejor match. Una sola magnitud, sin ejes. */}
      {best ? (
        <Card className="flex flex-col items-center gap-3 py-6">
          <ScoreRing score={best.matchScore} caption="Tu mejor match" />
          <div className="text-center">
            <p className="font-semibold">{best.campaignTitle}</p>
            <p className="text-sm text-ink-secondary">{best.brandName}</p>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Matches nuevos"
          value={data.newMatches}
          icon={<Sparkles size={16} />}
        />
        <StatTile
          label="Aplicaciones"
          value={data.applications}
          icon={<Send size={16} />}
        />
      </div>

      <StatTile
        label="Colaboraciones activas"
        value={data.activeCollaborations}
        icon={<Handshake size={16} />}
        hint={
          data.niche
            ? `Nicho: ${data.niche} · ${data.followerCount.toLocaleString("es-ES")} seguidores`
            : "Añade tu nicho para mejorar el matching"
        }
      />

      <section>
        <h2 className="mt-2 mb-3 text-lg font-bold tracking-tight">
          Campañas para ti
        </h2>

        {data.topMatches.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.topMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles size={28} />}
            title="Aún no hay matches"
            description="En cuanto una marca publique una campaña de tu nicho, aparecerá aquí."
          />
        )}
      </section>
    </div>
  );
}

async function BrandView({ userId }: { userId: string }) {
  const data = await getBrandDashboard(userId);

  if (!data) {
    return (
      <EmptyState
        icon={<Megaphone size={28} />}
        title="Completa el perfil de tu marca"
        description="Con tu sector y presupuesto podemos sugerirte los creadores adecuados."
        action={
          <Link href="/profile">
            <Button size="sm">Completar perfil</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Campañas activas"
          value={data.activeCampaigns}
          icon={<Megaphone size={16} />}
        />
        <StatTile
          label="Candidatos"
          value={data.candidates}
          icon={<Users size={16} />}
        />
      </div>

      <StatTile
        label="Presupuesto en campañas activas"
        value={currency.format(data.totalBudget)}
        hint={data.industry ? `Sector: ${data.industry}` : undefined}
      />

      <section>
        <h2 className="mt-2 mb-3 text-lg font-bold tracking-tight">
          Tus campañas
        </h2>

        {data.campaigns.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.campaigns.map((campaign) => (
              <Card key={campaign.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{campaign.title}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {campaign.candidates} candidato
                    {campaign.candidates === 1 ? "" : "s"}
                    {campaign.budget !== null
                      ? ` · ${currency.format(campaign.budget)}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-secondary">
                  {campaign.status}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="Aún no tienes campañas"
            description="Crea tu primera campaña y empezaremos a buscarte creadores."
            action={
              <Link href="/campaigns">
                <Button size="sm">Crear campaña</Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
