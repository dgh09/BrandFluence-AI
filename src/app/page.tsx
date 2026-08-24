import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { Logo } from "@/components/shared/Logo";
import { ShaderGround } from "@/components/ui/ShaderGround";
import { Marquee } from "@/components/landing/Marquee";
import { Paper } from "@/components/landing/Paper";
import { Reveal } from "@/components/landing/Reveal";
import { ScoreSheet, type ScoreLine } from "@/components/landing/ScoreSheet";
import { TornDefs } from "@/components/landing/TornDefs";
import { formatScore } from "@/lib/numbers";

/* ---------------------------------------------------------------------------
   CONTRATO DE DIRECCIÓN (copia legible; el emitido vive en `layout.tsx`)

   THESIS: la nota se audita, no se presenta. Rechaza la rejilla de cuatro
   tarjetas de componentes que envía toda la categoría.
   OWN-WORLD: tinta, papel bond, un solo gris, coral solo como marca de
   corrección. Radio 0, sin sombras, tres tamaños en toda la página.
   STORY: el visitante ve un número enorme, lee de dónde sale cada punto y
   cuánto falta, ve una campaña tachada que no llegó a existir, y entra.
   FIRST VIEWPORT: ficha a la izquierda con 89,33 al mayor tamaño de la página;
   a la derecha el titular en caja baja a dos líneas y los dos botones.
   FORM: dossier de casting calificado, fijado por el brief. Seed d9c9bd0d.
   FINISH: unreviewed and undocumented is unfinished.
   --------------------------------------------------------------------------- */

export const metadata: Metadata = {
  // El layout raíz añade el sufijo « · BrandFluence AI» a los demás títulos;
  // en la portada sobra repetirlo.
  title: "BrandFluence AI · Cada match, con su porqué",
  description:
    "BrandFluence AI puntúa cada pareja creador–campaña del 0 al 100 y explica de dónde sale cada punto. Matching con IA para campañas UGC en Colombia.",
};

// Lee la sesión para decidir el botón principal, así que no se puede
// prerenderizar estática.
export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Todas las cifras salen de ejecutar `scoreMatch`, no de la cabeza, y
   `matching.test.ts` las fija: si el algoritmo cambia y estos números no, el
   build rompe en vez de dejar la portada mintiendo.
   --------------------------------------------------------------------------- */

/** Lucía contra «Lanzamiento proteína vegana». El desglose exacto. */
const DESGLOSE: ScoreLine[] = [
  { label: "nicho", value: 40, max: 40 },
  { label: "audiencia", value: 21.83, max: 25 },
  { label: "engagement", value: 22.5, max: 25 },
  { label: "confianza", value: 5, max: 10 },
];

/**
 * La auditoría: cada componente con la regla que produjo su número.
 *
 * Esta es la sección que la página existe para tener. La rúbrica de pesos
 * (40/25/25/10) se lee sola en la columna «de 40», «de 25»: no hace falta una
 * segunda sección que la repita.
 */
