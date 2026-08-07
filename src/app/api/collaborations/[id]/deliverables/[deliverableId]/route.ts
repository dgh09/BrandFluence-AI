import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { setDeliverableDone } from "@/lib/queries/collaborations";
import { deliverableDoneSchema } from "@/lib/validators";

/**
 * PATCH /api/collaborations/[id]/deliverables/[deliverableId]
 *
 * El creador marca un entregable como hecho, o se desdice. Es la única parte
 * del ciclo de vida que le corresponde a él: la marca dice qué hay que
 * entregar, el creador dice qué ha entregado.
 *
 * Un endpoint por entregable, y no un PUT de la lista entera, para que dos
 * marcados seguidos no se pisen entre ellos.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; deliverableId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "creator") {
    return NextResponse.json(
      { error: "Solo el creador marca los entregables" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const parsed = deliverableDoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id, deliverableId } = await params;

  const deliverables = await setDeliverableDone(
    session.user.id,
    id,
    deliverableId,
    parsed.data.done,
  );
  if (!deliverables) {
    return NextResponse.json(
      { error: "Entregable no encontrado o colaboración cerrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ deliverables });
}
