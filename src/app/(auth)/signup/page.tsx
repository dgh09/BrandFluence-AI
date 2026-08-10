import type { Metadata } from "next";

import { SignupForm, type UserType } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Crear cuenta" };

/**
 * La portada tiene un botón por rol y llega aquí con `?tipo=creador` o
 * `?tipo=marca`. El parámetro se lee en servidor y se pasa al formulario:
 * con `useSearchParams()` en cliente habría que envolverlo en un Suspense,
 * porque esta página se prerenderiza estática.
 *
 * Un `tipo` desconocido —o ausente— cae en creador, que es el caso mayoritario.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const initialType: UserType = tipo === "marca" ? "brand" : "creator";

  return <SignupForm initialType={initialType} />;
}
