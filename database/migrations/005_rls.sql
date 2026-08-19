-- ============================================================================
-- 005 — RLS: cerrar la puerta de PostgREST
-- ============================================================================
--
-- Ejecutar en el SQL Editor de Supabase. Idempotente.
--
-- El aviso de seguridad de Supabase del 17 de agosto de 2026 marcó
-- `rls_disabled_in_public` sobre `notifications`. Era cierto, y conviene
-- entender por qué solo sobre esa.
--
-- Supabase publica el schema `public` por PostgREST en
-- https://<ref>.supabase.co/rest/v1/, y le da al rol `anon` los privilegios
-- completos —SELECT, INSERT, UPDATE, DELETE— sobre cada tabla. La clave que
-- abre esa puerta es la `anon`, que es `NEXT_PUBLIC_SUPABASE_ANON_KEY`: viaja
-- en el bundle del navegador porque `MediaUpload` la necesita para subir a
-- Storage. No es un secreto y nunca lo fue; se saca del sitio desplegado en
-- diez segundos.
--
-- Lo único que separaba los datos de esa puerta era RLS. Once tablas lo
-- tenían activado —sin políticas, que es deny-all: PostgREST devuelve `[]`—
-- pero activado a mano en el panel, no aquí. `notifications` la creó la
-- migración 004, nadie volvió al panel, y nació abierta: siete filas que
-- cualquiera podía leer, reescribir o borrar.
--
-- El fallo de fondo no es la tabla, es DÓNDE vivía la decisión. Mientras el
-- estado de RLS solo exista en el dashboard, la siguiente migración que cree
-- una tabla repetirá esto exactamente igual. Por eso esta migración no hace
-- `ALTER TABLE notifications` a secas: recorre el schema entero y deja el
-- repositorio como fuente de la verdad.

-- ----------------------------------------------------------------------------
-- 1. RLS en todas las tablas de `public`, incluidas las que se creen mañana
-- ----------------------------------------------------------------------------
--
-- Sin políticas a propósito. La app NO habla con PostgREST para leer datos:
-- va por `pg` con `DATABASE_URL` (src/lib/db.ts), y de Supabase solo usa
-- Storage. Una política aquí no daría acceso a nadie que lo necesite, y sí
-- describiría un modelo de permisos paralelo al que ya vive en los `WHERE`
-- de las consultas. Deny-all es la respuesta correcta, no una a medias.
--
-- OJO con `FORCE ROW LEVEL SECURITY`: NO se activa. El dueño de la tabla se
-- salta RLS, y la app se conecta justamente como `postgres`, que es el dueño.
-- Forzarlo dejaría el sitio entero en cero filas. Que las once tablas lleven
-- meses con RLS activado y el sitio funcione es la prueba de que este es el
-- montaje correcto.

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE 'RLS activado en %', t;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Quitarle a `anon` y `authenticated` los privilegios sobre `public`
-- ----------------------------------------------------------------------------
--
-- Esto es lo que impide que vuelva a pasar. RLS es una segunda cerradura muy
-- buena, pero el paso 1 solo protege lo que existe hoy: si mañana alguien
-- crea una tabla en el panel y se olvida de activarlo, vuelve a estar todo
-- abierto. Sin privilegios, esa tabla nueva responde permission denied
-- aunque nazca sin RLS.
--
-- Se puede quitar sin miedo porque nada lo usa: el único `createClient` con
-- la clave anon es `MediaUpload`, y solo llama a `.storage`. Storage vive en
-- el schema `storage` con sus propias políticas, que esto no toca.
--
-- `service_role` conserva los suyos: es la clave de `src/lib/storage.ts`.
--
-- Si algún día se quiere leer desde el navegador con supabase-js, el camino
-- es volver a conceder sobre esa tabla concreta Y escribirle políticas. Las
-- dos cosas, y de forma explícita.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON SCHEMA public FROM anon, authenticated;

-- Y para las tablas que aún no existen. Los privilegios por defecto que
-- reparte Supabase son los que hacen que una tabla recién creada aparezca
-- ya publicada; aquí se cortan en origen, para lo que cree `postgres`.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Comprobación
-- ----------------------------------------------------------------------------
-- Debe salir cero filas. Si sale alguna, esa tabla sigue abierta.

SELECT c.relname AS tabla_sin_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
