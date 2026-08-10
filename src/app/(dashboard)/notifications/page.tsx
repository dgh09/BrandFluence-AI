import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationList } from "@/components/shared/NotificationList";
import { RefreshOnce } from "@/components/shared/RefreshOnce";
import { auth } from "@/lib/auth";
import { listNotifications, markAllRead } from "@/lib/queries/notifications";
import { relativeTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // El orden importa: primero se leen, y DESPUÉS se marcan. Al revés, la
  // lista saldría entera como leída y no se distinguiría lo nuevo justo en
  // la pantalla que existe para eso.
  const notifications = await listNotifications(session.user.id);
  const justRead = await markAllRead(session.user.id);

  // Las fechas se formatean aquí, en el servidor. Hacerlo en el cliente daría
  // un texto distinto si entre el render y la hidratación cambia el minuto.
  const withAgo = notifications.map((n) => ({ ...n, ago: relativeTime(n.createdAt) }));

  return (
    <>
      {/* El contador de la campana lo calcula el layout, y un layout no se
          vuelve a renderizar al navegar por cliente. Sin este refresco, la
          insignia se quedaría clavada en el número que tenía al entrar. */}
      {justRead > 0 ? <RefreshOnce /> : null}

      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Avisos</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Lo que ha hecho la otra parte en tus campañas y colaboraciones.
        </p>
      </header>

      {withAgo.length > 0 ? (
        <NotificationList notifications={withAgo} />
      ) : (
        <EmptyState
          icon={<Bell size={28} />}
          title="Nada que contarte todavía"
          description="Aquí aparecerán los avisos cuando alguien mueva una candidatura, un entregable o un pago."
        />
      )}
    </>
  );
}
