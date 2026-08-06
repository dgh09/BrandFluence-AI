import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { setMatchStatus } from "@/lib/queries/matches";

/** POST /api/matches/[id]/dismiss — el creador descarta la sugerencia. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "creator") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const updated = await setMatchStatus(session.user.id, id, "rejected");
  if (!updated) {
    return NextResponse.json({ error: "Match no encontrado" }, { status: 404 });
  }

  void query(
    `INSERT INTO events (user_id, event_type, entity_type, entity_id)
     VALUES ($1, 'match_dismiss', 'match', $2)`,
    [session.user.id, id],
  ).catch(() => {});

  return NextResponse.json(updated);
}
