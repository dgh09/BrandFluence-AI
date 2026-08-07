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
// Sin los comentarios de línea: si no, un `//` entre `types` y `maxBytes`
// rompe la extracción, y lo hace en silencio —que es lo peligroso.
const source = readFileSync(path.join(root, "src/lib/uploads.ts"), "utf8").replace(
  /^\s*\/\/.*$/gm,
  "",
);

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

/**
 * Que la extracción haya encontrado TODOS los propósitos declarados.
 *
 * Sin esto, un cambio de formato en uploads.ts hace que el regex se salte un
 * bucket y el script diga "todo listo" habiendo comprobado la mitad. Un
 * verificador que verifica de menos sin avisar es peor que no tener ninguno.
 */
const declared = [...source.matchAll(/UPLOAD_PURPOSES\s*=\s*\[([\s\S]*?)\]/g)].flatMap(
  (m) => [...m[1].matchAll(/"([^"]+)"/g)].map((p) => p[1]),
);
const parsed = BUCKETS.flatMap((b) => b.purposes);
const missing = declared.filter((p) => !parsed.includes(p));

if (declared.length === 0 || missing.length > 0) {
  console.error(
    `\n✗ No pude leer las reglas de src/lib/uploads.ts.\n` +
      `  Declarados: ${declared.join(", ") || "(ninguno)"}\n` +
      `  Encontrados: ${parsed.join(", ") || "(ninguno)"}\n` +
      `  Cambió el formato de PURPOSE_RULES y hay que ajustar este script.\n`,
  );
  process.exit(1);
}

/** PNG transparente de 1×1. El fichero válido más pequeño que existe. */
const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

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
      // Este fallo concreto despista: no habla del bucket, habla del límite
      // global del proyecto, que un bucket no puede superar.
      if (/maximum allowed size/i.test(error.message)) {
        console.log(
          `  El proyecto no admite ficheros de ${Math.round(rule.maxBytes / 1024 / 1024)} MB.\n` +
            "  El plan gratuito tope a 50 MB. Baja maxBytes en src/lib/uploads.ts,\n" +
            "  o sube el límite en Supabase > Settings > Storage y vuelve a intentarlo.",
        );
      }
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

  // Round-trip de verdad: subir, LEER de vuelta por HTTP y borrar.
  //
  // El fichero de prueba es un PNG real de 1×1 y no un texto, porque el
  // bucket restringe los tipos: con un .txt el rechazo sería inmediato y
  // nunca se llegaría a probar ni la escritura ni la lectura.
  const probe = `_check/${Date.now()}.png`;
  const body = Buffer.from(ONE_PIXEL_PNG_BASE64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(rule.bucket)
    .upload(probe, body, { contentType: "image/png", upsert: true });

  if (uploadError) {
    problems++;
    console.log(`✗ ${label}: no se pudo escribir — ${uploadError.message}`);
    continue;
  }

  // Un bucket público se lee por URL directa; uno privado, solo firmado.
  // Se comprueba descargando de verdad: que la URL exista no prueba nada.
  let readUrl;
  if (shouldBePublic) {
    readUrl = supabase.storage.from(rule.bucket).getPublicUrl(probe).data.publicUrl;
  } else {
    const { data, error } = await supabase.storage
      .from(rule.bucket)
      .createSignedUrl(probe, 60);
    if (error) {
      problems++;
      console.log(`✗ ${label}: no se pudo firmar una lectura — ${error.message}`);
      await supabase.storage.from(rule.bucket).remove([probe]);
      continue;
    }
    readUrl = data.signedUrl;
  }

  const download = await fetch(readUrl);
  const bytes = download.ok ? (await download.arrayBuffer()).byteLength : 0;

  // Y que un bucket privado NO se deje leer sin firmar. Es la comprobación
  // que de verdad importa: el contenido entregado puede ser material sin
  // publicar, y un bucket privado por error dejaría de serlo en silencio.
  let leaks = false;
  if (!shouldBePublic) {
    const naked = supabase.storage.from(rule.bucket).getPublicUrl(probe).data.publicUrl;
    leaks = (await fetch(naked)).ok;
  }

  await supabase.storage.from(rule.bucket).remove([probe]);

  if (!download.ok || bytes !== body.length) {
    problems++;
    console.log(
      `✗ ${label}: se escribió pero no se pudo leer de vuelta ` +
        `(HTTP ${download.status}, ${bytes} de ${body.length} bytes)`,
    );
    continue;
  }

  if (leaks) {
    problems++;
    console.log(`✗ ${label}: ¡es privado pero se lee sin firmar!`);
    continue;
  }

  console.log(
    `✓ ${label}: ${bucket.public ? "público" : "privado"} · ` +
      `escritura y lectura OK (${bytes} bytes)` +
      (shouldBePublic ? "" : " · no se lee sin firmar"),
  );
}

console.log(
  problems === 0
    ? `\n✓ ${BUCKETS.length} bucket(s) listos\n`
    : `\n${problems} problema(s). Con --setup se crean los que falten.\n`,
);

process.exit(problems === 0 ? 0 : 1);
