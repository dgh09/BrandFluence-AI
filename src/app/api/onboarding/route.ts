import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { userTypeSchema } from "@/lib/validators";

const bodySchema = z.object({ userType: userTypeSchema });

/**
 * POST /api/onboarding
 *
 * Cierra el hueco de OAuth: cuando alguien entra con Google, el adapter de
 * Auth.js crea la fila en `users` pero no sabe nada de `creators`/`brands`
 * ni de qué tipo de usuario es. Aquí se elige el tipo y se crea el perfil.
 *
 * Solo funciona si `user_type` sigue a NULL — no es un endpoint para
 * cambiar de creador a marca después.
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tipo de usuario no válido" }, { status: 400 });
  }

  const { userType } = parsed.data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // El "AND user_type IS NULL" es el guard: si ya tiene tipo, 0 filas.
    const { rows } = await client.query<{ id: string; name: string | null }>(
      `UPDATE users SET user_type = $2
        WHERE id = $1 AND user_type IS NULL
        RETURNING id, name`,
      [session.user.id, userType],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Esta cuenta ya tiene un tipo asignado" },
        { status: 409 },
      );
    }

    if (userType === "creator") {
      await client.query(
        `INSERT INTO creators (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [session.user.id],
      );
    } else {
      await client.query(
        `INSERT INTO brands (user_id, company_name) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [session.user.id, rows[0].name],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ userType }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[onboarding] fallo:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
