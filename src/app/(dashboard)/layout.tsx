import { redirect } from "next/navigation";

import { AppNav } from "@/components/shared/AppNav";
import { auth } from "@/lib/auth";
import { countUnread } from "@/lib/queries/notifications";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  // Guard de sesión. Todo lo que cuelgue de (dashboard) queda protegido.
  if (!session?.user) {
    redirect("/login");
  }

  // Alta por Google: existe el usuario pero aún no ha elegido si es creador
  // o marca, así que no tiene perfil ni navegación que mostrar.
  if (!session.user.userType) {
    redirect("/onboarding");
  }

  // Una consulta más por carga de página, contra un índice parcial que solo
  // cubre las no leídas. Vive en el layout porque la campana sale en todas
  // las pantallas del panel.
  const unreadCount = await countUnread(session.user.id);

  return (
    <div className="min-h-dvh md:pl-60">
      <AppNav userType={session.user.userType} unreadCount={unreadCount} />
      {/* pb-24 en móvil deja hueco para la tab bar fija */}
      <main className="mx-auto w-full max-w-3xl px-5 pt-6 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  );
}
