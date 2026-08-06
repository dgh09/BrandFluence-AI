-- ============================================================================
-- BrandFluence AI — Reset del schema
-- ============================================================================
--
-- ⚠️ DESTRUCTIVO: borra todas las tablas de la aplicación y sus datos.
--    Úsalo solo en desarrollo, cuando quieras volver a aplicar schema.sql
--    desde cero. Después de esto, ejecuta schema.sql.
--
--    Comprueba antes que no hay datos que te importen:
--      node scripts/db-inspect.mjs
--
-- Solo toca el schema `public` (el nuestro). Los schemas internos de
-- Supabase (auth, storage, realtime) no se tocan.

DROP TABLE IF EXISTS fraud_reports   CASCADE;
DROP TABLE IF EXISTS events          CASCADE;
DROP TABLE IF EXISTS collaborations  CASCADE;
DROP TABLE IF EXISTS matches         CASCADE;
DROP TABLE IF EXISTS campaigns       CASCADE;
DROP TABLE IF EXISTS brands          CASCADE;
DROP TABLE IF EXISTS creators        CASCADE;

-- Auth.js
DROP TABLE IF EXISTS verification_token CASCADE;
DROP TABLE IF EXISTS sessions           CASCADE;
DROP TABLE IF EXISTS accounts           CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
