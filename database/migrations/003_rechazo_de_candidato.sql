-- ============================================================================
-- 003 — La marca puede rechazar a un candidato
-- ============================================================================
--
-- Ejecutar en el SQL Editor de Supabase. Idempotente: el DROP ... IF EXISTS
-- delante del ADD deja volver a lanzarlo sin error.
--
-- Hasta ahora la marca solo podía aceptar a un candidato o dejarlo pendiente,
-- y su bandeja de /candidates no había forma de limpiarla.
--
-- El estado nuevo es 'declined', y NO se reutiliza 'rejected' por dos razones:
--
--   1. Significan cosas distintas. 'rejected' lo escribe el creador cuando
--      descarta una sugerencia; 'declined' lo escribe la marca cuando no
--      selecciona a un candidato. Con un solo valor, el creador vería bajo
--      "Descartadas" campañas que él nunca descartó.
--
--   2. 'rejected' no es terminal a propósito: setMatchStatus admite
--      'rejected' → 'interested' para que quien descarta pueda cambiar de
--      idea. Si la marca escribiera ahí, el creador rechazado podría
--      re-postularse y reaparecer en la bandeja al instante. 'declined' se
--      queda fuera de ese conjunto, así que cierra la conversación.
--
-- El recálculo de matching tampoco los resucita: solo toca filas 'suggested'
-- (ver src/lib/queries/matching.ts).

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE matches ADD CONSTRAINT matches_status_check
  CHECK (status IN ('suggested', 'interested', 'rejected', 'accepted', 'declined'));
