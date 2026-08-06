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
  monthly_budget DECIMAL(10,2),
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
  budget        DECIMAL(10,2),
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
  status      TEXT NOT NULL DEFAULT 'suggested'
              CHECK (status IN ('suggested', 'interested', 'rejected', 'accepted')),
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
  agreed_amount       DECIMAL(10,2),
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'processing', 'completed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