const AUDITORIA = [
  {
    componente: "nicho",
    valor: 40,
    techo: 40,
    regla: "Coincidencia exacta entre fitness y fitness. Un nicho afín habría dado 24.",
  },
  {
    componente: "audiencia",
    valor: 21.83,
    techo: 25,
    regla: "48.200 seguidores sobre un mínimo de 10.000, o sea 4,8×. La escala satura a 10×, así que crecer más apenas suma.",
  },
  {
    componente: "engagement",
    valor: 22.5,
    techo: 25,
    regla: "5,4% frente al 6% que da la puntuación completa.",
  },
  {
    componente: "confianza",
    valor: 5,
    techo: 10,
    regla: "Bio completa y sin señales de fraude. Sin verificar, que son los 5 que faltan.",
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
   Radio cero en toda la página. Tres tamaños y ni uno más: `text-score`,
   `text-display` y `text-base`. Lo que parece «letra pequeña» es la misma
   talla en versalitas. */

const cta =
  "inline-flex h-13 items-center justify-center px-7 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px";

/** Tinta sobre el coral, no blanco: blanco sobre #FF3B4F se queda en 3,3:1. */
const ctaPrimario = `${cta} utility bg-accent text-print hover:bg-accent-hover`;
const ctaSecundario = `${cta} utility border-2 border-paper text-paper hover:bg-paper hover:text-print`;

const h2 = "display text-display lowercase text-paper";

export default async function Home() {
  const session = await auth();

  return (
    // `hoja-calificada` apaga el resplandor radial que el `body` de la
    // aplicación pinta hacia el color de tarjeta. En el panel esa luz da
    // elevación; aquí subía el fondo a #161617 en la primera pantalla y era,
    // además, la única fuente de luz centrada de una página cuyo contrato dice
    // que nada se centra. El grano se queda.
    <div className="hoja-calificada relative">
      <TornDefs />

      {/* La malla animada es el suelo de la portada entera, no la textura del
          hero. Va fija a la ventana, así que el contenido rueda por encima de
          un fondo que se mueve solo y el lienzo nunca crece más que la
          pantalla. */}
      <ShaderGround />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          {/* Sin `tagline`: el eslogan es el titular, y decirlo dos veces en la
              misma pantalla lo devalúa. */}
          <Logo size={32} />

          <Link
            href={session?.user ? "/dashboard" : "/login"}
            className="utility shrink-0 border-2 border-paper px-4 py-2.5 text-base text-paper transition-colors hover:bg-paper hover:text-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {session?.user ? "ir al panel" : "entrar"}
          </Link>
        </header>

        {/* --- Hero: el ojo entra por el número ---------------------------- */}
        {/* El orden se invierte en móvil. En escritorio el ojo entra por el
            número, que es la tesis; en un teléfono la ficha mide una pantalla
            entera y dejaba el titular y los dos botones por debajo del corte,
            así que ahí manda la promesa y la evidencia va justo detrás. */}
        <section className="grid items-center gap-12 pt-10 pb-16 sm:pt-16 sm:pb-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {/* El orden vive en este envoltorio y no dentro de `Reveal`: el hijo
              de la rejilla es el `motion.div` que Reveal monta, así que una
              clase de orden más adentro no reordenaría nada. */}
          <div className="order-2 lg:order-none">
            <Reveal>
              <ScoreSheet
                name="Lucía"
                meta="fitness · 48.200 seguidores"
                score={89.33}
                lines={DESGLOSE}
                rotate={-0.9}
              />
            </Reveal>
          </div>

          <div className="order-1 lg:order-none">
            {/* Sin rótulo encima del titular. Un «campañas ugc en colombia» en
                versalitas es el reflejo de la categoría, no una decisión: el
                titular se sostiene solo y el país entra en la frase. */}
            <Reveal delay={0.08}>
              <h1 className={h2}>
                cada match,
                <br />
                con su porqué
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="body-copy mt-7 max-w-md text-base text-paper">
                En Colombia, puntuamos cada pareja creador y campaña del 0 al
                100 y enseñamos de dónde sale cada punto.
              </p>
            </Reveal>

            {!session?.user ? (
              <Reveal delay={0.24}>
                {/* `items-start` para que en el teléfono los botones no se
                    estiren a todo el ancho con el rótulo centrado: serían los
                    primeros elementos centrados de la página, y por encima del
                    número. */}
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
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
        </section>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-8">
        {/* --- La auditoría. La sección que la página existe para tener ---- */}
        <section className="pb-16 sm:pb-24">
          <Reveal>
            <h2 className={h2}>de dónde salen esos 89,33</h2>
          </Reveal>

          <Reveal delay={0.08}>
            <Paper padding="p-0" rotate={-0.3} className="mt-10">
              <ul>
                {AUDITORIA.map((fila, i) => {
                  const falta = fila.techo - fila.valor;
                  return (
                    <li
                      key={fila.componente}
                      className={`px-6 py-6 sm:px-9 sm:py-7 ${
                        i === 0 ? "" : "border-t border-print/20"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                        <span className="utility text-base text-print">
                          {fila.componente}
                        </span>
                        {/* La línea de puntos de un formulario: solo aparece
                            cuando hay ancho para que signifique algo. */}
                        <span
                          aria-hidden="true"
                          className="hidden h-px min-w-8 flex-1 bg-print/25 sm:block"
                        />
                        <span className="utility text-base text-print">
                          {formatScore(fila.valor)}
                          <span className="text-pencil">
                            {" "}
                            de {fila.techo}
                          </span>
                        </span>
                        <span
                          className={`utility text-base ${
                            falta > 0 ? "text-accent-print" : "text-pencil"
                          }`}
                        >
                          faltan {formatScore(falta)}
                        </span>
                      </div>

                      {/* Medida de línea, no ancho de contenedor: a 42rem la
                          prosa se iba a ochenta y ocho caracteres y el ojo
                          perdía el renglón al volver. */}
                      <p className="body-copy mt-2.5 max-w-xl text-base text-pencil">
                        {fila.regla}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Paper>
          </Reveal>
        </section>
      </div>

      {/* --- Lo que no llega a existir: el filtro duro, tachado ------------ */}
      {/* Sin `bg-canvas`: era una banda opaca que tapaba la malla justo en el
          medio de la página. Los filetes de arriba y abajo siguen separando la
          sección. */}
      <section className="relative z-10 border-y border-paper/10 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-16">
          <Reveal>
            <h2 className={h2}>lo que no llega a existir</h2>
          </Reveal>

          <Reveal delay={0.08}>
            {/* Sin rótulo encima del titular tachado: el encabezado se
                sostiene solo y el contexto entra en el cuerpo, abajo. */}
            <Paper rotate={0.7}>
              <p className="display text-display lowercase text-print">
                <span className="tachon">colección ropa técnica</span>
              </p>

              <p className="utility mt-5 text-base text-pencil">
                moda · mín. 50.000 seguidores
              </p>

              <p className="utility mt-6 border-t-2 border-accent-print pt-4 text-base text-accent-print">
                audiencia: 48.200 &lt; 50.000
              </p>

              <p className="body-copy mt-4 max-w-xl text-base text-print">
                La misma Lucía del ejemplo, contra otra campaña. No es una nota
                baja: nicho sin relación, audiencia por debajo del mínimo o
                señales de fraude no restan puntos, impiden que la pareja llegue
                a existir. Esta fila no aparece en la bandeja de nadie.
              </p>
            </Paper>
          </Reveal>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5">
        {/* --- Tres decisiones, como anotaciones al margen ----------------- */}
        <section className="py-16 sm:py-24">
          <Reveal>
            <h2 className={h2}>tres decisiones que lo diferencian</h2>
          </Reveal>

          <Reveal delay={0.08}>
            <Paper padding="p-0" rotate={-0.5} className="mt-10">
              <ul>
                {DECISIONES.map((d, i) => (
                  <li
                    key={d.titulo}
                    className={`px-6 py-7 sm:px-9 ${
                      i === 0 ? "" : "border-t border-print/20"
                    }`}
                  >
                    {/* Subrayado coral bajo el título, no un filete al margen.
                        El borde izquierdo de color es el adorno de aviso que
                        lleva media web; el subrayado es una de las cuatro
                        marcas de calificación que el vocabulario permite. */}
                    <h3 className="display w-fit border-b-2 border-accent-print pb-1 text-base lowercase text-print">
                      {d.titulo}
                    </h3>
                    <p className="body-copy mt-3 max-w-xl text-base text-pencil">
                      {d.cuerpo}
                    </p>
                  </li>
                ))}
              </ul>
            </Paper>
          </Reveal>
        </section>

        {/* --- El dinero: nota mecanografiada, lado pesado izquierdo ------- */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-xl">
            <Reveal>
              <h2 className={h2}>el dinero no pasa por aquí</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <Paper rotate={0.9} className="mt-8">
                <p className="body-copy text-base text-print">
                  La marca paga al creador por fuera, como ya lo hacen hoy.
                  BrandFluence solo anota lo que declara cada parte: la marca
                  dice que pagó, el creador confirma que lo recibió. No
                  retenemos, no transferimos y no cobramos comisión. Los
                  importes van en pesos colombianos.
                </p>
              </Paper>
            </Reveal>
          </div>
        </section>
      </div>

      {/* --- Cierre --------------------------------------------------------- */}
      {!session?.user ? (
        <section className="relative z-10">
          <Marquee
            items={["nicho 40", "audiencia 25", "engagement 25", "confianza 10"]}
          />

          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
            <Reveal>
              <h2 className={h2}>crea tu perfil y mira qué sale</h2>
              <p className="body-copy mt-7 max-w-md text-base text-paper">
                El matching se calcula en cuanto tengas nicho y audiencia. Sin
                tarjeta, sin permanencia.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

      {/* El pie es intocable por decisión de producto: el repositorio es
          público y prometer una plataforma consolidada sería mentir. */}
      <footer className="relative z-10 border-t border-paper/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          {/* En papel el gris cumple de sobra; sobre la tinta se quedaba en
              3,16:1, y esta es justamente la línea que no se puede tocar. El
              gris es para el papel: aquí manda el papel como tinta. */}
          <p className="utility text-base text-paper">
            MVP en desarrollo activo. Construido en público por{" "}
            <a
              href="https://github.com/dgh09/BrandFluence-AI"
              className="underline underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              @dgh09
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
