-- ============================================================================
-- 001 — Pago declarado por las partes
-- ============================================================================
--
-- Ejecutar en el SQL Editor de Supabase. Es IDEMPOTENTE: se puede lanzar dos
-- veces sin error, al contrario que schema.sql.
--
-- Contexto: BrandFluence NO mueve dinero. En Colombia, retener fondos de
-- terceros puede caer en el terreno de la captación de recursos y en el
-- ámbito de la Superintendencia Financiera. Aquí la plataforma solo registra
-- lo que cada parte declara sobre un pago que ocurre FUERA:
--
--   pending ──la marca declara que pagó──> processing
--           ──el creador confirma que lo recibió──> completed
--
-- Las columnas describen el pago externo, no un cobro nuestro. El día que
-- entre una pasarela (Wompi, Mercado Pago), estos mismos campos sirven para
-- conciliar: paid_at y payment_reference son lo que hay que casar.

ALTER TABLE collaborations
  -- Cuándo dice la marca que pagó. Lo declara ella, no lo observamos.
  ADD COLUMN IF NOT EXISTS paid_at              TIMESTAMPTZ,
  -- Por dónde. Vocabulario cerrado: en Colombia la mayoría no es tarjeta.
  ADD COLUMN IF NOT EXISTS payment_method       TEXT,
  -- Referencia o comprobante, tal cual lo teclea la marca.
  ADD COLUMN IF NOT EXISTS payment_reference    TEXT,
  -- Cuándo lo confirmó el creador. Es la otra mitad de la verdad.
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

-- El CHECK va aparte y con guarda: ADD CONSTRAINT no admite IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collaborations_payment_method_check'
  ) THEN
    ALTER TABLE collaborations
      ADD CONSTRAINT collaborations_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN
             ('transferencia', 'nequi', 'daviplata', 'efectivo', 'otro'));
  END IF;
END $$;

-- Para la futura pantalla de "qué tengo pendiente de cobrar".
CREATE INDEX IF NOT EXISTS idx_collaborations_payment
  ON collaborations(payment_status);
