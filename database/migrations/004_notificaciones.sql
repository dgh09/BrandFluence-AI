-- ============================================================================
-- 004 — Notificaciones in-app
-- ============================================================================
--
-- Ejecutar en el SQL Editor de Supabase. Idempotente.
--
-- `user_id` es el DESTINATARIO, no quien provocó el aviso. Esa es la
-- diferencia con `events`, donde el user_id es el actor: events registra
-- quién hizo qué (analítica), notifications registra a quién hay que
-- contárselo. Son dos tablas y no una porque casi ninguna acción notifica a
-- quien la hace, y varias no notifican a nadie.
--
-- El texto va GUARDADO (`title`, `body`), no compuesto al leer. Dos razones:
--
--   1. Un aviso cuenta lo que pasó CUANDO pasó. Si la marca renombra la
--      campaña después, «Ironpeak te aceptó en Proteína vegana» sigue siendo
--      lo que ocurrió; recomponerlo al leer reescribiría el pasado.
--   2. Las entidades que originan avisos —match, colaboración, entregable—
--      tienen formas distintas. Componer el texto al leer obligaría a un
--      JOIN polimórfico por tipo, y ese es justo el sitio donde acaban
--      apareciendo los null.
--
-- `href` se guarda por lo mismo: a dónde llevaba el aviso se decide al
-- crearlo.

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  href        TEXT,
  entity_type VARCHAR(50),
  entity_id   UUID,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La consulta caliente es «no leídas de este usuario, las más nuevas
-- primero», y es la que se ejecuta en CADA carga de página para pintar el
-- contador de la campana. El índice parcial solo indexa las no leídas, que
-- son las pocas: las leídas se acumulan para siempre y nunca se cuentan.
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- El listado completo de /notifications sí las quiere todas.
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);
