"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Segundos de retraso, para escalonar hermanos. */
  delay?: number;
}

/**
 * Revelado al entrar en pantalla: sube 16px y aparece.
 *
 * `once: true` porque un elemento que se re-anima cada vez que vuelve a la
 * vista convierte el scroll en un espectáculo y cansa a la segunda pasada.
 *
 * Con `prefers-reduced-motion` no envuelve nada: devuelve los hijos tal cual,
 * ya visibles. La regla global de `globals.css` solo desactiva animaciones de
 * CSS, y estas son de JavaScript — sin esta rama, quien pide menos movimiento
 * se quedaría con el contenido invisible esperando una animación que nunca
 * llega.
 */
export function Reveal({ children, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
