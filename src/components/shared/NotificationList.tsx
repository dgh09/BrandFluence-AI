"use client";

import { useState } from "react";
import Link from "next/link";

import type { NotificationRow } from "@/lib/queries/notifications";

/**
 * La lista de avisos, con el resaltado de «sin leer» CONGELADO.
 *
 * Entrar aquí marca los avisos como leídos, y además dispara un refresco
 * para que la campana se entere (ver RefreshOnce). Ese refresco vuelve a
 * pedir la lista al servidor, que ya la devuelve entera como leída: sin
 * esto, el resaltado de lo nuevo aparecía y se borraba solo, justo en la
 * pantalla que existe para verlo.
 *
 * `useState` con inicializador se ejecuta **una sola vez**, y
 * `router.refresh()` conserva el estado de los componentes de cliente. Así
 * que lo que estaba sin leer al abrir sigue marcado hasta que te vas, que es
 * lo que espera quien lo está leyendo.
 *
 * Las fechas vienen ya formateadas del servidor: calcular «hace 5 min» aquí
 * daría un texto distinto al del servidor si entre medias cambia el minuto,
 * y React tiraría el HTML para volver a pintarlo.
 */
export function NotificationList({
  notifications,
}: {
  notifications: (NotificationRow & { ago: string })[];
}) {
  const [unreadAtOpen] = useState(
    () => new Set(notifications.filter((n) => n.readAt === null).map((n) => n.id)),
  );

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((n) => {
        const unread = unreadAtOpen.has(n.id);

        const card = (
          <article
            className={[
              "rounded-tile border p-4 transition-colors",
              unread ? "border-accent/30 bg-surface-2" : "border-line bg-surface",
              n.href ? "hover:border-accent/60" : "",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">
                {/* El punto no es el único indicador: las no leídas van
                    además sobre otro fondo y con borde de acento. */}
                {unread ? (
                  <span
                    className="mr-2 inline-block size-2 rounded-full bg-accent align-middle"
                    aria-hidden="true"
                  />
                ) : null}
                {n.title}
                {unread ? <span className="sr-only"> (sin leer)</span> : null}
              </p>
              <time
                dateTime={n.createdAt}
                className="shrink-0 text-xs text-ink-muted"
              >
                {n.ago}
              </time>
            </div>

            {n.body ? (
              <p className="mt-1 text-sm text-ink-secondary">{n.body}</p>
            ) : null}
          </article>
        );

        return (
          <li key={n.id}>
            {n.href ? (
              <Link href={n.href} className="block">
                {card}
              </Link>
            ) : (
              card
            )}
          </li>
        );
      })}
    </ul>
  );
}
