import { query, queryOne } from "@/lib/db";
import { parseScoreNotes, type MatchRow } from "@/lib/queries/dashboard";

/**
 * Quién escribe cada estado importa:
 *
 * - 'rejected'  — el creador descarta la sugerencia. Reversible.
 * - 'declined'  — la marca no selecciona al candidato. Terminal.
 *
 * Son dos valores y no uno porque el creador no descartó lo que la marca
 * rechazó, y porque volver de 'rejected' a 'interested' está permitido pero
 * volver de 'declined' no debe estarlo. Ver migrations/003.
 */
export type MatchStatus =
  | "suggested"
  | "interested"
  | "rejected"
  | "accepted"
  | "declined";

/** Lista de matches del creador, filtrable por estado. */
export async function listCreatorMatches(
  userId: string,
  status: MatchStatus | "all" = "suggested",
): Promise<MatchRow[]> {
  const rows = await query<{
    id: string;
    match_score: string | null;
    status: string;
    campaign_title: string;
    campaign_budget: string | null;
    brand_name: string | null;
    score_reason: unknown;
  }>(
    `SELECT m.id, m.match_score, m.status, m.score_reason,
            c.title  AS campaign_title,
            c.budget AS campaign_budget,
            b.company_name AS brand_name
       FROM matches m
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
      WHERE cr.user_id = $1
        AND ($2::text = 'all' OR m.status = $2)
      ORDER BY m.match_score DESC NULLS LAST`,
    [userId, status],
  );

  return rows.map((row) => ({
    id: row.id,
    matchScore: row.match_score ? Number(row.match_score) : 0,
    status: row.status,
    campaignTitle: row.campaign_title,
    campaignBudget: row.campaign_budget ? Number(row.campaign_budget) : null,
    brandName: row.brand_name,
    notes: parseScoreNotes(row.score_reason),
  }));
}

/**
 * Cambia el estado de un match.
 *
 * El WHERE incluye el user_id del creador: si el match no es suyo, el UPDATE
 * afecta a 0 filas y devolvemos null. Así no hace falta un SELECT previo de
 * comprobación y no hay forma de tocar el match de otra persona.
 *
 * Los estados de partida admitidos dejan fuera 'accepted' y 'declined' a
 * propósito: de una colaboración ya abierta no se sale por aquí, y de un
 * rechazo de la marca no se vuelve re-aplicando.
 */
export async function setMatchStatus(
  userId: string,
  matchId: string,
  status: Extract<MatchStatus, "interested" | "rejected">,
): Promise<{ id: string; status: string } | null> {
  return queryOne<{ id: string; status: string }>(
    `UPDATE matches m
        SET status = $3
       FROM creators cr
      WHERE m.id = $2
        AND m.creator_id = cr.id
        AND cr.user_id = $1
        AND m.status IN ('suggested', 'interested', 'rejected')
      RETURNING m.id, m.status`,
    [userId, matchId, status],
  );
}

export interface AcceptedCollaboration {
  id: string;
  status: string;
  paymentStatus: string;
  agreedAmount: number | null;
  /**
   * `true` solo la primera vez. Aceptar es idempotente ante el doble clic,
   * y sin esta bandera el segundo clic mandaría un segundo «te aceptaron».
   */
  created: boolean;
}

/**
 * La marca acepta a un candidato: el match pasa a 'accepted' y nace la
 * colaboración, con el presupuesto de la campaña como importe acordado.
 *
 * Va en UNA sola sentencia a propósito. Con dos, un fallo entre medias
 * dejaría un match aceptado sin colaboración, y el UNIQUE de match_id
 * impediría repararlo reintentando. Cada sentencia se ejecuta dentro de su
 * transacción implícita, así que la CTE da la atomicidad sin reservar un
 * cliente del pool ni escribir BEGIN/COMMIT a mano — algo que además el
 * pooler de Supabase en modo transaction desaconseja.
 *
 * La autorización vive en el WHERE, igual que en setMatchStatus: si la
 * campaña no es de esta marca el UPDATE toca 0 filas, la CTE va vacía y no
 * se inserta nada.
 *
 * Aceptar dos veces no falla: se admite el estado 'accepted' de entrada y el
 * ON CONFLICT devuelve la colaboración que ya existía. Así un doble clic no
 * se convierte en un 404 confuso.
 */
