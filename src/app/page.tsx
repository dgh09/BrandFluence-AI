import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { MatchPreview } from "@/components/landing/MatchPreview";
import { Reveal } from "@/components/landing/Reveal";

export const metadata: Metadata = {
  // El layout raíz añade el sufijo « · BrandFluence AI» a los demás títulos;
  // en la portada sobra repetirlo.
  title: "BrandFluence AI · Creadores y marcas, emparejados por afinidad real",
  description:
    "BrandFluence AI puntúa cada pareja creador–campaña del 0 al 100 y explica por qué. Matching con IA para campañas UGC en Colombia.",
};

// Lee la sesión para decidir el botón principal, así que no se puede
// prerenderizar estática.
export const dynamic = "force-dynamic";

/** Los cuatro componentes del score, tal como los reparte `matching.ts`. */
const COMPONENTS = [
  { label: "Nicho", points: 40, detail: "Coincidencia exacta 40 · nicho afín 24" },
  { label: "Audiencia", points: 25, detail: "Cuánto supera el mínimo, con rendimientos decrecientes" },
  { label: "Engagement", points: 25, detail: "Puntuación completa a partir del 6%" },
  { label: "Confianza", points: 10, detail: "Verificado · bio completa · sin señales de fraude" },
];

const DIFFERENTIATORS = [
  {
    title: "La audiencia satura a 10× el mínimo",
    body: "Pasar de 10× a 100× no convierte a nadie en un candidato diez veces mejor, y los micro-influencers suelen convertir mejor. Sin ese tope, el algoritmo solo recomendaría cuentas enormes.",
  },
  {
    title: "Existen los nichos afines",
    body: "Una creadora de fitness ve campañas de salud puntuadas a 24 sobre 40, en vez de no verlas nunca. El mapa de afinidades se simetriza solo, así que no puede quedar desparejado.",
  },
  {
    title: "«Sin datos» no es «engagement 0»",
    body: "Quien todavía no ha rellenado el campo recibe una puntuación baja, pero no nula. Quien tiene un 0% real recibe cero. Confundirlos castigaría a los usuarios nuevos.",
  },
];

const pill =
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Tarjeta con elevación al pasar por encima. El borde es lo que reacciona:
    mover la tarjeta entera en una rejilla de cuatro es ruido. */
