"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Pide UNA vez el refresco de los componentes de servidor de esta ruta.
 *
 * Existe por cómo funciona el App Router: **un layout no se vuelve a
 * renderizar al navegar por cliente**. El contador de la campana lo calcula
 * el layout del panel, así que, sin esto, entrar en /notifications marcaba
 * los avisos como leídos en la base pero la insignia seguía diciendo «3» el
 * resto de la sesión, hasta la siguiente carga completa. Visto en el
 * navegador: ni los tipos ni el SQL podían enseñarlo.
 *
 * `router.refresh()` sí vuelve a pedir el árbol de servidor entero, layout
 * incluido, conservando el estado del cliente.
 *
 * No entra en bucle: quien lo monta solo lo hace cuando había algo que
 * marcar, y tras el refresco ya no hay nada, así que no se vuelve a montar.
 * El `ref` cubre además el doble montaje del modo estricto en desarrollo.
 */
export function RefreshOnce() {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    router.refresh();
  }, [router]);

  return null;
}