export async function acceptCandidate(
  userId: string,
  matchId: string,
): Promise<AcceptedCollaboration | null> {
  const row = await queryOne<{
    id: string;
    status: string;
    payment_status: string;
    agreed_amount: string | null;
    created: boolean;
  }>(
    `WITH accepted AS (
       UPDATE matches m
          SET status = 'accepted'
         FROM campaigns c
         JOIN brands b ON b.id = c.brand_id
        WHERE m.id = $2
          AND c.id = m.campaign_id
          AND b.user_id = $1
          AND m.status IN ('interested', 'accepted')
       RETURNING m.id AS match_id, c.budget
     )
     INSERT INTO collaborations (match_id, agreed_amount)
     SELECT match_id, budget FROM accepted
     ON CONFLICT (match_id) DO UPDATE SET updated_at = now()
     RETURNING id, status, payment_status, agreed_amount,
               (xmax = 0) AS created`,
    [userId, matchId],
  );

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
    // `xmax` es el id de transacción que borró la versión de la fila; en una
    // fila recién insertada vale 0, y en la que sale por la rama DO UPDATE
    // no. Es la forma estándar de distinguir INSERT de UPDATE en un upsert
    // sin una segunda consulta.
    created: row.created,
  };
}

/**
 * La marca rechaza a un candidato: el match pasa a 'declined' y desaparece
 * de su bandeja.
 *
 * Misma forma que acceptCandidate —la autorización vive en el WHERE, no en
 * un SELECT previo— pero sin CTE: aquí no nace nada, solo cambia el estado.
 *
 * 'accepted' NO está entre los estados de partida. Rechazar a alguien con la
 * colaboración ya abierta dejaría una colaboración viva colgando de un match
 * rechazado; para deshacer eso está cancelar la colaboración, que sabe qué
 * hacer con los entregables y con el pago.
 *
 * 'declined' sí está, para que un doble clic devuelva 200 y no un 404.
 *
 * `changed` distingue el primer clic del segundo. La CTE lee el estado
 * **antes** del UPDATE —ve la instantánea previa de la fila— y así se sabe
 * si esta llamada rechazó de verdad o solo repitió lo ya hecho. Sin eso, un
 * doble clic mandaría dos avisos idénticos al creador.
 */
export async function declineCandidate(
  userId: string,
  matchId: string,
): Promise<{ id: string; status: string; changed: boolean } | null> {
  const row = await queryOne<{
    id: string;
    status: string;
    previous_status: string;
  }>(
    `WITH prev AS (
       SELECT id, status FROM matches WHERE id = $2
     )
     UPDATE matches m
        SET status = 'declined'
       FROM campaigns c
       JOIN brands b ON b.id = c.brand_id, prev
      WHERE m.id = $2
        AND prev.id = m.id
        AND c.id = m.campaign_id
        AND b.user_id = $1
        AND m.status IN ('interested', 'declined')
      RETURNING m.id, m.status, prev.status AS previous_status`,
    [userId, matchId],
  );

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    changed: row.previous_status !== "declined",
  };
}

export interface CandidateRow {
  matchId: string;
  matchScore: number;
  status: string;
  campaignTitle: string;
  campaignBudget: number | null;
  creatorUsername: string | null;
  creatorNiche: string | null;
  creatorFollowers: number;
  creatorEngagement: number | null;
  /** Importe ya pactado. Non-null ⇒ la colaboración existe. */
  agreedAmount: number | null;
}

/** Creadores que han aplicado a las campañas de esta marca. */
export async function listBrandCandidates(
  userId: string,
): Promise<CandidateRow[]> {
  const rows = await query<{
    match_id: string;
    match_score: string | null;
    status: string;
    campaign_title: string;
    campaign_budget: string | null;
    username: string | null;
    niche: string | null;
    follower_count: number | null;
    engagement_rate: string | null;
    agreed_amount: string | null;
  }>(
    `SELECT m.id AS match_id, m.match_score, m.status,
            c.title AS campaign_title, c.budget AS campaign_budget,
            cr.username, cr.niche, cr.follower_count, cr.engagement_rate,
            co.agreed_amount
       FROM matches   m
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
       JOIN creators  cr ON cr.id = m.creator_id
       LEFT JOIN collaborations co ON co.match_id = m.id
      WHERE b.user_id = $1
        AND m.status IN ('interested', 'accepted')
      ORDER BY (m.status = 'accepted'), m.match_score DESC NULLS LAST`,
    [userId],
  );

  return rows.map((row) => ({
    matchId: row.match_id,
    matchScore: row.match_score ? Number(row.match_score) : 0,
    status: row.status,
    campaignTitle: row.campaign_title,
    campaignBudget: row.campaign_budget ? Number(row.campaign_budget) : null,
    creatorUsername: row.username,
    creatorNiche: row.niche,
    creatorFollowers: row.follower_count ?? 0,
    creatorEngagement: row.engagement_rate ? Number(row.engagement_rate) : null,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
  }));
}
