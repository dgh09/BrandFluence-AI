import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { acceptCandidate } from "@/lib/queries/matches";

/**
 * POST /api/matches/[id]/accept — la marca acepta a un candidato.
 *
 * Es la contraparte de /apply: el creador se postula, la marca acepta, y de
 * ahí nace la colaboración. El importe acordado sale del presupuesto de la
 * campaña; negociarlo es cosa de una iteración posterior.
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
      { error: "Solo las marcas pueden aceptar candidatos" },
      { status: 403 },
    );
  }

  const { id } = await params;

  const collaboration = await acceptCandidate(session.user.id, id);
  if (!collaboration) {
    // Cubre tres casos: no existe, no es de esta marca, o el creador no ha
    // aplicado. No los distinguimos — decir "existe pero no es tuyo"
    // filtraría información, igual que en /apply.
    return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
  }

  void query(
    `INSERT INTO events (user_id, event_type, entity_type, entity_id)
     VALUES ($1, 'match_accept', 'match', $2)`,
    [session.user.id, id],
  ).catch(() => {});

  return NextResponse.json(collaboration, { status: 201 });
}
