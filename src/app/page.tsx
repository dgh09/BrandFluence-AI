import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { Logo } from "@/components/shared/Logo";
import { Marquee } from "@/components/landing/Marquee";
import { Paper } from "@/components/landing/Paper";
import { Reveal } from "@/components/landing/Reveal";
import { ScoreSheet, type ScoreLine } from "@/components/landing/ScoreSheet";
import { SwipeDeck, type SwipeCard } from "@/components/landing/SwipeDeck";
import { TornDefs } from "@/components/landing/TornDefs";
import { formatScore } from "@/lib/numbers";

export const metadata: Metadata = {
  // El layout raíz añade el sufijo « · BrandFluence AI» a los demás títulos;
  // en la portada sobra repetirlo.
  title: "BrandFluence AI · Cada match, con su porqué",
  description:
    "BrandFluence AI puntúa cada pareja creador–campaña del 0 al 100 y explica por qué. Matching con IA para campañas UGC en Colombia.",
};

// Lee la sesión para decidir el botón principal, así que no se puede
// prerenderizar estática.
export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Todas las cifras de esta página salen de ejecutar `scoreMatch`, no están
   puestas a ojo, y `matching.test.ts` las fija: si el algoritmo cambia y estos
   números no, el build rompe en vez de dejar la portada mintiendo.
   --------------------------------------------------------------------------- */

/** Lucía contra «Lanzamiento proteína vegana». El desglose exacto. */
const LUCIA_DESGLOSE: ScoreLine[] = [
  { label: "nicho", value: 40, max: 40 },
  { label: "audiencia", value: 21.83, max: 25 },
  { label: "engagement", value: 22.5, max: 25 },
  { label: "confianza", value: 5, max: 10 },
];

/** El reparto de los 100 puntos, tal como lo declara `WEIGHTS`. */
const RUBRICA = [
  {
    puntos: 40,
    componente: "nicho",
    criterio: "Coincidencia exacta 40 · nicho afín 24",
  },
  {
    puntos: 25,
    componente: "audiencia",
    criterio: "Cuánto supera el mínimo exigido, con rendimientos decrecientes",
  },
  {
    puntos: 25,
    componente: "engagement",
    criterio: "Puntuación completa a partir del 6%",
  },
  {
    puntos: 10,
    componente: "confianza",
    criterio: "Verificado · bio completa · sin señales de fraude",
  },
];

/** La bandeja de Lucía. La cuarta no tiene nota porque no llega a existir. */
const BANDEJA = [
  { campana: "Lanzamiento proteína vegana", meta: "fitness · mín. 10.000", score: 89.33 },
  { campana: "Reto 30 días en casa", meta: "fitness · mín. 20.000", score: 86.32 },
  { campana: "Suplementos bienestar", meta: "salud · mín. 5.000", score: 76.34 },
];

/** Candidatos a «proteína vegana» vistos desde la marca. */
const CANDIDATOS: SwipeCard[] = [
  { name: "Lucía", niche: "fitness", followers: "48.200", score: 89.33, action: "connect" },
  { name: "Andrés", niche: "salud", followers: "21.700", score: 77.36, action: "connect" },
  {
    // Sin nombre propio: es nicho afín, no exacto, y el ejemplo va de la nota.
    name: "Creadora de lifestyle",
    niche: "lifestyle",
    followers: "12.400",
    score: 46.93,
    action: "pass",
  },
];

const DECISIONES = [
  {
    titulo: "la audiencia satura a 10× el mínimo",
    cuerpo:
      "Pasar de 10× a 100× no convierte a nadie en un candidato diez veces mejor, y los micro-influencers suelen convertir mejor. Sin ese tope, el algoritmo solo recomendaría cuentas enormes.",
  },
  {
    titulo: "existen los nichos afines",
    cuerpo:
      "Una creadora de fitness ve campañas de salud puntuadas a 24 sobre 40, en vez de no verlas nunca. El mapa de afinidades se simetriza solo, así que no puede quedar desparejado.",
  },
  {
    titulo: "«sin datos» no es «engagement 0»",
    cuerpo:
      "Quien todavía no ha rellenado el campo recibe una puntuación baja, pero no nula. Quien tiene un 0% real recibe cero. Confundirlos castigaría a los usuarios nuevos.",
  },
];

/* --- Clases compartidas ---------------------------------------------------
   Radio cero en toda la página: el papel se corta, no se redondea. */

const cta =
  "inline-flex h-12 items-center justify-center px-7 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px";

/** Tinta oscura sobre el coral, no blanca: blanco sobre #FF3B4F se queda en
    3,3:1 y el rótulo de un botón no es texto grande. */
