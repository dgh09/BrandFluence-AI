import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { setMatchStatus } from "@/lib/queries/matches";
import { matchApplied } from "@/lib/notifications";
import { matchParties, notify } from "@/lib/queries/notifications";

/** POST /api/matches/[id]/apply — el creador se postula a la campaña. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "creator") {
    return NextResponse.json(
      { error: "Solo los creadores pueden aplicar a campañas" },
      { status: 403 },
    );
  }

  const { id } = await params;

  const updated = await setMatchStatus(session.user.id, id, "interested");
  if (!updated) {
    // O el match no existe, o no es de este creador. No distinguimos:
    // decir "existe pero no es tuyo" filtraría información.
    return NextResponse.json({ error: "Match no encontrado" }, { status: 404 });
  }

  void query(
    `INSERT INTO events (user_id, event_type, entity_type, entity_id)
     VALUES ($1, 'match_apply', 'match', $2)`,
    [session.user.id, id],
  ).catch(() => {});

  // Se entera la marca. notify() no lanza: la candidatura ya está guardada.
  const parties = await matchParties(id);
  if (parties) {
    await notify([
      {
        userId: parties.brandUserId,
        content: matchApplied({
          matchId: id,
          campaignTitle: parties.campaignTitle,
          creatorUsername: parties.creatorUsername,
        }),
      },
    ]);
  }

  return NextResponse.json(updated);
}
