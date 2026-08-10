import { query, queryOne } from "@/lib/db";
import type { NotificationContent } from "@/lib/notifications";

export interface NotificationRow extends NotificationContent {
  id: string;
  readAt: string | null;
  createdAt: string;
}

/**
 * Escribe avisos. `userId` de cada entrada es el DESTINATARIO.
 *
 * **No lanza nunca.** Un aviso perdido es molesto; una excepción aquí sería
 * peor: la acción del usuario (aceptar, pagar, entregar) YA se ha guardado
 * cuando llegamos a este punto, así que devolver un 500 le diría que falló
 * algo que en realidad funcionó, y le invitaría a reintentarlo.
 *
 * Sí se hace `await`, a diferencia del INSERT de `events`. Ese es analítica
 * y puede perderse sin que nadie lo note; esto es cómo se entera una persona
 * de que han aceptado su candidatura. En serverless, una promesa sin await
 * puede morir cuando la función termina.
 */
export async function notify(
  entries: { userId: string; content: NotificationContent }[],
): Promise<number> {
  if (entries.length === 0) return 0;

  const values: string[] = [];
  const params: unknown[] = [];

  entries.forEach(({ userId, content }, index) => {
    const b = index * 7;
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7})`);
    params.push(
      userId,
      content.type,
      content.title,
      content.body,
      content.href,
      content.entityType,
      content.entityId,
    );
  });

  try {
    const rows = await query<{ id: string }>(
      `INSERT INTO notifications
         (user_id, type, title, body, href, entity_type, entity_id)
       VALUES ${values.join(", ")}
       RETURNING id`,
      params,
    );
    return rows.length;
  } catch (error) {
    console.error("[notifications] no se pudo escribir el aviso:", error);
    return 0;
  }
}

/** Cuántas sin leer. Es lo que pinta el punto de la campana, en cada carga. */
export async function countUnread(userId: string): Promise<number> {
  const row = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
       FROM notifications
      WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return row?.n ?? 0;
}

/** Las últimas notificaciones de una persona, nuevas primero. */
export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const rows = await query<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    href: string | null;
    entity_type: string | null;
    entity_id: string | null;
    read_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, type, title, body, href, entity_type, entity_id, read_at, created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit],
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type as NotificationRow["type"],
    title: row.title,
    body: row.body,
    href: row.href,
    entityType: row.entity_type as NotificationRow["entityType"],
    entityId: row.entity_id ?? "",
    readAt: row.read_at ? row.read_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  }));
}

/**
 * Marca como leídas todas las no leídas de una persona.
 *
 * El `user_id` va en el WHERE, igual que en el resto del proyecto: no hay
 * forma de marcar como leído lo de otra persona. `read_at IS NULL` evita
 * reescribir la fecha de las que ya lo estaban.
 */
export async function markAllRead(userId: string): Promise<number> {
  const rows = await query<{ id: string }>(
    `UPDATE notifications
        SET read_at = now()
      WHERE user_id = $1 AND read_at IS NULL
      RETURNING id`,
    [userId],
  );
  return rows.length;
}

export interface Parties {
  brandUserId: string;
  creatorUserId: string;
  campaignTitle: string;
  brandName: string | null;
  creatorUsername: string | null;
  agreedAmount: number | null;
}

/**
 * Las dos personas detrás de una colaboración, más lo que hace falta para
 * redactar el aviso.
 *
 * Un aviso va siempre a la parte CONTRARIA de quien actúa, y quién es esa
 * parte no se sabe sin bajar hasta `users` por los dos lados. Tenerlo en una
 * sola consulta evita que cada ruta se invente su propio JOIN de seis tablas.
 */
export async function collaborationParties(
  collaborationId: string,
): Promise<Parties | null> {
  const row = await queryOne<{
    brand_user_id: string;
    creator_user_id: string;
    campaign_title: string;
    brand_name: string | null;
    creator_username: string | null;
    agreed_amount: string | null;
  }>(
    `SELECT bu.id AS brand_user_id, cu.id AS creator_user_id,
            c.title AS campaign_title, b.company_name AS brand_name,
            cr.username AS creator_username, co.agreed_amount
       FROM collaborations co
       JOIN matches   m  ON m.id  = co.match_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
       JOIN users     bu ON bu.id = b.user_id
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN users     cu ON cu.id = cr.user_id
      WHERE co.id = $1`,
    [collaborationId],
  );

  if (!row) return null;

  return {
    brandUserId: row.brand_user_id,
    creatorUserId: row.creator_user_id,
    campaignTitle: row.campaign_title,
    brandName: row.brand_name,
    creatorUsername: row.creator_username,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
  };
}

/** Igual, pero partiendo de un match que todavía no tiene colaboración. */
export async function matchParties(matchId: string): Promise<Parties | null> {
  const row = await queryOne<{
    brand_user_id: string;
    creator_user_id: string;
    campaign_title: string;
    brand_name: string | null;
    creator_username: string | null;
  }>(
    `SELECT bu.id AS brand_user_id, cu.id AS creator_user_id,
            c.title AS campaign_title, b.company_name AS brand_name,
            cr.username AS creator_username
       FROM matches   m
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
       JOIN users     bu ON bu.id = b.user_id
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN users     cu ON cu.id = cr.user_id
      WHERE m.id = $1`,
    [matchId],
  );

  if (!row) return null;

  return {
    brandUserId: row.brand_user_id,
    creatorUserId: row.creator_user_id,
    campaignTitle: row.campaign_title,
    brandName: row.brand_name,
    creatorUsername: row.creator_username,
    agreedAmount: null,
  };
}
