import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { closeCollaboration } from "@/lib/queries/collaborations";
import { collaborationStatusSchema } from "@/lib/validators";
import { collaborationClosed } from "@/lib/notifications";
import { collaborationParties, notify } from "@/lib/queries/notifications";

/**
 * POST /api/collaborations/[id]/status — cierra la colaboración.
 *
 * No filtramos aquí por userType: quién puede completar y quién puede
 * cancelar lo decide el WHERE de closeCollaboration, que es donde vive la
 * relación real entre esta persona y esta colaboración. Repetir la regla en
 * dos sitios es la forma de que un día dejen de coincidir.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const parsed = collaborationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Estado no válido", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = await params;

  const updated = await closeCollaboration(
    session.user.id,
    id,
    parsed.data.status,
  );
  if (!updated) {
    return NextResponse.json(
      { error: "No se puede cerrar esta colaboración" },
      { status: 404 },
    );
  }

  void query(
    `INSERT INTO events (user_id, event_type, entity_type, entity_id)
     VALUES ($1, $2, 'collaboration', $3)`,
    [session.user.id, `collaboration_${updated.status}`, id],
  ).catch(() => {});

  // Se entera quien NO cerró. Cuál de los dos es depende de quién sea el que
  // ha llamado, y eso se resuelve comparando con las dos partes: aquí no
  // filtramos por userType (ver la cabecera), así que no se puede deducir
  // del rol de la sesión sin repetir la regla que ya vive en el WHERE.
  const parties = await collaborationParties(id);
  if (parties) {
    const closedByBrand = parties.brandUserId === session.user.id;
    await notify([
      {
        userId: closedByBrand ? parties.creatorUserId : parties.brandUserId,
        content: collaborationClosed({
          collaborationId: id,
          campaignTitle: parties.campaignTitle,
          status: updated.status as "completed" | "cancelled",
          closedByName: closedByBrand
            ? parties.brandName
            : parties.creatorUsername
              ? `@${parties.creatorUsername}`
              : null,
        }),
      },
    ]);
  }

  return NextResponse.json(updated);
}
