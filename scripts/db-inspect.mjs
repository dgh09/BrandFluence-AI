/**
 * Inspecciona el estado del schema `public` en Supabase.
 *   node scripts/db-inspect.mjs
 *
 * Solo lee. Útil para saber qué hay creado antes de aplicar migraciones.
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
  SELECT c.relname AS table,
         (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = c.relname) AS cols
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
   ORDER BY c.relname
`);

console.log(`\nTablas en public: ${tables.length}`);
for (const t of tables) console.log(`  · ${t.table.padEnd(20)} ${t.cols} columnas`);

const { rows: triggers } = await client.query(`
  SELECT tgname FROM pg_trigger
   WHERE NOT tgisinternal
   ORDER BY tgname
`);
console.log(`\nTriggers: ${triggers.length ? triggers.map((t) => t.tgname).join(", ") : "ninguno"}`);

const { rows: counts } = await client.query(`
  SELECT relname AS table, n_live_tup AS filas
    FROM pg_stat_user_tables
   WHERE schemaname = 'public' AND n_live_tup > 0
   ORDER BY n_live_tup DESC
`);
console.log(
  `\nTablas con datos: ${counts.length ? counts.map((c) => `${c.table}(${c.filas})`).join(", ") : "ninguna — vacío, seguro para recrear"}`,
);

await client.end();
