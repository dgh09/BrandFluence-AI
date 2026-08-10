import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { declineCandidate } from "@/lib/queries/matches";

/**
 * POST /api/matches/[id]/decline — la marca rechaza a un candidato.
 *
 * Es la contraparte de /accept, igual que /dismiss lo es de /apply. Cada rol
 * tiene su verbo y su estado: el creador descarta ('rejected'), la marca
 * rechaza ('declined').
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "brand") {
    return NextResponse.json(
      { error: "Solo las marcas pueden rechazar candidatos" },
      { status: 403 },
    );
  }

  const { id } = await params;

  const updated = await declineCandidate(session.user.id, id);
  if (!updated) {
    // No existe, no es de esta marca, el creador no ha aplicado, o ya hay
    // colaboración abierta. No los distinguimos, igual que en /accept.
    return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
  }

  void query(
    `INSERT INTO events (user_id, event_type, entity_type, entity_id)
     VALUES ($1, 'match_decline', 'match', $2)`,
    [session.user.id, id],
  ).catch(() => {});

  return NextResponse.json(updated);
}
