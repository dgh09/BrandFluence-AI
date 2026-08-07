import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDeliverableMedia } from "@/lib/queries/collaborations";
import { createReadUrl, StorageNotConfiguredError } from "@/lib/storage";
import { PURPOSE_RULES } from "@/lib/uploads";

/**
 * GET /api/collaborations/[id]/deliverables/[deliverableId]/media
 *
 * Sirve el fichero entregado redirigiendo a una URL firmada que caduca.
 *
 * Se hace así, y no guardando la URL firmada en la base, porque una URL
 * firmada envejece: la que se guardara hoy dejaría de funcionar mañana. Aquí
 * la autorización se comprueba **en cada petición**, y el enlace que sale de
 * esta ruta vive lo justo para que el navegador lo siga.
 *
 * Como consecuencia, en la página basta con `<img src="…/media">`: el
 * navegador sigue el 302 solo, y un `<video>` puede pedir rangos
 * directamente contra Supabase sin volver a pasar por esta app.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; deliverableId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id, deliverableId } = await params;

  // La misma consulta decide si esta persona es parte de la colaboración y
  // cuál es el fichero. No hay una comprobación aparte que se pueda olvidar.
  const media = await getDeliverableMedia(session.user.id, id, deliverableId);
  if (!media) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  let signed: string | null;
  try {
    signed = await createReadUrl(
      PURPOSE_RULES.deliverable.bucket,
      media.path,
      60,
    );
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      console.error("[media]", error.message);
      return NextResponse.json({ error: "No disponible" }, { status: 503 });
    }
    throw error;
  }

  if (!signed) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  redirect(signed);
}
