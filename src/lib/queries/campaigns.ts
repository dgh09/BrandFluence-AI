import { query, queryOne } from "@/lib/db";
import type { CampaignInput } from "@/lib/validators";

export interface CampaignDetail {
  id: string;
  title: string;
  description: string | null;
  objective: string | null;
  targetNiche: string | null;
  minFollowers: number;
  budget: number | null;
  status: string;
  candidates: number;
  createdAt: string;
}

export async function listBrandCampaigns(
  userId: string,
): Promise<CampaignDetail[]> {
  const rows = await query<{
    id: string;
    title: string;
    description: string | null;
    objective: string | null;
    target_niche: string | null;
    min_followers: number | null;
    budget: string | null;
    status: string;
    candidates: number;
    created_at: Date;
  }>(
    `SELECT c.id, c.title, c.description, c.objective, c.target_niche,
            c.min_followers, c.budget, c.status, c.created_at,
            count(m.id) FILTER (WHERE m.status = 'interested')::int AS candidates
       FROM campaigns c
       JOIN brands b ON b.id = c.brand_id
       LEFT JOIN matches m ON m.campaign_id = c.id
      WHERE b.user_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    objective: row.objective,
    targetNiche: row.target_niche,
    minFollowers: row.min_followers ?? 0,
    budget: row.budget ? Number(row.budget) : null,
    status: row.status,
    candidates: row.candidates,
    createdAt: row.created_at.toISOString(),
  }));
}

/** Crea una campaña para la marca del usuario en sesión. */
export async function createCampaign(
  userId: string,
  input: CampaignInput,
): Promise<{ id: string } | null> {
  // El INSERT ... SELECT ata la campaña a la marca del usuario en sesión.
  // Si no tiene perfil de marca no inserta nada y devolvemos null.
  return queryOne<{ id: string }>(
    `INSERT INTO campaigns
       (brand_id, title, description, objective, target_niche, min_followers, budget, status)
     SELECT b.id, $2, $3, $4, $5, $6, $7, 'published'
       FROM brands b
      WHERE b.user_id = $1
     RETURNING id`,
    [
      userId,
      input.title,
      input.description ?? null,
      input.objective ?? null,
      input.targetNiche,
      input.minFollowers,
      input.budget,
    ],
  );
}
