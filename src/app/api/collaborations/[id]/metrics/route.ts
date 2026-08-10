import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { setPerformanceMetrics } from "@/lib/queries/collaborations";
import { performanceMetricsSchema } from "@/lib/validators";
import { metricsReported } from "@/lib/notifications";
import { collaborationParties, notify } from "@/lib/queries/notifications";

/**
 * PUT /api/collaborations/[id]/metrics — el creador reporta el rendimiento.
 *
 * PUT porque el cuerpo es el reporte completo: lo que mandes sustituye a lo
 * anterior. Mandarlo vacío borra el reporte.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.userType !== "creator") {
    return NextResponse.json(
      { error: "Solo el creador reporta las métricas" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const parsed = performanceMetricsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        // El primer mensaje es el que ve el creador en el formulario; el
        // detalle completo va aparte para depurar.
        error: parsed.error.issues[0]?.message ?? "Datos no válidos",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { id } = await params;

  const result = await setPerformanceMetrics(session.user.id, id, parsed.data);
  if (!result) {
    return NextResponse.json(
      { error: "Colaboración no encontrada o cancelada" },
      { status: 404 },
    );
  }

  // Se entera la marca. El PUT vacío borra el reporte, y borrar no es
  // «publicar el rendimiento»: eso no se anuncia.
  const reported = Object.keys(parsed.data).length > 0;
  const parties = reported ? await collaborationParties(id) : null;
  if (parties) {
    await notify([
      {
        userId: parties.brandUserId,
        content: metricsReported({
          collaborationId: id,
          campaignTitle: parties.campaignTitle,
          creatorUsername: parties.creatorUsername,
        }),
      },
    ]);
  }

  return NextResponse.json(result);
}
