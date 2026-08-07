import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import {
  listBrandCollaborations,
  listCreatorCollaborations,
} from "@/lib/queries/matches";

export const metadata: Metadata = { title: "Colaboraciones" };
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-good/15 text-good" },
  completed: { label: "Completada", className: "bg-surface-3 text-ink-secondary" },
  cancelled: { label: "Cancelada", className: "bg-critical/15 text-critical" },
};

const PAYMENT: Record<string, string> = {
  pending: "Pago pendiente",
  processing: "Pago en curso",
  completed: "Pagada",
};

export default async function CollaborationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Las dos partes ven la misma pantalla; solo cambia quién es la
  // contraparte: la marca para el creador, el creador para la marca.
  const isBrand = session.user.userType === "brand";
  const collaborations = isBrand
    ? await listBrandCollaborations(session.user.id)
    : await listCreatorCollaborations(session.user.id);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Tus colaboraciones
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {isBrand
            ? "Candidatos aceptados y su estado de pago."
            : "Campañas aceptadas y su estado de pago."}
        </p>
      </header>

      {collaborations.length > 0 ? (
        <div className="flex flex-col gap-3">
          {collaborations.map((collab) => {
            const status = STATUS[collab.status] ?? {
              label: collab.status,
              className: "bg-surface-3 text-ink-secondary",
            };
            return (
              <Card key={collab.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{collab.campaignTitle}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-secondary">
                      {isBrand
                        ? `@${collab.counterpartName ?? "sin-usuario"}`
                        : (collab.counterpartName ?? "Marca")}
                    </p>
                  </div>
                  {/* Estado con texto, nunca solo color */}
                  <span
                    className={[
                      "shrink-0 rounded-pill px-3 py-1 text-xs font-semibold",
                      status.className,
                    ].join(" ")}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">
                    {PAYMENT[collab.paymentStatus] ?? collab.paymentStatus}
                  </span>
                  {collab.agreedAmount !== null ? (
                    <span className="tabular font-bold">
                      {currency.format(collab.agreedAmount)}
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Handshake size={28} />}
          title="Aún no hay colaboraciones"
          description={
            isBrand
              ? "Cuando aceptes a un candidato, la colaboración aparecerá aquí."
              : "Cuando una marca acepte tu candidatura, la colaboración aparecerá aquí."
          }
        />
      )}
    </>
  );
}
