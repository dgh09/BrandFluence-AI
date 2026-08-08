/**
 * Siembra datos de demo para ver el dashboard con contenido real.
 *   node scripts/seed-demo.mjs          → crea
 *   node scripts/seed-demo.mjs --clean  → borra
 *
 * Todo lo que crea usa emails @brandfluence.demo, así que el borrado es
 * seguro y no toca cuentas reales.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const DEMO_DOMAIN = "brandfluence.demo";
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

if (process.argv.includes("--clean")) {
  const { rowCount } = await client.query(
    `DELETE FROM users WHERE email LIKE $1`,
    [`%@${DEMO_DOMAIN}`],
  );
  console.log(`Borrados ${rowCount} usuarios de demo (cascada limpia el resto).`);
  await client.end();
  process.exit(0);
}

const hash = await bcrypt.hash("demo1234", 12);

await client.query("BEGIN");

// --- Creador ---------------------------------------------------------------
const { rows: [creatorUser] } = await client.query(
  `INSERT INTO users (email, name, password_hash, user_type)
   VALUES ($1, 'Lucía Márquez', $2, 'creator') RETURNING id`,
  [`creador@${DEMO_DOMAIN}`, hash],
);
const { rows: [creator] } = await client.query(
  `INSERT INTO creators (user_id, username, niche, follower_count, engagement_rate, bio)
   VALUES ($1, 'luciamarquez', 'fitness', 48200, 5.40, 'Rutinas en casa y nutrición')
   RETURNING id`,
  [creatorUser.id],
);

// --- Marca -----------------------------------------------------------------
const { rows: [brandUser] } = await client.query(
  `INSERT INTO users (email, name, password_hash, user_type)
   VALUES ($1, 'Ironpeak Fitness', $2, 'brand') RETURNING id`,
  [`marca@${DEMO_DOMAIN}`, hash],
);
const { rows: [brand] } = await client.query(
  `INSERT INTO brands (user_id, company_name, industry, monthly_budget)
   VALUES ($1, 'Ironpeak Fitness', 'deporte', 12000000) RETURNING id`,
  [brandUser.id],
);

// --- Campañas + matches ----------------------------------------------------
const campaigns = [
  ["Lanzamiento proteína vegana", "fitness", 2500000, 10000, 92.5],
  ["Reto 30 días en casa", "fitness", 1800000, 20000, 78.0],
  ["Colección ropa técnica SS26", "moda", 3200000, 50000, 41.0],
];

for (const [title, niche, budget, minFollowers, score] of campaigns) {
  const { rows: [campaign] } = await client.query(
    `INSERT INTO campaigns (brand_id, title, target_niche, budget, min_followers, status, objective)
     VALUES ($1, $2, $3, $4, $5, 'published', 'awareness') RETURNING id`,
    [brand.id, title, niche, budget, minFollowers],
  );
  await client.query(
    `INSERT INTO matches (creator_id, campaign_id, match_score, status, score_reason)
     VALUES ($1, $2, $3, 'suggested', $4)`,
    [creator.id, campaign.id, score, JSON.stringify({ niche, minFollowers })],
  );
}

await client.query("COMMIT");

console.log("Datos de demo creados:");
console.log(`  creador@${DEMO_DOMAIN} / demo1234   (Lucía Márquez, fitness, 48.2k)`);
console.log(`  marca@${DEMO_DOMAIN}   / demo1234   (Ironpeak Fitness)`);
console.log(`  3 campañas publicadas, 3 matches sugeridos`);

await client.end();
