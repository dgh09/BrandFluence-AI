"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { ViewerRole } from "@/lib/queries/collaborations";

interface Props {
  collaborationId: string;
  role: ViewerRole;
  pendingDeliverables: number;
}

/**
 * Cerrar la colaboración. Los dos estados son terminales, así que cancelar
 * pide confirmación: es la única acción de la app de la que no se vuelve.
 *
 * La marca puede completar o cancelar; el creador solo cancelar. Dar por
 * buena la colaboración es aceptar el trabajo, y eso le toca a quien lo
 * encargó. El servidor lo impone igualmente.
 */
export function CloseActions({
  collaborationId,
  role,
  pendingDeliverables,
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<null | "completed" | "cancelled">(null);
  const [error, setError] = useState<string | null>(null);

  async function close(status: "completed" | "cancelled") {
    setPending(status);
    setError(null);

    const response = await fetch(`/api/collaborations/${collaborationId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setPending(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo cerrar la colaboración");
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4">
      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <>
          <p className="text-sm text-ink-secondary">
            Cancelar cierra la colaboración para las dos partes y no se puede
            deshacer.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              disabled={pending !== null}
              onClick={() => setConfirming(false)}
            >
              Volver
            </Button>
            <Button
              size="sm"
              fullWidth
              disabled={pending !== null}
              onClick={() => close("cancelled")}
            >
              {pending === "cancelled" ? "…" : "Sí, cancelar"}
            </Button>
          </div>
        </>
      ) : (
        <>
          {role === "brand" && pendingDeliverables > 0 ? (
            <p className="text-sm text-ink-secondary">
              Quedan {pendingDeliverables}{" "}
              {pendingDeliverables === 1 ? "entregable" : "entregables"} sin
              entregar. Puedes completarla igualmente.
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Ban size={16} />}
              fullWidth
              disabled={pending !== null}
              onClick={() => setConfirming(true)}
            >
              Cancelar
            </Button>

            {role === "brand" ? (
              <Button
                size="sm"
                icon={<BadgeCheck size={16} />}
                fullWidth
                disabled={pending !== null}
                onClick={() => close("completed")}
              >
                {pending === "completed" ? "…" : "Completar"}
              </Button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
