import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { CloseActions } from "@/components/collaborations/CloseActions";
import { Deliverables } from "@/components/collaborations/Deliverables";
import { PaymentPanel } from "@/components/collaborations/PaymentPanel";
import { PerformanceMetrics } from "@/components/collaborations/PerformanceMetrics";
import {
  PAYMENT_LABEL,
  StatusBadge,
} from "@/components/collaborations/StatusBadge";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { formatCOP } from "@/lib/currency";
import { longDate } from "@/lib/dates";
import { getCollaboration } from "@/lib/queries/collaborations";

export const metadata: Metadata = { title: "Colaboración" };
export const dynamic = "force-dynamic";

export default async function CollaborationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const collaboration = await getCollaboration(session.user.id, id);

  // getCollaboration ya filtra por las dos partes: si no hay fila, o no
  // existe o no es suya. Las dos respuestas son el mismo 404, así que no se
  // puede averiguar qué colaboraciones hay probando identificadores.
  if (!collaboration) notFound();

  const isBrand = collaboration.viewerRole === "brand";
  const isActive = collaboration.status === "active";
  const pending =
    collaboration.deliverablesTotal - collaboration.deliverablesDone;

  return (
    <>
      <Link
        href="/collaborations"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Colaboraciones
      </Link>

      <header className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {collaboration.campaignTitle}
          </h1>
          <StatusBadge status={collaboration.status} />
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          {isBrand
            ? `@${collaboration.counterpartName ?? "sin-usuario"}`
            : (collaboration.counterpartName ?? "Marca")}{" "}
          · Desde el {longDate(collaboration.createdAt)}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-ink-secondary">
              Importe acordado
            </p>
            <p className="tabular mt-1 text-2xl font-bold leading-none">
              {collaboration.agreedAmount !== null
                ? formatCOP(collaboration.agreedAmount)
                : "—"}
            </p>
          </div>
          <span className="shrink-0 text-sm text-ink-secondary">
            {PAYMENT_LABEL[collaboration.paymentStatus] ??
              collaboration.paymentStatus}
          </span>
        </Card>

        {/* En una cancelada se sigue viendo lo que se declaró, pero ya no se
            declara nada nuevo. */}
        <Card>
          <PaymentPanel
            collaborationId={collaboration.id}
            initial={collaboration.payment}
            amount={collaboration.agreedAmount}
            role={collaboration.viewerRole}
            editable={collaboration.status !== "cancelled"}
          />
        </Card>

        {collaboration.campaignDescription ? (
          <Card>
            <h2 className="mb-2 font-bold">El brief</h2>
            <p className="whitespace-pre-line text-sm text-ink-secondary">
              {collaboration.campaignDescription}
            </p>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-4">
          <Deliverables
            collaborationId={collaboration.id}
            initial={collaboration.deliverables}
            role={collaboration.viewerRole}
            editable={isActive}
          />

          {isActive ? (
            <CloseActions
              collaborationId={collaboration.id}
              role={collaboration.viewerRole}
              pendingDeliverables={pending}
            />
          ) : null}
        </Card>

        {/* Sigue estando una vez completada: los números de un vídeo tardan
            días en estabilizarse y la marca cierra antes. Solo desaparece si
            la colaboración se canceló, donde no hay nada que medir. */}
        {collaboration.status !== "cancelled" ? (
          <Card>
            <PerformanceMetrics
              collaborationId={collaboration.id}
              initial={collaboration.metrics}
              role={collaboration.viewerRole}
              editable={collaboration.status !== "cancelled"}
            />
          </Card>
        ) : null}
      </div>
    </>
  );
}
