import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { matchScoreColor } from "@/lib/design-tokens";

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

/**
 * El ejemplo real del README, con las cifras que devuelve el algoritmo para
 * el perfil de demo. No son números decorativos: salen de `scoreMatch`.
 */
const EXAMPLE = [
  { campaign: "Lanzamiento proteína vegana", meta: "fitness · mín. 10k", score: 89 },
  { campaign: "Reto 30 días en casa", meta: "fitness · mín. 20k", score: 86 },
  { campaign: "Suplementos bienestar", meta: "salud · mín. 5k", score: 76 },
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
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default async function Home() {
  const session = await auth();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-16">
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
          <Link href="/dashboard" className={`${pill} h-9 bg-surface-2 px-4 text-sm text-ink`}>
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
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="text-sm font-semibold text-accent">Campañas UGC en Colombia</p>

        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Creadores y marcas,
          <br />
          emparejados por afinidad real
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-ink-secondary">
          El 95% de los creadores nunca encuentra marcas con las que colaborar.
          No por falta de audiencia: porque no existe un sitio donde una marca
          busque «creadora de fitness con más de 20.000 seguidores y buen
          engagement» y obtenga una lista ordenada.
        </p>

        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-secondary">
          BrandFluence puntúa cada pareja creador–campaña{" "}
          <strong className="font-semibold text-ink">del 0 al 100 y explica por qué</strong>.
        </p>

        {!session?.user ? (
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup?tipo=creador"
              className={`${pill} h-13 bg-accent px-7 text-base text-accent-ink hover:bg-accent-hover`}
            >
              <Sparkles size={18} aria-hidden="true" />
              Soy creador
            </Link>
            <Link
              href="/signup?tipo=marca"
              className={`${pill} h-13 border border-line-strong bg-surface-2 px-7 text-base text-ink hover:bg-surface-3`}
            >
              <Megaphone size={18} aria-hidden="true" />
              Soy una marca
            </Link>
          </div>
        ) : null}
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-line py-14 sm:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Una puntuación que se puede discutir
        </h2>
        <p className="mt-3 max-w-2xl text-ink-secondary">
          Nada de una caja negra que dice «96% de compatibilidad». El score se
          reparte en cuatro componentes, y cada match enseña su desglose.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {COMPONENTS.map((c) => (
            <div key={c.label} className="rounded-tile border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-bold">{c.label}</h3>
                <span className="tabular text-2xl font-extrabold">
                  {c.points}
                  <span className="text-sm font-semibold text-ink-muted"> pts</span>
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">{c.detail}</p>
            </div>
          ))}
        </div>

        {/* Ejemplo con cifras reales del algoritmo, no maquetadas a ojo. */}
        <div className="mt-8 rounded-tile border border-line bg-surface p-5">
          <p className="text-sm text-ink-secondary">
            Lucía · fitness · 48.200 seguidores · 5,4% de engagement
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {EXAMPLE.map((row) => (
              <li
                key={row.campaign}
                className="flex items-center justify-between gap-4 border-t border-line pt-3 first:border-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.campaign}</p>
                  <p className="truncate text-sm text-ink-muted">{row.meta}</p>
                </div>
                {/* El score no va solo por color: el número está al lado. */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: matchScoreColor(row.score) }}
                    aria-hidden="true"
                  />
                  <span className="tabular font-bold">{row.score}</span>
                  <span className="text-xs text-ink-muted">/100</span>
                </div>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 border-t border-line pt-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-muted">
                  Colección ropa técnica
                </p>
                <p className="truncate text-sm text-ink-muted">moda · mín. 50k</p>
              </div>
              <span className="shrink-0 text-sm text-ink-muted">sin match</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-line py-14 sm:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Tres decisiones que lo diferencian
        </h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} className="rounded-tile border border-line bg-surface p-5">
              <h3 className="font-bold leading-snug">{d.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-line py-14 sm:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          El dinero no pasa por aquí
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-ink-secondary">
          La marca paga al creador por fuera, como ya lo hacen hoy. BrandFluence
          solo anota lo que declara cada parte: la marca dice que pagó, el
          creador confirma que lo recibió. No retenemos, no transferimos y no
          cobramos comisión. Los importes van en pesos colombianos.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {!session?.user ? (
        <section className="border-t border-line py-14 sm:py-20">
          <div className="rounded-card border border-line bg-surface p-8 sm:p-10">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Crea tu perfil y mira qué sale
            </h2>
            <p className="mt-3 max-w-xl text-ink-secondary">
              El matching se calcula en cuanto tengas nicho y audiencia. Sin
              tarjeta, sin permanencia.
            </p>
            <Link
              href="/signup"
              className={`${pill} mt-7 h-13 bg-accent px-7 text-base text-accent-ink hover:bg-accent-hover`}
            >
              Empezar
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
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
  );
}
