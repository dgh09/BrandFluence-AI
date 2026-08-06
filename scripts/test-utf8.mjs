/**
 * Comprueba que un POST con caracteres españoles llega intacto a Postgres.
 * Relevante porque el producto es en español: si la API rompe las eñes,
 * está roto de raíz.
 *
 *   node scripts/test-utf8.mjs <ruta-cookie-jar>
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

// Netscape cookie jar: campos separados por tabulador, nombre en la 6ª columna.
// Las cookies HttpOnly llevan el prefijo "#HttpOnly_" en el dominio — hay que
// quitarlo, no descartar la línea: la de sesión es justamente HttpOnly.
const jarPath = process.argv[2];
const cookie = readFileSync(jarPath, "utf8")
  .split(/\r?\n/)
  .map((l) => l.replace(/^#HttpOnly_/, ""))
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split("\t"))
  .filter((p) => p.length >= 7)
  .map((p) => `${p[5]}=${p[6]}`)
  .join("; ");

const TITLE = "Campaña otoño: diseño español";
const DESCRIPTION = "Prueba UTF-8: ñ á é í ó ú ¿? ¡! ü";
const MARKER = 987;

const response = await fetch("http://localhost:3000/api/campaigns", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    title: TITLE,
    targetNiche: "moda",
    minFollowers: 1000,
    budget: MARKER,
    description: DESCRIPTION,
  }),
});

console.log("POST ->", response.status);
if (!response.ok) {
  console.log(await response.text());
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows } = await client.query(
  "SELECT title, description FROM campaigns WHERE budget = $1",
  [MARKER],
);

const stored = rows[0];
console.log("enviado :", TITLE);
console.log("guardado:", stored.title);
console.log(
  stored.title === TITLE && stored.description === DESCRIPTION
    ? "RESULTADO: idéntico — UTF-8 correcto de extremo a extremo"
    : "RESULTADO: NO COINCIDE — hay corrupción de codificación",
);

await client.query("DELETE FROM campaigns WHERE budget = $1", [MARKER]);
await client.end();
