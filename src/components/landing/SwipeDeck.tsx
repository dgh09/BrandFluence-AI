"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { formatScore } from "@/lib/numbers";

export interface SwipeCard {
  name: string;
  niche: string;
  /** Ya formateado en es-CO: la portada no calcula, enseña. */
  followers: string;
  /** Valor exacto de `scoreMatch`. */
  score: number;
  action: "connect" | "pass";
}

interface SwipeDeckProps {
  cards: SwipeCard[];
  /** Milisegundos que cada tarjeta se queda arriba antes de salir. */
  interval?: number;
}

/** Lo que tarda la tarjeta en salir. */
const SALIDA_MS = 420;

/**
 * Demo automática del gesto de la bandeja.
 *
 * No es interactiva a propósito: un carrusel que responde al ratón invita a
 * jugar con él en vez de leer la página.
 *
 * Con `prefers-reduced-motion` se queda la primera tarjeta ya conectada, sin
 * bucle y sin contadores.
 *
 * Las tarjetas son fichas de papel, no fotos. La portada anterior enseñaba
 * caras de banco junto a nombres y métricas de ejemplo; aquí la ficha ES el
 * contenido, así que el problema desaparece en vez de taparse. El borde va
 * recto y sin el filtro de desgarro: un filtro SVG sobre un elemento que se
 * anima se recalcula en cada fotograma, y esto se mueve en bucle.
 */
export function SwipeDeck({ cards, interval = 2600 }: SwipeDeckProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (reduce || cards.length === 0) return;

    const salida = setTimeout(() => setSaliendo(true), interval);
    const siguiente = setTimeout(() => {
      setSaliendo(false);
      setIndex((i) => (i + 1) % cards.length);
    }, interval + SALIDA_MS);

    return () => {
      clearTimeout(salida);
      clearTimeout(siguiente);
    };
  }, [index, reduce, interval, cards.length]);

  if (cards.length === 0) return null;

  // Se rota el array para que la tarjeta activa quede siempre la primera, y se
  // pinta al revés para que la de arriba sea la última del DOM.
  const orden = cards.map((_, i) => cards[(index + i) % cards.length]);

  return (
    <div
      className="relative aspect-[300/380] w-full max-w-[300px]"
      role="img"
      aria-label="Ejemplo del gesto de conectar o pasar en la bandeja de matches"
    >
      {orden
        .slice(0, 3)
        .reverse()
        .map((card, posicion) => {
          const profundidad = 2 - posicion;
          const arriba = profundidad === 0;
          const conectar = card.action === "connect";
          const fuera = arriba && saliendo && !reduce;

          // Las de detrás avanzan un peldaño MIENTRAS la de arriba se va, no
          // después. Si esperan a que termine, el hueco se llena de golpe al
          // final y ese salto se lee como una pausa.
          const profundidadVisual =
            saliendo && !reduce && !arriba ? profundidad - 1 : profundidad;

          return (
            <motion.article
              key={card.name + profundidad}
              className={`absolute inset-0 flex flex-col justify-between p-5 ${
                arriba ? "bg-paper" : "bg-paper-2"
              }`}
              style={{ transformOrigin: "50% 50%", zIndex: 10 - profundidad }}
              animate={
                fuera
                  ? {
                      x: conectar ? "120%" : "-120%",
                      y: 0,
                      rotate: conectar ? 14 : -14,
                      scale: 1,
                      opacity: 0,
                    }
                  : {
                      x: 0,
                      y: profundidadVisual * -18,
                      rotate: 0,
                      scale: 1 - profundidadVisual * 0.05,
                      opacity: 1 - profundidadVisual * 0.25,
                    }
              }
              transition={{ duration: SALIDA_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <p className="utility text-[0.625rem] text-graphite">
                  candidato
                </p>
                <p className="display mt-2 text-3xl text-print">{card.name}</p>
                <p className="utility mt-1.5 text-[0.625rem] text-graphite">
                  {card.niche} · {card.followers} seguidores
                </p>
              </div>

              <div className="relative">
                <p className="display tabular text-7xl leading-[0.82] text-print">
                  {formatScore(card.score)}
                </p>
                <p className="utility mt-2 border-t-2 border-print pt-2 text-[0.625rem] text-graphite">
                  sobre 100
                </p>

                {/* El sello solo aparece en el momento de la decisión. Es la
                    marca de calificación, no una etiqueta permanente. */}
                {arriba && (saliendo || reduce) ? (
                  <span
                    className={`utility absolute bottom-1 right-0 rotate-[-7deg] border-2 px-2.5 py-1 text-[0.625rem] ${
                      conectar
                        ? "border-accent-print text-accent-print"
                        : "border-graphite text-graphite"
                    }`}
                  >
                    {conectar ? "conectar" : "pasar"}
                  </span>
                ) : null}
              </div>
            </motion.article>
          );
        })}
    </div>
  );
}
