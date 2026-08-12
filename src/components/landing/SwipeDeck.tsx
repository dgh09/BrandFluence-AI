"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { ScoreDot } from "@/components/ui/ScoreDot";

export interface SwipeCard {
  name: string;
  niche: string;
  /** Ya formateado en es-CO: la portada no calcula, enseña. */
  followers: string;
  /** Valor exacto de `scoreMatch`. */
  score: number;
  action: "connect" | "pass";
  photo: string;
}

interface SwipeDeckProps {
  cards: SwipeCard[];
  /** Milisegundos que cada tarjeta se queda arriba antes de salir. */
  interval?: number;
}

/** Lo que tarda la tarjeta en salir. Coincide con --duration-slow. */
const SALIDA_MS = 420;

/**
 * Demo automática del gesto de la bandeja.
 *
 * La portada explicaba el producto y nunca enseñaba lo único que el visitante
 * va a hacer de verdad: mirar un candidato ya puntuado y decidir si conecta o
 * pasa. Esto lo enseña en bucle, sin pedir interacción.
 *
 * No es interactiva a propósito: un carrusel que responde al ratón invita a
 * jugar con él en vez de leer la página.
 *
 * Con `prefers-reduced-motion` se queda la primera tarjeta ya conectada, sin
 * bucle y sin contadores.
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
          //
          // La `key` sigue atada a la profundidad estructural, así que cuando
          // el índice avanza React remonta cada tarjeta justo donde su
          // animación ya la había dejado y el relevo no se ve.
          const profundidadVisual =
            saliendo && !reduce && !arriba ? profundidad - 1 : profundidad;

          return (
            <motion.article
              key={card.name + profundidad}
              className="absolute inset-0 overflow-hidden rounded-card border border-line bg-surface"
              // Origen en el centro y no abajo: con el origen abajo, encoger la
              // tarjeta le baja el borde superior justo lo que lo sube el
              // desplazamiento, y la pila se esconde detrás de la primera.
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
              <div className="relative h-[72%] bg-surface-2">
                {/* `<img>` y no `next/image`, igual que en `ui/Avatar.tsx`: meter
                    el host de Unsplash en los dominios remotos no compensa
                    cuando su propio CDN ya sirve la imagen al tamaño pedido en
                    la URL. Van a 2× del hueco real, no a 640². */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.photo}
                  alt=""
                  width={600}
                  height={472}
                  className="size-full object-cover"
                />

                <span className="absolute right-3 top-3 inline-flex items-center rounded-pill bg-canvas/70 px-3 py-1.5 backdrop-blur-sm">
                  <ScoreDot score={card.score} />
                </span>

                {arriba && (saliendo || reduce) ? (
                  <span
                    className={`absolute left-3 top-3 rounded-pill px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] ${
                      conectar
                        ? "bg-mint text-on-mint"
                        : "bg-surface-3 text-ink-muted"
                    }`}
                  >
                    {conectar ? "Conectar" : "Pasar"}
                  </span>
                ) : null}
              </div>

              <div className="p-4">
                <p className="font-bold">{card.name}</p>
                <p className="mt-1 text-sm text-ink-secondary">
                  {card.niche} · {card.followers} seguidores
                </p>
              </div>
            </motion.article>
          );
        })}
    </div>
  );
}
