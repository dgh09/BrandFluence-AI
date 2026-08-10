import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { declarePayment } from "@/lib/queries/collaborations";
import { query } from "@/lib/db";
import { paymentDeclarationSchema } from "@/lib/validators";
import { paymentConfirmed, paymentDeclared } from "@/lib/notifications";
import { collaborationParties, notify } from "@/lib/queries/notifications";

/**
 * POST /api/collaborations/[id]/payment
 *
 * Registra lo que una parte declara sobre un pago que ocurre FUERA de la
 * plataforma. BrandFluence no cobra, no retiene y no transfiere: solo anota.
 *
 * No se filtra aquí por userType. Quién puede declarar qué depende de la
 * relación real con esta colaboración y del estado en que esté, y eso lo
 * resuelve el WHERE de declarePayment. Repetir la regla en dos sitios es la
 * forma de que un día dejen de coincidir.
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

  const parsed = paymentDeclarationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Datos no válidos",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { id } = await params;

  const payment = await declarePayment(session.user.id, id, parsed.data);
  if (!payment) {
    // Cubre no existe, no es tuya, está cancelada, o la transición no es
    // la que te toca desde el estado actual. No los distinguimos.
    return NextResponse.json(
      { error: "No se puede registrar ese cambio de pago" },
      { status: 409 },
    );
  }

  void query(
    `INSERT INTO events (user_id, event_type, entity_type, entity_id)
     VALUES ($1, $2, 'collaboration', $3)`,
    [session.user.id, `payment_${payment.status}`, id],
  ).catch(() => {});

  // Cada mitad de la declaración avisa a la otra parte. 'pending' es la
  // marca rectificando su propia declaración: no hay nada que contarle a
  // nadie, así que no genera aviso.
  const parties =
    payment.status === "pending" ? null : await collaborationParties(id);

  if (parties) {
    await notify([
      payment.status === "processing"
        ? {
            userId: parties.creatorUserId,
            content: paymentDeclared({
              collaborationId: id,
              campaignTitle: parties.campaignTitle,
              brandName: parties.brandName,
              amount: parties.agreedAmount,
            }),
          }
        : {
            userId: parties.brandUserId,
            content: paymentConfirmed({
              collaborationId: id,
              campaignTitle: parties.campaignTitle,
              creatorUsername: parties.creatorUsername,
              amount: parties.agreedAmount,
            }),
          },
    ]);
  }

  return NextResponse.json(payment);
}
