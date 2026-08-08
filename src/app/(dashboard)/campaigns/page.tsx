import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";

import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { formatCOP } from "@/lib/currency";
import { listBrandCampaigns } from "@/lib/queries/campaigns";
import { nicheLabel } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Campañas" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "brand") redirect("/matches");

  const campaigns = await listBrandCampaigns(session.user.id);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Tus campañas</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Publica una campaña y te buscamos creadores de ese nicho.
        </p>
      </header>

      <div className="mb-5">
        <CampaignForm />
      </div>

      {campaigns.length > 0 ? (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{campaign.title}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {nicheLabel(campaign.targetNiche) ?? "Sin nicho"}
                    {campaign.minFollowers > 0
                      ? ` · desde ${campaign.minFollowers.toLocaleString("es-ES")} seguidores`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-secondary">
                  {campaign.status}
                </span>
              </div>

              {campaign.description ? (
                <p className="line-clamp-2 text-sm text-ink-secondary">
                  {campaign.description}
                </p>
              ) : null}

              <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-ink-secondary">
                  {campaign.candidates} candidato
                  {campaign.candidates === 1 ? "" : "s"}
                </span>
                {campaign.budget !== null ? (
                  <span className="tabular font-bold">
                    {formatCOP(campaign.budget)}
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Megaphone size={28} />}
          title="Aún no tienes campañas"
          description="Crea la primera con el botón de arriba."
        />
      )}
    </>
  );
}
