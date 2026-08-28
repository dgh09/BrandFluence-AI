"use client";

import Link from "next/link";
import type { PointerEvent, ReactNode } from "react";

/* ---------------------------------------------------------------------------
   El botón de la portada

   Adaptado del FlowButton de 21st.dev. Se conservan sus tres gestos: la
   píldora que se cierra en un radio corto al pasar el ratón, el círculo que
   inunda el botón, y el relevo de la flecha — sale por la derecha y vuelve a
   entrar por la izquierda.

   Los radios son una decisión de Daniel del 28/08/2026: la regla de «radio
   cero en toda la página» quedó retirada de DESIGN.md ese día, y el botón es
   quien la retira. Las hojas de papel siguen sin radio, porque un borde
   rasgado no admite uno.

   Lo que sí se cambió del original, y por qué:

   · El blanco del hover. Blanco sobre el coral se queda en 3,51:1 y no llega a
     AA — es el fallo que ya se corrigió una vez en esta portada. El primario
     mantiene la tinta encima (5,29:1) y el secundario invierte a tinta sobre
     papel (16,13:1).
   · La inversión del secundario va en `hover:`/`focus-visible:` y no en
     `group-hover:`. El `group` es el propio enlace, y `group-hover` compila a
     `.group:hover .group-hover\:…`: solo alcanza a los descendientes, nunca al
     elemento que lleva la clase. Con `group-hover:text-print` la etiqueta se
     quedaba en papel mientras el papel la inundaba, y «soy una marca»
     desaparecía al pasar el ratón. Los hijos —el campo y las flechas— sí usan
     `group-hover`, que para ellos es lo correcto.
   · El foco. El original no trae ninguno, así que por teclado el botón
     desaparecía. Se conserva el anillo de coral, y la inundación corre también
     con `group-focus-visible`: un gesto que solo existe para el ratón deja a
     media pantalla sin saber que el botón responde.
   · Los colores fijos. `#111111` sobre la tinta del fondo da 1,04:1: el
     componente venía pensado para un fondo claro y aquí va sobre negro.
   · El `<button>`. Estos navegan, así que son `Link`.
   · Las flechas de lucide. La portada no usa librería de iconos, así que la
     flecha va dibujada aquí, con el mismo grosor de 2px que el borde del
     secundario.

   El círculo escala en vez de animar `width`/`height`: es la misma imagen y no
   dispara relayout en cada fotograma.

   Con `prefers-reduced-motion: reduce` la regla global de `globals.css` deja
   las transiciones en 0,01ms y el botón salta directo a su estado final.
   --------------------------------------------------------------------------- */

type Variante = "primario" | "secundario" | "nav";

/** Salida exponencial: rápido de entrada, se posa al final. */
const EASE = "cubic-bezier(0.16,1,0.3,1)";

/** El relevo de la flecha va con rebote, como en el original. */
const EASE_FLECHA = "cubic-bezier(0.34,1.56,0.64,1)";

const BASE =
  "group utility relative isolate inline-flex items-center justify-center overflow-hidden text-base " +
  "rounded-[100px] hover:rounded-[12px] focus-visible:rounded-[12px] active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const VARIANTE: Record<Variante, { caja: string; campo: string }> = {
  // Coral en reposo, coral encendido al inundar. La tinta se queda encima en
  // los dos estados: es el par obligado del coral, no una preferencia.
  primario: {
    // px-12 (3rem) y no el 1.75rem de antes: la flecha se apoya a 1.25rem del
    // canto, así que hace falta ese ancho para que no toque la etiqueta.
    caja: "h-13 px-12 bg-accent text-print",
    campo: "bg-accent-hover",
  },
  // El de contorno. Es el que más se parece al original: vacío en reposo,
  // sólido cuando el papel lo inunda.
  secundario: {
    caja: "h-13 px-12 border-2 border-paper text-paper hover:text-print focus-visible:text-print",
    campo: "bg-paper",
  },
  // El mismo botón a la talla de la cabecera.
  nav: {
    caja: "shrink-0 px-12 py-2.5 border-2 border-paper text-paper hover:text-print focus-visible:text-print",
    campo: "bg-paper",
  },
};

/**
 * La flecha.
 *
 * Asta recta y punta abierta: 2px de grosor para igualar el borde del
 * secundario, remate cuadrado y unión en inglete. Hereda el color del texto,
 * así que en la inversión del secundario pasa a tinta sola.
 */
function Flecha({ className, style }: { className: string; style: object }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d="M1 8h13M9.5 3.5 14 8l-4.5 4.5" />
    </svg>
  );
}

export function CtaFlujo({
  href,
  children,
  variante = "primario",
}: {
  href: string;
  children: ReactNode;
  variante?: Variante;
}) {
  const { caja, campo } = VARIANTE[variante];
  const transicionFlecha = { transition: `translate 320ms ${EASE_FLECHA}` };

  /**
   * De dónde sale la inundación.
   *
   * Guarda la x del cursor dentro del botón en `--x` y la usa como centro del
   * círculo. Sin estado y sin re-render: se escribe una propiedad
   * personalizada y la transición ya estaba declarada en CSS.
   *
   * Por teclado no hay puntero, así que `--x` no llega a existir y el valor de
   * respaldo (50%) abre el círculo desde el centro, como el original.
   */
  const marcarOrigen = (event: PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--x",
      `${event.clientX - rect.left}px`,
    );
  };

  return (
    <Link
      href={href}
      onPointerEnter={marcarOrigen}
      className={`${BASE} ${caja}`}
      style={{ transition: `border-radius 320ms ${EASE}, color 200ms linear` }}
    >
      {/* El círculo que inunda. `-z-10` dentro de un contexto aislado lo deja
          detrás del texto pero delante del fondo del propio botón. Escala en
          vez de crecer: 34rem cubren el botón más ancho aunque el cursor entre
          por una esquina. */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full group-hover:scale-100 group-focus-visible:scale-100 ${campo}`}
        style={{
          left: "var(--x, 50%)",
          // `scale`, no `transform`. Tailwind v4 escribe las propiedades
          // independientes (`scale`, `translate`) y deja `transform` en `none`:
          // transicionar `transform` no animaba nada y el campo aparecía de
          // golpe. Solo se ve en el navegador — el marcado era idéntico.
          transition: `scale 220ms ${EASE}`,
        }}
      />

      {/* La flecha que se va, por la derecha. Se mueve con `translate` y no
          con `left`/`right`: las dos flechas están posicionadas en absoluto, y
          animar su desplazamiento en vez de su posición deja el trabajo en el
          compositor en lugar de recalcular la caja en cada fotograma. 4rem
          bastan para sacarla del botón, que recorta por `overflow-hidden`. */}
      <Flecha
        className="pointer-events-none absolute right-5 group-hover:translate-x-16 group-focus-visible:translate-x-16"
        style={transicionFlecha}
      />

      {/* La que llega, por la izquierda. El texto no se mueve: la etiqueta que
          se desplaza al pasar el ratón se lee como un temblor, no como una
          respuesta. */}
      <Flecha
        className="pointer-events-none absolute left-5 -translate-x-16 group-hover:translate-x-0 group-focus-visible:translate-x-0"
        style={transicionFlecha}
      />

      <span className="relative">{children}</span>
    </Link>
  );
}
