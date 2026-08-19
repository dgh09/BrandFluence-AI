-- ============================================================================
-- BrandFluence AI — Schema MVP
-- Postgres 15+ / Supabase. Ejecutar entero en el SQL Editor de Supabase.
-- ============================================================================
--
-- ⚠️ Este fichero NO es idempotente: ejecutarlo dos veces da
--    ERROR 42P07 "relation already exists". Es la señal de que YA está
--    aplicado, no un fallo. Para empezar de cero, ejecuta antes reset.sql.
--
-- Nota sobre ENUMs: el doc de arquitectura usa ENUM(...), que es sintaxis
-- MySQL. En Postgres un ENUM real es un tipo aparte y añadirle un valor
-- requiere ALTER TYPE. Para un MVP que va a cambiar cada semana usamos
-- TEXT + CHECK: mismo efecto, y cambiar los valores permitidos es un
-- ALTER TABLE trivial.

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ============================================================================
-- 1. AUTH.JS (NextAuth v5) — tablas que exige @auth/pg-adapter
-- ============================================================================
-- `users` es la tabla de Auth.js EXTENDIDA con nuestras columnas de dominio.
-- El adapter hace SELECT * e INSERT de columnas concretas, así que las
-- columnas extra nullable no le molestan. Una sola tabla de usuarios.

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255),
  email           VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image           TEXT,

  -- Dominio BrandFluence
  password_hash   VARCHAR(255),           -- NULL si el alta fue por OAuth (Google)
  user_type       TEXT CHECK (user_type IN ('creator', 'brand')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  id_token            TEXT,
  scope               TEXT,
  session_state       TEXT,
  token_type          TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE INDEX idx_accounts_user ON accounts("userId");

CREATE TABLE sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE verification_token (
  identifier TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  token      TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================================
-- 2. PERFILES
-- ============================================================================

CREATE TABLE creators (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username          VARCHAR(100) UNIQUE,
  bio               TEXT,
  profile_image_url TEXT,
  niche             VARCHAR(100),
  follower_count    INT DEFAULT 0,
  engagement_rate   DECIMAL(5,2),
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  fraud_score       DECIMAL(3,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_creators_niche  ON creators(niche);
CREATE INDEX idx_creators_fraud  ON creators(fraud_score);
-- Índice compuesto: el matching filtra por nicho Y ordena por seguidores.
CREATE INDEX idx_creators_match  ON creators(niche, follower_count DESC);

CREATE TABLE brands (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name   VARCHAR(255),
  industry       VARCHAR(100),
  logo_url       TEXT,
  monthly_budget DECIMAL(14,2),   -- pesos colombianos: 4 dígitos más que en euros
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_industry ON brands(industry);

-- ============================================================================
-- 3. CAMPAÑAS Y MATCHING
-- ============================================================================

CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  objective     VARCHAR(100),
  target_niche  VARCHAR(100),      -- contra qué se matchea creators.niche
  min_followers INT DEFAULT 0,     -- requisito mínimo de audiencia
  budget        DECIMAL(14,2),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published', 'active', 'completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_brand  ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_match  ON campaigns(status, target_niche);

CREATE TABLE matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES creators(id)  ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2),        -- 0.00 - 100.00
  score_reason JSONB,              -- desglose del scoring (debug + explicabilidad)
  -- 'rejected' lo escribe el creador al descartar una sugerencia y admite
  -- vuelta atrás; 'declined' lo escribe la marca al no seleccionar a un
  -- candidato y es terminal. Ver migrations/003.
  status      TEXT NOT NULL DEFAULT 'suggested'
              CHECK (status IN ('suggested', 'interested', 'rejected',
                                'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, campaign_id)
);

CREATE INDEX idx_matches_campaign_score ON matches(campaign_id, match_score DESC);
CREATE INDEX idx_matches_creator        ON matches(creator_id, status);

CREATE TABLE collaborations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id            UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'completed', 'cancelled')),
  deliverables        JSONB,
  performance_metrics JSONB,
  agreed_amount       DECIMAL(14,2),

  -- El pago ocurre FUERA de la plataforma y cada parte declara su mitad:
  -- la marca dice que pagó ('processing'), el creador confirma que lo
  -- recibió ('completed'). BrandFluence no mueve ni retiene dinero.
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'processing', 'completed')),
  paid_at             TIMESTAMPTZ,
  payment_method      TEXT
                      CHECK (payment_method IS NULL OR payment_method IN
                             ('transferencia', 'nequi', 'daviplata', 'efectivo', 'otro')),
  payment_reference   TEXT,
  payment_confirmed_at TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collaborations_payment ON collaborations(payment_status);

-- ============================================================================
-- 4. ANALYTICS Y FRAUDE
-- ============================================================================

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type  VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_user_type ON events(user_id, event_type);
CREATE INDEX idx_events_created   ON events(created_at DESC);

-- Notificaciones in-app. Ojo a la diferencia con `events`: aquí `user_id` es
-- el DESTINATARIO, no el actor. events dice quién hizo qué; notifications
-- dice a quién hay que contárselo. El texto va guardado, no compuesto al
-- leer, para que el aviso siga contando lo que pasó cuando pasó. Ver
-- migrations/004.
CREATE TABLE notifications (
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

-- Índice parcial: el contador de la campana se calcula en cada carga de
-- página y solo mira las no leídas, que son las pocas.
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user   ON notifications(user_id, created_at DESC);

CREATE TABLE fraud_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(100),
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. updated_at automático
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','creators','brands','campaigns','matches','collaborations']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- ============================================================================
-- 6. RLS — sin esto el proyecto nace publicado
-- ============================================================================
--
-- Supabase sirve el schema `public` por PostgREST y le concede al rol `anon`
-- privilegios completos sobre cada tabla. La clave `anon` viaja en el bundle
-- del navegador (Storage la necesita), así que no es un secreto: lo único
-- que separa los datos de internet es RLS.
--
-- Esto NO puede quedarse en el panel de Supabase. Ya pasó una vez: las
-- primeras tablas se protegieron a mano, la migración 004 creó
-- `notifications` sin que nadie volviera al panel, y estuvo abierta hasta
-- que lo avisó Supabase por correo. Ver migrations/005_rls.sql.
--
-- Deny-all y sin políticas: la app no lee por PostgREST, va por `pg` con
-- DATABASE_URL. Y sin FORCE, porque se conecta como `postgres`, que es el
-- dueño de las tablas y por eso se salta RLS. Forzarlo dejaría el sitio en
-- cero filas.

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- La segunda cerradura, y la que protege a las tablas que aún no existen:
-- sin privilegios, una tabla futura que se olvide de RLS responde igual
-- permission denied. `service_role` conserva los suyos (src/lib/storage.ts).
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
