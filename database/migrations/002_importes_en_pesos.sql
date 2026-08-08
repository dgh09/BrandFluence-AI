-- ============================================================================
-- 002 — Los importes pasan a pesos colombianos
-- ============================================================================
--
-- Ejecutar en el SQL Editor de Supabase. Idempotente: ALTER TYPE a la misma
-- precisión no falla ni reescribe nada.
--
-- El cambio de moneda no es solo de etiqueta. Un peso vale unas 4.000 veces
-- menos que un euro, así que las mismas cantidades pasan a tener cuatro
-- dígitos más, y DECIMAL(10,2) topa en 99.999.999,99 — unos 24.000 USD.
-- El presupuesto mensual de una marca mediana lo desborda con facilidad, y
-- Postgres no lo trunca: da error 22003 y la operación falla.
--
-- DECIMAL(14,2) deja sitio hasta el billón de pesos. Se conservan los dos
-- decimales aunque el centavo de peso no circule: ampliar la precisión es
-- una operación segura, y reducir la escala reescribiría los datos.
--
-- NO se convierten los valores existentes. Los que hay son datos de demo
-- pensados en euros; se regeneran con `node scripts/seed-demo.mjs --clean`
-- y otra vez `seed-demo.mjs`. Si algún día hay importes reales, una
-- conversión pide su propia migración y una decisión sobre el tipo de
-- cambio, no un multiplicador metido aquí a ojo.

ALTER TABLE brands        ALTER COLUMN monthly_budget TYPE DECIMAL(14,2);
ALTER TABLE campaigns     ALTER COLUMN budget         TYPE DECIMAL(14,2);
ALTER TABLE collaborations ALTER COLUMN agreed_amount TYPE DECIMAL(14,2);
