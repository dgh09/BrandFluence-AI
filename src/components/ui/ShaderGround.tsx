"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";

import { inkWash } from "@/lib/design-tokens";

/**
 * El suelo de la portada: una malla WebGL animada detrás de todo.
 *
 * Adaptación del componente `hero-shader` al mundo de esta página. Se conserva
 * la técnica —una malla de degradado en WebGL— y se tradujo el resto, porque
 * el original traía justo lo que el brief de esta portada prohíbe: morados de
 * startup de IA, dos filtros de cristal y píldoras con `backdrop-blur`.
 *
 * ## Por qué va fija y no absoluta
 *
 * La portada mide unos 4.000px. Un lienzo absoluto de ese alto serían decenas
 * de megapíxeles de WebGL repintándose en cada fotograma. Fijo a la ventana,
 * el lienzo nunca pasa del tamaño de la pantalla y el contenido rueda por
 * encima: además el fondo se comporta como un suelo real, que es lo que se
 * quiere cuando cubre la página entera y no una sección.
 *
 * ## Lo que sigue siendo ley
 *
 * La malla no mete color. Los cuatro pasos son tinta (`inkWash`). Un campo
 * coral de fondo convertiría el acento en decoración, y en este sistema el
 * acento solo califica.
 *
 * ## Movimiento reducido
 *
 * No desaparece: se congela. `speed={0}` con un `frame` fijo deja la misma
 * textura, quieta. Verificado en el código, no en el navegador: esta sesión no
 * puede emular la media query.
 */
export function ShaderGround() {
  const reduce = useReducedMotion();

  return (
    // `z-0` y no `-z-10`: el `body` pinta su color de fondo por encima de
    // cualquier hijo con z negativo, y la malla desaparecía entera. Por eso el
    // contenido de la portada va en `z-10`, no por encima de la nada.
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <MeshGradient
        className="size-full"
        colors={[...inkWash]}
        // Visible de verdad, que es lo que se pidió: la malla se mueve lo
        // bastante para notarse sin que el ojo la persiga en vez de leer.
        speed={reduce ? 0 : 0.3}
        frame={reduce ? 9000 : undefined}
        distortion={1.1}
        swirl={0.7}
        // La página ya pinta su propio grano en `body::after`. Sumar el del
        // shader lo duplicaría.
        grainOverlay={0}
        // Sin tope, la librería monta el lienzo a 8,3 MP en una pantalla de
        // densidad 1 y el bucle cae a 16 fotogramas por segundo. Un fondo de
        // tinta no necesita esa resolución.
        maxPixelCount={1_600_000}
        minPixelRatio={1}
      />
    </div>
  );
}
