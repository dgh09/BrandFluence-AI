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

export interface CandidateRow {
  matchId: string;
  matchScore: number;
  status: string;
  campaignTitle: string;
  creatorUsername: string | null;
  creatorNiche: string | null;
  creatorFollowers: number;
  creatorEngagement: number | null;
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
    username: string | null;
    niche: string | null;
    follower_count: number | null;
    engagement_rate: string | null;
  }>(
    `SELECT m.id AS match_id, m.match_score, m.status,
            c.title AS campaign_title,
            cr.username, cr.niche, cr.follower_count, cr.engagement_rate
       FROM matches   m
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
       JOIN creators  cr ON cr.id = m.creator_id
      WHERE b.user_id = $1
        AND m.status IN ('interested', 'accepted')
      ORDER BY m.match_score DESC NULLS LAST`,
    [userId],
  );

  return rows.map((row) => ({
    matchId: row.match_id,
    matchScore: row.match_score ? Number(row.match_score) : 0,
    status: row.status,
    campaignTitle: row.campaign_title,
    creatorUsername: row.username,
    creatorNiche: row.niche,
    creatorFollowers: row.follower_count ?? 0,
    creatorEngagement: row.engagement_rate ? Number(row.engagement_rate) : null,
  }));
}
