import { query, queryOne } from "@/lib/db";

/**
 * Consultas del dashboard.
 *
 * Viven aquí y no dentro de los componentes para que las rutas /api/* las
 * reutilicen tal cual cuando llegue la app móvil.
 */

export interface CreatorDashboard {
  username: string | null;
  niche: string | null;
  followerCount: number;
  isVerified: boolean;
  /** Matches sugeridos que aún no ha visto/decidido. */
  newMatches: number;
  /** Campañas a las que ha aplicado y siguen abiertas. */
  applications: number;
  activeCollaborations: number;
  topMatches: MatchRow[];
}

export interface MatchRow {
  id: string;
  matchScore: number;
  status: string;
  campaignTitle: string;
  campaignBudget: number | null;
  brandName: string | null;
  /** Por qué salió este match. Sale de matches.score_reason. */
  notes: string[];
}

/** Lee las notas del JSONB defensivamente: puede ser null o de una versión vieja. */
export function parseScoreNotes(reason: unknown): string[] {
  if (!reason || typeof reason !== "object") return [];
  const notes = (reason as { notes?: unknown }).notes;
  return Array.isArray(notes) ? notes.filter((n): n is string => typeof n === "string") : [];
}

export async function getCreatorDashboard(
  userId: string,
): Promise<CreatorDashboard | null> {
  const profile = await queryOne<{
    id: string;
    username: string | null;
    niche: string | null;
    follower_count: number | null;
    is_verified: boolean;
  }>(
    `SELECT id, username, niche, follower_count, is_verified
       FROM creators WHERE user_id = $1`,
    [userId],
  );

  if (!profile) return null;

  // Un solo viaje a la DB para los tres contadores: en us-west-1 cada
  // round-trip cuesta caro, así que agregamos con FILTER en vez de
  // lanzar tres queries.
  const counts = await queryOne<{
    new_matches: number;
    applications: number;
    active_collabs: number;
  }>(
    `SELECT
       count(*) FILTER (WHERE m.status = 'suggested')             ::int AS new_matches,
       count(*) FILTER (WHERE m.status = 'interested')            ::int AS applications,
       count(*) FILTER (WHERE co.status = 'active')               ::int AS active_collabs
     FROM matches m
     LEFT JOIN collaborations co ON co.match_id = m.id
     WHERE m.creator_id = $1`,
    [profile.id],
  );

  const topMatches = await query<{
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
       JOIN campaigns c ON c.id = m.campaign_id
       JOIN brands    b ON b.id = c.brand_id
      WHERE m.creator_id = $1 AND m.status = 'suggested'
      ORDER BY m.match_score DESC NULLS LAST
      LIMIT 5`,
    [profile.id],
  );

  return {
    username: profile.username,
    niche: profile.niche,
    followerCount: profile.follower_count ?? 0,
    isVerified: profile.is_verified,
    newMatches: counts?.new_matches ?? 0,
    applications: counts?.applications ?? 0,
    activeCollaborations: counts?.active_collabs ?? 0,
    topMatches: topMatches.map((row) => ({
      id: row.id,
      // pg devuelve DECIMAL como string para no perder precisión.
      matchScore: row.match_score ? Number(row.match_score) : 0,
      status: row.status,
      campaignTitle: row.campaign_title,
      campaignBudget: row.campaign_budget ? Number(row.campaign_budget) : null,
      brandName: row.brand_name,
      notes: parseScoreNotes(row.score_reason),
    })),
  };
}

export interface BrandDashboard {
  companyName: string | null;
  industry: string | null;
  activeCampaigns: number;
  candidates: number;
  totalBudget: number;
  campaigns: CampaignRow[];
}

export interface CampaignRow {
  id: string;
  title: string;
  status: string;
  budget: number | null;
  candidates: number;
}

export async function getBrandDashboard(
  userId: string,
): Promise<BrandDashboard | null> {
  const profile = await queryOne<{
    id: string;
    company_name: string | null;
    industry: string | null;
  }>(
    `SELECT id, company_name, industry FROM brands WHERE user_id = $1`,
    [userId],
  );

  if (!profile) return null;

  const campaigns = await query<{
    id: string;
    title: string;
    status: string;
    budget: string | null;
    candidates: number;
  }>(
    `SELECT c.id, c.title, c.status, c.budget,
            count(m.id) FILTER (WHERE m.status = 'interested')::int AS candidates
       FROM campaigns c
       LEFT JOIN matches m ON m.campaign_id = c.id
      WHERE c.brand_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 5`,
    [profile.id],
  );

  const totals = await queryOne<{ active: number; budget: string | null; candidates: number }>(
    `SELECT
       count(DISTINCT c.id) FILTER (WHERE c.status IN ('published','active'))::int AS active,
       coalesce(sum(c.budget) FILTER (WHERE c.status IN ('published','active')), 0) AS budget,
       count(m.id) FILTER (WHERE m.status = 'interested')::int AS candidates
     FROM campaigns c
     LEFT JOIN matches m ON m.campaign_id = c.id
     WHERE c.brand_id = $1`,
    [profile.id],
  );

  return {
    companyName: profile.company_name,
    industry: profile.industry,
    activeCampaigns: totals?.active ?? 0,
    candidates: totals?.candidates ?? 0,
    totalBudget: totals?.budget ? Number(totals.budget) : 0,
    campaigns: campaigns.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      budget: row.budget ? Number(row.budget) : null,
      candidates: row.candidates,
    })),
  };
}
