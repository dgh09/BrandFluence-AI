"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { matchScoreColor } from "@/lib/design-tokens";

/**
 * Las tres campañas del ejemplo del README, con el desglose que devuelve
 * `scoreMatch` para el perfil de Lucía (fitness, 48.200 seguidores, 5,4% de
 * engagement, con bio, sin verificar).
 *
 * No son cifras maquetadas a ojo: si el algoritmo cambia, esto miente. Está
 * cubierto por `matching.test.ts`, que es el sitio donde se notaría.
 */
const CAMPAIGNS = [
  {
    name: "Lanzamiento proteína vegana",
    meta: "fitness · mín. 10.000",
    total: 89.33,
    parts: [
      { label: "Nicho", value: 40, max: 40 },
      { label: "Audiencia", value: 21.83, max: 25 },
      { label: "Engagement", value: 22.5, max: 25 },
      { label: "Confianza", value: 5, max: 10 },
    ],
  },
  {
    name: "Reto 30 días en casa",
    meta: "fitness · mín. 20.000",
    total: 86.32,
    parts: [
      { label: "Nicho", value: 40, max: 40 },
      { label: "Audiencia", value: 18.82, max: 25 },
      { label: "Engagement", value: 22.5, max: 25 },
      { label: "Confianza", value: 5, max: 10 },
    ],
  },
  {
    name: "Suplementos bienestar",
    meta: "salud · mín. 5.000",
    total: 76.34,
    parts: [
      { label: "Nicho", value: 24, max: 40 },
      { label: "Audiencia", value: 24.84, max: 25 },
      { label: "Engagement", value: 22.5, max: 25 },
      { label: "Confianza", value: 5, max: 10 },
    ],
  },
] as const;

const CICLO_MS = 4200;

const SIZE = 168;
const STROKE = Math.round(SIZE * 0.075);
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * La demostración del producto en la portada.
 *
 * La página explicaba el algoritmo en prosa y nunca lo enseñaba, teniendo el
 * anillo de score como pieza más reconocible del panel. Esto lo enseña: el
 * anillo cuenta hasta la nota y las cuatro barras se llenan hasta su parte,
 * que es exactamente lo que el producto promete —una puntuación que se puede
 * discutir— hecho visible en cuatro segundos.
 *
 * Con `prefers-reduced-motion` se queda quieto en la primera campaña: nada de
 * contadores ni de carrusel automático.
 */
export function MatchPreview() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const activa = CAMPAIGNS[index];

  const score = useMotionValue(reduce ? CAMPAIGNS[0].total : 0);
  const entero = useTransform(score, (v) => Math.round(v));
  const offset = useTransform(
    score,
    (v) => CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE,
  );
  const [color, setColor] = useState(() => matchScoreColor(CAMPAIGNS[0].total));

  // El color del anillo es escalonado (crítico/warning/bueno), así que no se
  // interpola: se lee del valor animado en cada fotograma y cambia de golpe
  // al cruzar el umbral, igual que en el panel.
  useEffect(() => {
    return score.on("change", (v) => setColor(matchScoreColor(v)));
  }, [score]);

  useEffect(() => {
    if (reduce) return;
    const control = animate(score, activa.total, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => control.stop();
  }, [activa.total, reduce, score]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % CAMPAIGNS.length),
      CICLO_MS,
    );
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-2xl shadow-black/40">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Ejemplo real del algoritmo
      </p>
      <p className="mt-2 text-sm text-ink-secondary">
        Lucía · fitness · 48.200 seguidores · 5,4% de engagement
      </p>

      <div className="mt-6 flex flex-col items-center">
        <div
          className="relative inline-flex items-center justify-center"
          style={{ width: SIZE, height: SIZE }}
          role="img"
          aria-label={`Compatibilidad con ${activa.name}: ${Math.round(activa.total)} de 100`}
        >
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-surface-3)"
              strokeWidth={STROKE}
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: offset }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="tabular font-bold leading-none"
              style={{ fontSize: SIZE * 0.26 }}
            >
              {entero}
            </motion.span>
            <span className="mt-1 text-[11px] text-ink-muted">/ 100</span>
          </div>
        </div>

        {/* La altura fija evita que la tarjeta salte al cambiar de campaña,
            que en un carrusel automático es lo que más molesta. */}
        <div className="mt-4 flex h-11 flex-col items-center justify-start text-center">
          <motion.p
            key={activa.name}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="font-semibold"
          >
            {activa.name}
          </motion.p>
          <p className="text-xs text-ink-muted">{activa.meta}</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {activa.parts.map((p) => (
          <li key={p.label}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink-secondary">{p.label}</span>
              <span className="tabular font-semibold">
                {p.value.toLocaleString("es-CO", { maximumFractionDigits: 2 })}
                <span className="text-ink-muted"> / {p.max}</span>
              </span>
            </div>
            {/* Mismo color que el anillo: estas cuatro barras SON su desglose,
                y `globals.css` reserva el coral de UI para acciones, no para
                marcas de datos. Un anillo verde con barras coral leería como
                dos informaciones distintas. */}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-3">
              <motion.div
                className="h-full rounded-pill"
                style={{ backgroundColor: color }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${(p.value / p.max) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
        {CAMPAIGNS.map((c, i) => (
          <span
            key={c.name}
            className={`h-1 rounded-pill transition-all ${
              i === index ? "w-5 bg-accent" : "w-1.5 bg-surface-3"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
