/**
 * Comprueba que el schema `public` no está publicado a internet.
 *   node scripts/check-rls.mjs
 *
 * Solo lee. Sale con código 1 si encuentra algo abierto.
 *
 * Existe porque las cuatro capas de comprobación del proyecto miran el camino
 * que pasa por la app, y esto no es un camino que la app recorra: Supabase
 * sirve `public` por PostgREST con la clave `anon`, que va en el bundle del
 * navegador. En agosto de 2026 `notifications` estuvo abierta y no lo cazó
 * ningún test; lo avisó Supabase por correo. Ver migrations/005_rls.sql.
 *
 * Dos condiciones, y basta con que falle una para estar expuesto:
 *   1. RLS activado en todas las tablas de `public`.
 *   2. `anon` y `authenticated` sin privilegios sobre `public`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const raw = readFileSync(path.join(root, file), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv(".env.local");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows: tables } = await client.query(`
  SELECT c.relname AS tabla,
         c.relrowsecurity AS rls,
         (SELECT count(*)::int FROM pg_policy p WHERE p.polrelid = c.oid) AS policies
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
   ORDER BY c.relname
`);

const { rows: grants } = await client.query(`
  SELECT table_name, grantee,
         string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type) AS privs
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
   GROUP BY table_name, grantee
   ORDER BY table_name, grantee
`);

const sinRls = tables.filter((t) => !t.rls);

console.log(`Tablas en public: ${tables.length}`);
for (const t of tables) {
  const nota = t.policies > 0 ? ` · ${t.policies} política(s)` : "";
  console.log(`  ${t.rls ? "✓" : "✗"} ${t.tabla.padEnd(20)} RLS ${t.rls ? "ON" : "OFF"}${nota}`);
}
console.log("");

if (sinRls.length > 0) {
  console.error(`✗ ${sinRls.length} tabla(s) SIN RLS: ${sinRls.map((t) => t.tabla).join(", ")}`);
} else {
  console.log("✓ RLS activado en todas");
}

if (grants.length > 0) {
  console.error(`✗ anon/authenticated conservan privilegios sobre ${grants.length} tabla(s):`);
  for (const g of grants) console.error(`    ${g.table_name} · ${g.grantee} · ${g.privs}`);
} else {
  console.log("✓ anon y authenticated sin privilegios sobre public");
}

await client.end();

if (sinRls.length > 0 || grants.length > 0) {
  console.error("\nAplica database/migrations/005_rls.sql");
  process.exit(1);
}

console.log("\nEl schema public no está publicado.");
