import { NextResponse } from "next/server";

import { regenerateAllMatches } from "@/lib/queries/matching";

/**
 * POST /api/matches/regenerate
 *
 * Recalcula los matches de todas las campañas abiertas. Se usa tras tocar
 * los pesos del algoritmo, y más adelante desde un cron.
 *
 * No va con sesión de usuario a propósito: es una operación cara y ningún
 * usuario normal debería poder dispararla. Va con un token propio, de forma
 * que un cron pueda llamarla sin iniciar sesión.
 *
 * Si MATCHING_ADMIN_TOKEN no está definido, la ruta queda cerrada: es mejor
 * que fallar abierto por un despiste de configuración.
 */
export async function POST(request: Request) {
  const expected = process.env.MATCHING_ADMIN_TOKEN;

  if (!expected) {
    console.error("[regenerate] MATCHING_ADMIN_TOKEN no está configurado");
    return NextResponse.json({ error: "No disponible" }, { status: 503 });
  }

  const provided = request.headers.get("x-admin-token");
  if (provided !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const startedAt = Date.now();
  const result = await regenerateAllMatches();

  return NextResponse.json({ ...result, elapsedMs: Date.now() - startedAt });
}
