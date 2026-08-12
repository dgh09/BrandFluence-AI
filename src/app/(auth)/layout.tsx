import Link from "next/link";

import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col px-5 py-8">
      <Link href="/" className="mb-10 inline-flex w-fit">
        <Logo size={32} />
      </Link>

      {/* Centrado vertical en móvil, con tope de ancho para escritorio */}
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        {children}
      </div>
    </main>
  );
}
