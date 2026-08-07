import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Handshake } from "lucide-react";

import {
  PAYMENT_LABEL,
  StatusBadge,
} from "@/components/collaborations/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import {
  listBrandCollaborations,
  listCreatorCollaborations,
} from "@/lib/queries/collaborations";

export const metadata: Metadata = { title: "Colaboraciones" };
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

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
            ? "Candidatos aceptados. Las activas van primero."
            : "Campañas aceptadas. Las activas van primero."}
        </p>
      </header>

      {collaborations.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {collaborations.map((collab) => (
            <li key={collab.id}>
              {/* La tarjeta entera es el enlace: en el móvil, un objetivo
                  del ancho de la pantalla no se falla. */}
              <Link
                href={`/collaborations/${collab.id}`}
                className="group block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Card className="flex flex-col gap-3 transition-colors group-hover:border-line-strong">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {collab.campaignTitle}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-ink-secondary">
                        {isBrand
                          ? `@${collab.counterpartName ?? "sin-usuario"}`
                          : (collab.counterpartName ?? "Marca")}
                      </p>
                    </div>
                    <StatusBadge status={collab.status} />
                  </div>

                  {collab.deliverablesTotal > 0 ? (
                    <p className="tabular text-sm text-ink-secondary">
                      {collab.deliverablesDone} de {collab.deliverablesTotal}{" "}
                      entregables
                    </p>
                  ) : collab.status === "active" ? (
                    <p className="text-sm text-ink-muted">
                      {isBrand
                        ? "Sin entregables definidos todavía"
                        : "La marca aún no ha definido los entregables"}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">
                      {PAYMENT_LABEL[collab.paymentStatus] ??
                        collab.paymentStatus}
                    </span>
                    <span className="flex items-center gap-1">
                      {collab.agreedAmount !== null ? (
                        <span className="tabular font-bold">
                          {currency.format(collab.agreedAmount)}
                        </span>
                      ) : null}
                      <ChevronRight
                        size={16}
                        className="text-ink-muted"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
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