const card =
  "rounded-tile border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative overflow-hidden">
      {/* Resplandor de acento detrás del hero. Una sola vez en toda la página:
          repetirlo por sección lo convertiría en fondo y dejaría de dirigir la
          mirada a ningún sitio. */}
      {/* Sin z-index negativo: `body` pinta su fondo por encima de cualquier
          hijo con z menor que 0, y el resplandor desaparecía. Va primero en el
          DOM y el contenido va en un envoltorio posicionado, que es lo que lo
          deja delante. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[540px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-20 blur-[130px]"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-accent), transparent)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-10 sm:py-16">
        <header className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span
              className="grid size-8 place-items-center rounded-chip bg-accent text-accent-ink"
              aria-hidden="true"
            >
              B
            </span>
            BrandFluence
          </span>

          {session?.user ? (
            <Link href="/dashboard" className={`${pill} h-9 bg-surface-2 px-4 text-sm text-ink hover:bg-surface-3`}>
              Ir al panel
            </Link>
          ) : (
            <Link
              href="/login"
              className={`${pill} h-9 px-4 text-sm text-ink-secondary hover:text-ink`}
            >
              Entrar
            </Link>
          )}
        </header>

        {/* ---------------------------------------------------------------- */}
        <section className="grid items-center gap-12 pt-16 pb-14 sm:pt-20 sm:pb-20 lg:grid-cols-[1.05fr_auto] lg:gap-16">
          <div>
            <Reveal>
              <p className="text-sm font-semibold text-accent">
                Campañas UGC en Colombia
              </p>

              <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
                Creadores y marcas, emparejados por afinidad real
              </h1>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-5 max-w-xl text-lg leading-8 text-ink-secondary">
                El 95% de los creadores nunca encuentra marcas con las que
                colaborar. No por falta de audiencia: porque no existe un sitio
                donde una marca busque «creadora de fitness con más de 20.000
                seguidores y buen engagement» y obtenga una lista ordenada.
              </p>

              <p className="mt-4 max-w-xl text-lg leading-8 text-ink-secondary">
                BrandFluence puntúa cada pareja creador–campaña{" "}
                <strong className="font-semibold text-ink">
                  del 0 al 100 y explica por qué
                </strong>
                .
              </p>
            </Reveal>

            {!session?.user ? (
              <Reveal delay={0.16}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/signup?tipo=creador"
                    className={`${pill} h-13 bg-accent px-7 text-base text-accent-ink hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]`}
                  >
                    <Sparkles size={18} aria-hidden="true" />
                    Soy creador
                  </Link>
                  <Link
                    href="/signup?tipo=marca"
                    className={`${pill} h-13 border border-line-strong bg-surface-2 px-7 text-base text-ink hover:bg-surface-3 active:scale-[0.98]`}
                  >
                    <Megaphone size={18} aria-hidden="true" />
                    Soy una marca
                  </Link>
                </div>
              </Reveal>
            ) : null}
          </div>

          {/* En móvil va debajo del texto y a ancho completo; en escritorio
              ocupa la columna derecha con ancho fijo, para que el anillo no
              crezca hasta parecer un gráfico. */}
          <Reveal delay={0.24}>
            <div className="lg:w-[340px]">
              <MatchPreview />
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-line py-14 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              Una puntuación que se puede discutir
            </h2>
            <p className="mt-3 max-w-2xl text-ink-secondary">
              Nada de una caja negra que dice «96% de compatibilidad». El score
              se reparte en cuatro componentes, y cada match enseña su desglose.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {COMPONENTS.map((c, i) => (
              <Reveal key={c.label} delay={i * 0.06}>
                <div className={card}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{c.label}</h3>
                    <span className="tabular text-2xl font-extrabold">
                      {c.points}
                      <span className="text-sm font-semibold text-ink-muted">
                        {" "}
                        pts
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {c.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Los filtros duros no son una penalización más, así que no van en
              la rejilla de puntos: si no se cumplen, el match no existe. */}
          <Reveal delay={0.1}>
            <div className="mt-3 rounded-tile border border-dashed border-line-strong bg-surface/50 p-5">
              <h3 className="font-bold">Y cuando no encaja, no hay match</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
                Nicho sin relación, audiencia por debajo del mínimo o señales de
                fraude no restan puntos:{" "}
                <strong className="font-semibold text-ink">
                  impiden que la pareja llegue a existir
                </strong>
                . Una campaña de moda con mínimo de 50.000 seguidores
                sencillamente no le aparece a Lucía, en vez de aparecerle con
                una nota baja.
              </p>
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-line py-14 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              Tres decisiones que lo diferencian
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.08}>
                <div className={`${card} h-full`}>
                  <h3 className="font-bold leading-snug">{d.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {d.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-line py-14 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              El dinero no pasa por aquí
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-ink-secondary">
              La marca paga al creador por fuera, como ya lo hacen hoy.
              BrandFluence solo anota lo que declara cada parte: la marca dice
              que pagó, el creador confirma que lo recibió. No retenemos, no
              transferimos y no cobramos comisión. Los importes van en pesos
              colombianos.
            </p>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------- */}
        {!session?.user ? (
          <section className="border-t border-line py-14 sm:py-20">
            <Reveal>
              <div className="relative overflow-hidden rounded-card border border-line bg-surface p-8 sm:p-10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-25 blur-[90px]"
                  style={{
                    background:
                      "radial-gradient(closest-side, var(--color-accent), transparent)",
                  }}
                />
                <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                  Crea tu perfil y mira qué sale
                </h2>
                <p className="mt-3 max-w-xl text-ink-secondary">
                  El matching se calcula en cuanto tengas nicho y audiencia. Sin
                  tarjeta, sin permanencia.
                </p>
                <Link
                  href="/signup"
                  className={`${pill} mt-7 h-13 bg-accent px-7 text-base text-accent-ink hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]`}
                >
                  Empezar
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </section>
        ) : null}

        {/* Honestidad sobre el estado: el repositorio es público y el README
            dice lo mismo. Prometer una plataforma consolidada sería mentir. */}
        <footer className="border-t border-line py-8 text-sm text-ink-muted">
          <p>
            MVP en desarrollo activo. Construido en público por{" "}
            <a
              href="https://github.com/dgh09/BrandFluence-AI"
              className="font-medium text-ink-secondary underline underline-offset-4 hover:text-ink"
            >
              @dgh09
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
