import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col px-5 py-8">
      <Link
        href="/"
        className="mb-10 inline-flex w-fit items-center gap-2 text-lg font-extrabold tracking-tight"
      >
        <span
          className="grid size-8 place-items-center rounded-chip bg-accent text-accent-ink"
          aria-hidden="true"
        >
          B
        </span>
        BrandFluence
      </Link>

      {/* Centrado vertical en móvil, con tope de ancho para escritorio */}
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        {children}
      </div>
    </main>
  );
}
