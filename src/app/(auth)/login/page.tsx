import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  // LoginForm lee ?callbackUrl con useSearchParams(), que obliga a un límite
  // de Suspense para que Next pueda prerenderizar el resto de la página.
  return (
    <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
      <LoginForm />
    </Suspense>
  );
}
