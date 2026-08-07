import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { patchDeliverable } from "@/lib/queries/collaborations";
import { deliverablePatchSchema } from "@/lib/validators";

/**
 * PATCH /api/collaborations/[id]/deliverables/[deliverableId]
 *
 * El creador marca un entregable como hecho, se desdice, o adjunta —o
 * quita— el fichero entregado. Es la parte del ciclo de vida que le
 * corresponde a él: la marca dice qué hay que entregar, el creador dice qué
 * ha entregado y enseña el qué.
 *
 * Un endpoint por entregable, y no un PUT de la lista entera, para que dos
 * cambios seguidos no se pisen.
 *
 * Ojo con el cuerpo: `media: null` desadjunta, y no mandar `media` lo deja
 * como estaba. Son cosas distintas y por eso el esquema las distingue.
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

  const parsed = deliverablePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id, deliverableId } = await params;

  const deliverables = await patchDeliverable(
    session.user.id,
    id,
    deliverableId,
    parsed.data,
  );
  if (!deliverables) {
    return NextResponse.json(
      { error: "Entregable no encontrado o colaboración cerrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ deliverables });
}