const ctaPrimario = `${cta} display bg-accent text-print hover:bg-accent-hover`;
const ctaSecundario = `${cta} display border-2 border-paper text-paper hover:bg-paper hover:text-print`;

const h2 = "display text-h2 text-paper";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative">
      <TornDefs />

      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          {/* Sin `tagline`: el eslogan es ahora el titular, y repetirlo dos
              veces en la misma pantalla lo devalúa. */}
          <Logo size={32} />

          <Link
            href={session?.user ? "/dashboard" : "/login"}
            className="utility shrink-0 border-2 border-paper px-4 py-2.5 text-[0.6875rem] text-paper transition-colors hover:bg-paper hover:text-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {session?.user ? "ir al panel" : "entrar"}
          </Link>
        </header>

        {/* --- Hero: el texto al peso, la ficha como evidencia ------------- */}
        {/* `pt-10` en móvil y no más: con el titular a dos líneas y el párrafo
            debajo, cualquier respiro extra empuja los botones fuera de la
            primera pantalla de un teléfono pequeño. */}
        <section className="grid items-center gap-12 pt-10 pb-14 sm:pt-20 sm:pb-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <Reveal>
              <p className="utility text-[0.6875rem] text-accent">
                campañas ugc en colombia
              </p>

              <h1 className="display mt-5 text-display text-paper">
                cada match,
                <br />
                con su porqué
              </h1>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="body-copy mt-6 max-w-lg text-lg text-paper-2">
                Puntuamos cada pareja creador y campaña del 0 al 100, y
                enseñamos de dónde sale cada punto.
              </p>
            </Reveal>

            {!session?.user ? (
              <Reveal delay={0.16}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup?tipo=creador" className={ctaPrimario}>
                    soy creador
                  </Link>
                  <Link href="/signup?tipo=marca" className={ctaSecundario}>
                    soy una marca
                  </Link>
                </div>
              </Reveal>
            ) : null}
          </div>

          <Reveal delay={0.24}>
            <ScoreSheet
              name="Lucía"
              meta="fitness · 48.200 seguidores · 5,4% de engagement"
              score={89.33}
              lines={LUCIA_DESGLOSE}
              notes={["nicho exacto"]}
              rotate={-1.1}
            />
          </Reveal>
        </section>
      </div>

      {/* --- La rúbrica: una sola hoja, cuatro filas regladas -------------- */}
      <section className="border-y border-paper/10 bg-canvas-2 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <Reveal>
            <h2 className={h2}>cómo se reparten los 100 puntos</h2>
            <p className="body-copy mt-4 max-w-2xl text-paper-2">
              Nada de una caja negra que dice «96% de compatibilidad». El score
              se reparte en cuatro componentes y cada match enseña su desglose.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <Paper padding="p-0" rotate={-0.4} className="mt-10">
              <ul>
                {RUBRICA.map((fila, i) => (
                  <li
                    key={fila.componente}
                    className={`grid grid-cols-[4rem_1fr] items-baseline gap-x-5 px-6 py-5 sm:grid-cols-[7rem_13rem_1fr] sm:gap-x-8 sm:px-9 sm:py-7 ${
                      i === 0 ? "" : "border-t border-print/15"
                    }`}
                  >
                    <span className="display tabular col-start-1 row-start-1 text-4xl text-print sm:text-5xl">
                      {fila.puntos}
                    </span>
                    <p className="display col-start-2 row-start-1 text-xl text-print sm:text-2xl">
                      {fila.componente}
                    </p>
                    {/* El criterio salta a su propia columna en pantalla ancha:
                        apilado bajo el componente dejaba media hoja en blanco a
                        la derecha, y una rúbrica impresa usa el ancho. */}
                    <p className="body-copy col-start-2 row-start-2 mt-1 text-[0.9375rem] text-graphite sm:col-start-3 sm:row-start-1 sm:mt-0">
                      {fila.criterio}
                    </p>
                  </li>
                ))}
              </ul>
            </Paper>
          </Reveal>
        </div>
      </section>

      {/* --- El ejemplo: el boletín calificado y el gesto, sobre la mesa --- */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <Reveal>
            <h2 className={h2}>el mismo perfil, cuatro campañas</h2>
            <p className="body-copy mt-4 max-w-2xl text-paper-2">
              Nicho sin relación, audiencia por debajo del mínimo o señales de
              fraude no restan puntos: impiden que la pareja llegue a existir.
            </p>
          </Reveal>

          <div className="mt-10 flex flex-col items-start gap-10 lg:flex-row lg:items-end">
            <Reveal>
              <Paper padding="p-0" rotate={-0.7} className="w-full lg:max-w-2xl">
                <p className="utility border-b border-print/15 px-6 py-4 text-[0.625rem] text-graphite sm:px-8">
                  Lucía · fitness · 48.200 seguidores · 5,4% de engagement
                </p>

                <ul>
                  {BANDEJA.map((fila, i) => (
                    <li
                      key={fila.campana}
                      className={`flex items-center justify-between gap-6 px-6 py-4 sm:px-8 ${
                        i === 0 ? "" : "border-t border-print/15"
                      }`}
                    >
                      <div>
                        <p className="display text-lg text-print">
                          {fila.campana}
                        </p>
                        <p className="utility mt-1 text-[0.625rem] text-graphite">
                          {fila.meta}
                        </p>
                      </div>
                      <span className="display tabular shrink-0 text-3xl text-print">
                        {formatScore(fila.score)}
                      </span>
                    </li>
                  ))}

                  {/* La cuarta fila no lleva nota: es el filtro duro, y
                      enseñarlo vale más que contarlo. */}
                  <li className="flex items-center justify-between gap-6 border-t border-print/15 px-6 py-4 sm:px-8">
                    <div>
                      <p className="display text-lg text-graphite">
                        Colección ropa técnica
                      </p>
                      <p className="utility mt-1 text-[0.625rem] text-graphite">
                        moda · mín. 50.000
                      </p>
                    </div>
                    <span className="utility shrink-0 rotate-[-6deg] border-2 border-accent-print px-3 py-1.5 text-[0.6875rem] text-accent-print">
                      sin match
                    </span>
                  </li>
                </ul>
              </Paper>
            </Reveal>

            {/* El gesto, al lado del boletín. Sin solapar: la pila tapaba
                justo la columna de notas, que es lo único que esta sección
                tiene que enseñar. */}
            <div className="w-full max-w-[300px] rotate-[2.2deg]">
              <SwipeDeck cards={CANDIDATOS} />
            </div>
          </div>
        </div>
      </section>

      {/* --- Tres decisiones: recortes en escalera ------------------------- */}
      <section className="border-y border-paper/10 bg-canvas-2 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <Reveal>
            <h2 className={h2}>tres decisiones que lo diferencian</h2>
          </Reveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {DECISIONES.map((d, i) => (
              <Reveal key={d.titulo} delay={i * 0.08}>
                {/* La escalera: cada recorte cae un poco más abajo que el
                    anterior, y ninguno se apoya en la misma línea. */}
                <div className={["", "md:mt-12", "md:mt-24"][i]}>
                  <Paper
                    tone={i === 1 ? "paper-2" : "paper"}
                    rotate={[-1.4, 1.1, -0.6][i]}
                  >
                    <span className="utility block text-[0.625rem] text-accent-print">
                      decisión
                    </span>
                    <h3 className="display mt-3 text-2xl text-print">
                      {d.titulo}
                    </h3>
                    <p className="body-copy mt-3 text-[0.9375rem] text-graphite">
                      {d.cuerpo}
                    </p>
                  </Paper>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- El dinero: una nota al margen, no una sección de producto ----- */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <Reveal>
            <div className="ml-auto max-w-xl">
              <h2 className={h2}>el dinero no pasa por aquí</h2>
              <Paper rotate={0.8} className="mt-8">
                <p className="body-copy text-[0.9375rem] text-print">
                  La marca paga al creador por fuera, como ya lo hacen hoy.
                  BrandFluence solo anota lo que declara cada parte: la marca
                  dice que pagó, el creador confirma que lo recibió. No
                  retenemos, no transferimos y no cobramos comisión. Los
                  importes van en pesos colombianos.
                </p>
              </Paper>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- Cierre: la rúbrica desfilando y la puerta de entrada ---------- */}
      {!session?.user ? (
        <section>
          <Marquee
            items={["nicho 40", "audiencia 25", "engagement 25", "confianza 10"]}
          />

          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
            <Reveal>
              <h2 className="display max-w-3xl text-display text-paper">
                crea tu perfil y mira qué sale
              </h2>
              <p className="body-copy mt-6 max-w-xl text-lg text-paper-2">
                El matching se calcula en cuanto tengas nicho y audiencia. Sin
                tarjeta, sin permanencia.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup?tipo=creador" className={ctaPrimario}>
                  soy creador
                </Link>
                <Link href="/signup?tipo=marca" className={ctaSecundario}>
                  soy una marca
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Honestidad sobre el estado: el repositorio es público y el README
          dice lo mismo. Prometer una plataforma consolidada sería mentir. */}
      <footer className="border-t border-paper/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          <p className="utility text-[0.625rem] text-graphite">
            MVP en desarrollo activo. Construido en público por{" "}
            <a
              href="https://github.com/dgh09/BrandFluence-AI"
              className="text-paper-2 underline underline-offset-4 hover:text-paper"
            >
              @dgh09
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
