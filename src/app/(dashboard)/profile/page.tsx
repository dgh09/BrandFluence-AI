import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandProfileForm } from "@/components/profile/BrandProfileForm";
import { CreatorProfileForm } from "@/components/profile/CreatorProfileForm";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { getBrandProfile, getCreatorProfile } from "@/lib/queries/profile";

export const metadata: Metadata = { title: "Tu perfil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isBrand = session.user.userType === "brand";

  // Cada rama resuelve su propio tipo. Un ternario sobre las dos consultas
  // daría una unión que TypeScript no puede estrechar con `isBrand`.
  const form = isBrand ? (
    await getBrandProfile(session.user.id).then((profile) =>
      profile ? <BrandProfileForm profile={profile} /> : null,
    )
  ) : (
    await getCreatorProfile(session.user.id).then((profile) =>
      profile ? <CreatorProfileForm profile={profile} /> : null,
    )
  );

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Tu perfil</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {isBrand
            ? "Cuanto mejor definido esté, mejores creadores te sugerimos."
            : "Cuanto mejor definido esté, mejores campañas te encontramos."}
        </p>
      </header>

      {form ?? (
        // Pasa si la cuenta se creó con Google: hay `users` pero no la fila
        // de perfil que sí crea /api/auth/signup.
        <EmptyState
          title="Falta tu perfil"
          description="Tu cuenta existe pero aún no tiene perfil asociado. Vuelve a entrar o contáctanos."
        />
      )}

      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-3 text-sm text-ink-secondary">
          Sesión iniciada como{" "}
          <span className="font-medium text-ink">{session.user.email}</span>
        </p>
        <SignOutButton />
      </div>
    </>
  );
}
