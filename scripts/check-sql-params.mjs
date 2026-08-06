/**
 * Comprueba que cada consulta SQL usa exactamente los parámetros que recibe.
 *
 *   node scripts/check-sql-params.mjs
 *
 * Existe porque este fallo ya se coló dos veces: escribir `$2` en el SQL
 * pasando un solo parámetro. Postgres responde 42P18 "could not determine
 * data type of parameter", que en runtime es un 500 y en compilación no da
 * ninguna señal — TypeScript no mira dentro de la cadena SQL.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = "src";

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

/** Cuenta argumentos de nivel superior en el array de parámetros. */
function countArgs(source) {
  // Quita la coma final de los arrays multilínea; si no, cuenta un
  // parámetro fantasma y marca desajustes que no existen.
  const trimmed = source.trim().replace(/,\s*$/, "");
  if (!trimmed) return 0;

  let depth = 0;
  let count = 1;
  for (const ch of trimmed) {
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    else if (ch === "," && depth === 0) count++;
  }
  return count;
}

// La coma final antes del `)` es opcional: el formateador la añade en las
// llamadas multilínea, y sin contemplarla el regex se salta casi todas.
const CALL =
  /query(?:One)?(?:<[\s\S]*?>)?\(\s*`([\s\S]*?)`\s*,\s*\[([\s\S]*?)\]\s*,?\s*\)/g;
const PLACEHOLDER = /\$(\d+)/g;

let problems = 0;
let checked = 0;

for (const file of walk(SRC)) {
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(CALL)) {
    const [, sql, args] = match;
    checked++;

    const used = [...sql.matchAll(PLACEHOLDER)].map((m) => Number(m[1]));
    const highest = used.length ? Math.max(...used) : 0;
    const passed = countArgs(args);

    const unused = [];
    for (let i = 1; i <= Math.max(highest, passed); i++) {
      if (!used.includes(i)) unused.push(`$${i}`);
    }

    if (highest !== passed || unused.length > 0) {
      problems++;
      const line = source.slice(0, match.index).split("\n").length;
      console.log(`\n✗ ${file}:${line}`);
      console.log(`  placeholder más alto: $${highest} · parámetros pasados: ${passed}`);
      if (unused.length) console.log(`  declarados pero sin usar: ${unused.join(", ")}`);
      console.log(`  ${sql.trim().split("\n")[0].slice(0, 72)}`);
    }
  }
}

console.log(
  problems === 0
    ? `\n✓ ${checked} consultas revisadas, todas cuadran`
    : `\n${problems} desajuste(s) en ${checked} consultas`,
);

process.exit(problems === 0 ? 0 : 1);
