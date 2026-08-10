import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { setDeliverables } from "@/lib/queries/collaborations";
import { deliverablesSchema } from "@/lib/validators";
import { deliverablesDefined } from "@/lib/notifications";
import { collaborationParties, notify } from "@/lib/queries/notifications";

/**
 * PUT /api/collaborations/[id]/deliverables — la marca fija la lista.
 *
 * PUT y no PATCH porque el cuerpo es la lista completa: lo que mandes es lo
 * que queda. Añadir, renombrar, reordenar y borrar son la misma operación.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "brand") {
    return NextResponse.json(
      { error: "Solo la marca define los entregables" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const parsed = deliverablesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = await params;

  const deliverables = await setDeliverables(session.user.id, id, parsed.data);
  if (!deliverables) {
    // No existe, no es de esta marca, o ya está cerrada. No los
    // distinguimos: decir cuál filtraría información.
    return NextResponse.json(
      { error: "Colaboración no encontrada o ya cerrada" },
      { status: 404 },
    );
  }

  // Se entera el creador: es él quien tiene que hacer lo que aparezca en esa
  // lista. Vaciarla no avisa — no hay nada que ir a mirar.
  const parties = deliverables.length > 0 ? await collaborationParties(id) : null;
  if (parties) {
    await notify([
      {
        userId: parties.creatorUserId,
        content: deliverablesDefined({
          collaborationId: id,
          campaignTitle: parties.campaignTitle,
          brandName: parties.brandName,
          count: deliverables.length,
        }),
      },
    ]);
  }

  return NextResponse.json({ deliverables });
}
