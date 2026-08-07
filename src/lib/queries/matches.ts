import { query, queryOne } from "@/lib/db";
import { parseScoreNotes, type MatchRow } from "@/lib/queries/dashboard";

export type MatchStatus = "suggested" | "interested" | "rejected" | "accepted";

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
     RETURNING id, status, payment_status, agreed_amount`,
    [userId, matchId],
  );

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
  };
}

export interface CollaborationRow {
  id: string;
  status: string;
  paymentStatus: string;
  agreedAmount: number | null;
  campaignTitle: string;
  counterpartName: string | null;
}

export async function listCreatorCollaborations(
  userId: string,
): Promise<CollaborationRow[]> {
  const rows = await query<{
    id: string;
    status: string;
    payment_status: string;
    agreed_amount: string | null;
    campaign_title: string;
    counterpart_name: string | null;
  }>(
    `SELECT co.id, co.status, co.payment_status, co.agreed_amount,
            c.title AS campaign_title,
            b.company_name AS counterpart_name
       FROM collaborations co
       JOIN matches   m  ON m.id  = co.match_id
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
      WHERE cr.user_id = $1
      ORDER BY co.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
    campaignTitle: row.campaign_title,
    counterpartName: row.counterpart_name,
  }));
}

/** Las colaboraciones vistas desde la marca. La contraparte es el creador. */
export async function listBrandCollaborations(
  userId: string,
): Promise<CollaborationRow[]> {
  const rows = await query<{
    id: string;
    status: string;
    payment_status: string;
    agreed_amount: string | null;
    campaign_title: string;
    counterpart_name: string | null;
  }>(
    `SELECT co.id, co.status, co.payment_status, co.agreed_amount,
            c.title AS campaign_title,
            cr.username AS counterpart_name
       FROM collaborations co
       JOIN matches   m  ON m.id  = co.match_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
       JOIN creators  cr ON cr.id = m.creator_id
      WHERE b.user_id = $1
      ORDER BY co.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
    campaignTitle: row.campaign_title,
    counterpartName: row.counterpart_name,
  }));
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
