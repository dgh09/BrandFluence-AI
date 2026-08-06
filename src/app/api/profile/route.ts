import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  UsernameTakenError,
  getBrandProfile,
  getCreatorProfile,
  updateBrandProfile,
  updateCreatorProfile,
} from "@/lib/queries/profile";
import { generateMatchesForCreator } from "@/lib/queries/matching";
import { brandProfileSchema, creatorProfileSchema } from "@/lib/validators";

/**
 * Perfil del usuario autenticado.
 *
 * Deliberadamente SIN id en la URL: la identidad sale de la sesión, así que
 * no hay forma de editar el perfil de otro cambiando un número. Cuando haga
 * falta leer perfiles ajenos irá en /api/creators/[id], solo lectura.
 *
 * Estas mismas rutas las consumirá la app Expo sin cambios.
 */

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile =
    session.user.userType === "brand"
      ? await getBrandProfile(session.user.id)
      : await getCreatorProfile(session.user.id);

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
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

  const isBrand = session.user.userType === "brand";
  const schema = isBrand ? brandProfileSchema : creatorProfileSchema;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    if (isBrand) {
      const profile = await updateBrandProfile(
        session.user.id,
        parsed.data as import("@/lib/validators").BrandProfileInput,
      );
      return NextResponse.json(profile);
    }

    const profile = await updateCreatorProfile(
      session.user.id,
      parsed.data as import("@/lib/validators").CreatorProfileInput,
    );

    // Cambiar nicho o audiencia cambia con qué campañas encaja, así que hay
    // que recalcular. Los matches ya decididos no se tocan (lo garantiza el
    // ON CONFLICT ... WHERE status = 'suggested').
    const matching = await generateMatchesForCreator(session.user.id);

    return NextResponse.json({ ...profile, matching });
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[profile] fallo al actualizar:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
