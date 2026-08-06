import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/health — para el uptime monitor (updown.io) del doc de arquitectura. */
export async function GET() {
  const startedAt = Date.now();

  try {
    await query("SELECT 1");
    return NextResponse.json({
      status: "ok",
      db: "up",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[health] la base de datos no responde:", error);
    return NextResponse.json(
      { status: "degraded", db: "down", latencyMs: Date.now() - startedAt },
      { status: 503 },
    );
  }
}
