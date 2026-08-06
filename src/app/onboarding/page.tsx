import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Bienvenido" };
export const dynamic = "force-dynamic";

/**
 * Fuera del grupo (dashboard) a propósito: ese layout redirige aquí cuando
 * falta el tipo de usuario, así que si esta página viviera dentro sería un
 * bucle de redirecciones.
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Una cosa más
      </h1>
      <p className="mt-2 text-sm text-ink-secondary">
        Dinos qué eres para preparar tu espacio. No se puede cambiar después.
      </p>
      <OnboardingForm />
    </main>
  );
}
