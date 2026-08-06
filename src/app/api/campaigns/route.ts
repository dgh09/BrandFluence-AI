import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createCampaign, listBrandCampaigns } from "@/lib/queries/campaigns";
import { generateMatchesForCampaign } from "@/lib/queries/matching";
import { campaignSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "brand") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(await listBrandCampaigns(session.user.id));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "brand") {
    return NextResponse.json(
      { error: "Solo las marcas pueden crear campañas" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await createCampaign(session.user.id, parsed.data);
  if (!created) {
    return NextResponse.json(
      { error: "Completa antes el perfil de tu marca" },
      { status: 409 },
    );
  }

  // Publicar una campaña dispara el matching. Se espera a que termine para
  // que la marca vea sus candidatos nada más volver a la lista, en vez de
  // encontrarse una campaña vacía que se rellena sola unos segundos después.
  const matching = await generateMatchesForCampaign(created.id);

  return NextResponse.json({ ...created, matching }, { status: 201 });
}
