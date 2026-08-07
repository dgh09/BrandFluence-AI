import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getCollaboration } from "@/lib/queries/collaborations";
import { createUploadTicket, StorageNotConfiguredError } from "@/lib/storage";
import { checkUpload } from "@/lib/uploads";
import { uploadRequestSchema } from "@/lib/validators";

/**
 * POST /api/uploads — devuelve un permiso firmado para subir un fichero.
 *
 * Los bytes NO pasan por aquí: el navegador sube directo a Supabase con el
 * permiso que devuelve esta ruta. Un vídeo de 200 MB no cabe en el cuerpo de
 * una función serverless.
 *
 * Lo que sí decide esta ruta es quién puede subir qué y a dónde. La ruta del
 * objeto se construye en el servidor a partir de la sesión; el cliente no la
 * propone ni la puede influir.
 */
export async function POST(request: Request) {
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

  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { purpose, contentType, size, collaborationId } = parsed.data;

  // Tipo y tamaño antes que nada: no tiene sentido comprobar permisos de
  // algo que no se va a aceptar de todas formas.
  const invalid = checkUpload(purpose, contentType, size);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  // Quién puede subir qué, y bajo qué identificador se agrupa el fichero.
  let ownerId: string;

  if (purpose === "avatar") {
    if (session.user.userType !== "creator") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    ownerId = session.user.id;
  } else if (purpose === "logo") {
    if (session.user.userType !== "brand") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    ownerId = session.user.id;
  } else {
    // El contenido entregado lo sube el creador, y solo a una colaboración
    // suya que siga abierta. Se reutiliza getCollaboration porque su WHERE
    // ya resuelve "es parte de esto y con qué papel".
    if (!collaborationId) {
      return NextResponse.json(
        { error: "Falta la colaboración" },
        { status: 400 },
      );
    }

    const collaboration = await getCollaboration(session.user.id, collaborationId);
    if (
      !collaboration ||
      collaboration.viewerRole !== "creator" ||
      collaboration.status !== "active"
    ) {
      return NextResponse.json(
        { error: "Colaboración no encontrada o ya cerrada" },
        { status: 404 },
      );
    }

    ownerId = collaboration.id;
  }

  try {
    const ticket = await createUploadTicket(purpose, ownerId, contentType);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      console.error("[uploads]", error.message);
      return NextResponse.json(
        { error: "Las subidas no están configuradas en este entorno" },
        { status: 503 },
      );
    }
    throw error;
  }
}
