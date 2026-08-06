import { Pool, type QueryResultRow } from "pg";

/**
 * Pool de Postgres (Supabase).
 *
 * En serverless cada invocación puede crear un pool nuevo, así que lo
 * cacheamos en globalThis para no agotar las conexiones de Supabase.
 *
 * IMPORTANTE: usa la connection string del **pooler** de Supabase
 * (puerto 6543, modo transaction), no la directa del 5432.
 */

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

let localPool: Pool | null = null;

/**
 * El pool se crea en la PRIMERA consulta, no al importar el módulo.
 * Si se creara al importar, `next build` fallaría al recolectar las rutas
 * (no hay DATABASE_URL en el entorno de build de Vercel).
 */
function getPool(): Pool {
  const cached = globalThis._pgPool ?? localPool;
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL en el entorno (.env.local)");
  }

  localPool = new Pool({
    connectionString,
    // Supabase exige SSL. El certificado es de una CA que Node no trae
    // por defecto, de ahí el rejectUnauthorized: false.
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis._pgPool = localPool;
  }

  return localPool;
}

/**
 * Se comporta como un Pool normal, pero resuelve el pool real de forma
 * perezosa en el primer acceso a cualquier propiedad.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** Query tipada. Siempre con parámetros ($1, $2...) — nunca concatenes SQL. */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/** Igual que query() pero devuelve la primera fila o null. */
export async function queryOne<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
