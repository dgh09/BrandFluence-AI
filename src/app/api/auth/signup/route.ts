import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { pool, query, queryOne } from "@/lib/db";
import { signupSchema } from "@/lib/validators";

/**
 * POST /api/auth/signup
 *
 * Ruta estática: en el App Router un segmento fijo gana al catch-all
 * [...nextauth], así que conviven sin problema.
 *
 * Crea el usuario y su fila de perfil (creators o brands) en una sola
 * transacción — si falla el perfil no queremos un usuario huérfano.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, userType } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO users (email, name, password_hash, user_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, name, passwordHash, userType],
    );
    const userId = rows[0].id;

    if (userType === "creator") {
      await client.query(`INSERT INTO creators (user_id) VALUES ($1)`, [userId]);
    } else {
      await client.query(
        `INSERT INTO brands (user_id, company_name) VALUES ($1, $2)`,
        [userId, name],
      );
    }

    await client.query("COMMIT");

    // Analytics: fuera de la transacción, que no bloquee el alta si falla.
    void query(
      `INSERT INTO events (user_id, event_type, entity_type, entity_id)
       VALUES ($1, 'user_signup', 'user', $1)`,
      [userId],
    ).catch(() => {});

    return NextResponse.json({ id: userId, email, userType }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[signup] fallo al crear usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
