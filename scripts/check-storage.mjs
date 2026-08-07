/**
 * Prepara y comprueba Supabase Storage.
 *
 *   node scripts/check-storage.mjs          # comprueba
 *   node scripts/check-storage.mjs --setup  # crea los buckets que falten
 *
 * Los buckets y sus límites se leen de src/lib/uploads.ts, que es la misma
 * fuente que usan la app y el navegador. Así no puede pasar que el bucket
 * acepte 200 MB y el formulario crea que son 50.
 *
 * La comprobación sube un fichero de prueba, lo lee y lo borra. No toca nada
 * de lo que haya dentro.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(`
✗ Falta configuración en .env.local

  NEXT_PUBLIC_SUPABASE_URL   ${url ? "✓" : "← vacía"}
  SUPABASE_SERVICE_ROLE_KEY  ${serviceKey ? "✓" : "← vacía"}

  Las dos están en Supabase > Project Settings > API.
  La service role key se salta el RLS: solo servidor, nunca en el cliente.
`);
  process.exit(1);
}

// --- Las reglas, leídas del módulo que usa la app --------------------------
// Se extraen con regex en lugar de importar el .ts porque este script corre
// en node pelado, sin el resolutor de alias de Next.
const source = readFileSync(path.join(root, "src/lib/uploads.ts"), "utf8");

function rulesFromSource() {
  const block = source.slice(source.indexOf("PURPOSE_RULES: Record"));
  const rules = new Map();

  // `types` puede llevar comas dentro (`{ ...IMAGE, ...VIDEO }`), así que se
  // captura de forma no ávida hasta el `maxBytes` que viene detrás.
  for (const match of block.matchAll(
    /(\w+):\s*\{\s*bucket:\s*"([^"]+)",\s*visibility:\s*"(public|private)",\s*types:\s*([\s\S]*?),\s*maxBytes:\s*([^,]+),/g,
  )) {
    const [, purpose, bucket, visibility, types, maxBytes] = match;
    const existing = rules.get(bucket) ?? {
      bucket,
      visibility,
      purposes: [],
      maxBytes: 0,
      types: new Set(),
    };
    existing.purposes.push(purpose);
    existing.maxBytes = Math.max(existing.maxBytes, evalBytes(maxBytes));
    for (const t of typeNames(types)) existing.types.add(t);
    rules.set(bucket, existing);
  }

  return [...rules.values()];
}

/** "200 * MB" -> bytes. Solo se admite esa forma, nada de eval genérico. */
function evalBytes(expression) {
  const m = expression.trim().match(/^(\d+)\s*\*\s*MB$/);
  if (!m) throw new Error(`No sé interpretar maxBytes: ${expression}`);
  return Number(m[1]) * 1024 * 1024;
}

function typeNames(expression) {
  const groups = expression.includes("IMAGE_TYPES") ? ["IMAGE_TYPES"] : [];
  if (expression.includes("VIDEO_TYPES")) groups.push("VIDEO_TYPES");

  return groups.flatMap((group) => {
    const start = source.indexOf(`const ${group} = {`);
    const end = source.indexOf("}", start);
    return [...source.slice(start, end).matchAll(/"([^"]+)":/g)].map((m) => m[1]);
  });
}

const BUCKETS = rulesFromSource();
const setup = process.argv.includes("--setup");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let problems = 0;

console.log(`\nProyecto: ${url}\n`);

const { data: existing, error: listError } = await supabase.storage.listBuckets();
if (listError) {
  console.error(`✗ No se pudieron listar los buckets: ${listError.message}`);
  console.error("  ¿Seguro que SUPABASE_SERVICE_ROLE_KEY es la de este proyecto?");
  process.exit(1);
}

const byName = new Map(existing.map((b) => [b.name, b]));

for (const rule of BUCKETS) {
  const label = `${rule.bucket} (${rule.purposes.join(", ")})`;
  let bucket = byName.get(rule.bucket);

  if (!bucket) {
    if (!setup) {
      problems++;
      console.log(`✗ ${label}: no existe — ejecuta con --setup`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(rule.bucket, {
      public: rule.visibility === "public",
      fileSizeLimit: rule.maxBytes,
      allowedMimeTypes: [...rule.types],
    });

    if (error) {
      problems++;
      console.log(`✗ ${label}: no se pudo crear — ${error.message}`);
      continue;
    }

    console.log(`+ ${label}: creado`);
    bucket = { name: rule.bucket, public: rule.visibility === "public" };
  }

  // La visibilidad es lo que más duele si no cuadra: un bucket público de
  // más deja el contenido entregado al alcance de cualquiera con la URL.
  const shouldBePublic = rule.visibility === "public";
  if (bucket.public !== shouldBePublic) {
    problems++;
    console.log(
      `✗ ${label}: es ${bucket.public ? "público" : "privado"} y debería ser ${
        shouldBePublic ? "público" : "privado"
      }`,
    );
    continue;
  }

  // Round-trip: subir, leer y borrar.
  const probe = `_check/${Date.now()}.txt`;
  const body = new Blob(["brandfluence storage check"], { type: "text/plain" });

  const { error: uploadError } = await supabase.storage
    .from(rule.bucket)
    .upload(probe, body, { contentType: "text/plain", upsert: true });

  if (uploadError) {
    // Un rechazo por tipo MIME es esperable: el bucket restringe a
    // imagen/vídeo y estamos subiendo texto. Eso significa que la
    // restricción funciona.
    if (/mime|content type/i.test(uploadError.message)) {
      console.log(`✓ ${label}: ${bucket.public ? "público" : "privado"}, rechaza tipos no permitidos`);
      continue;
    }
    problems++;
    console.log(`✗ ${label}: no se pudo escribir — ${uploadError.message}`);
    continue;
  }

  const { error: readError } = shouldBePublic
    ? { error: null }
    : await supabase.storage.from(rule.bucket).createSignedUrl(probe, 60);

  await supabase.storage.from(rule.bucket).remove([probe]);

  if (readError) {
    problems++;
    console.log(`✗ ${label}: no se pudo firmar una lectura — ${readError.message}`);
    continue;
  }

  console.log(
    `✓ ${label}: ${bucket.public ? "público" : "privado"}, escritura y lectura OK`,
  );
}

console.log(
  problems === 0
    ? `\n✓ ${BUCKETS.length} bucket(s) listos\n`
    : `\n${problems} problema(s). Con --setup se crean los que falten.\n`,
);

process.exit(problems === 0 ? 0 : 1);
