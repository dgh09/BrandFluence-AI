import { query } from "@/lib/db";
import { scoreMatch, type CampaignFacts, type CreatorFacts } from "@/lib/matching";

/**
 * Generación de matches: une el algoritmo puro (`src/lib/matching.ts`) con
 * la base de datos.
 *
 * El scoring se hace en TypeScript, no en SQL, a propósito: así se puede
 * testear sin base de datos y cambiar los pesos sin escribir una migración.
 * SQL solo se encarga de traer los candidatos plausibles, que es lo que
 * sabe hacer rápido.
 */

interface CreatorRow {
  id: string;
  niche: string | null;
  follower_count: number | null;
  engagement_rate: string | null;
  is_verified: boolean;
  fraud_score: string | null;
  bio: string | null;
}

interface CampaignRow {
  id: string;
  target_niche: string | null;
  min_followers: number | null;
}

const toCreatorFacts = (row: CreatorRow): CreatorFacts => ({
  niche: row.niche,
  followerCount: row.follower_count ?? 0,
  engagementRate: row.engagement_rate === null ? null : Number(row.engagement_rate),
  isVerified: row.is_verified,
  fraudScore: row.fraud_score === null ? null : Number(row.fraud_score),
  hasBio: Boolean(row.bio && row.bio.trim().length > 0),
});

const toCampaignFacts = (row: CampaignRow): CampaignFacts => ({
  targetNiche: row.target_niche,
  minFollowers: row.min_followers ?? 0,
});

export interface GenerationResult {
  evaluated: number;
  created: number;
}

/**
 * Guarda los matches calculados.
 *
 * ON CONFLICT actualiza el score, pero **solo si el match sigue en
 * 'suggested'**. Si el creador ya aplicó o descartó, recalcular no debe
 * resucitar la sugerencia ni pisar su decisión.
 */
async function upsertMatches(
  pairs: { creatorId: string; campaignId: string; score: number; reason: unknown }[],
): Promise<number> {
  if (pairs.length === 0) return 0;

  const values: string[] = [];
  const params: unknown[] = [];

  pairs.forEach((pair, index) => {
    const base = index * 4;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
    params.push(pair.creatorId, pair.campaignId, pair.score, JSON.stringify(pair.reason));
  });

  const rows = await query<{ id: string }>(
    `INSERT INTO matches (creator_id, campaign_id, match_score, score_reason)
     VALUES ${values.join(", ")}
     ON CONFLICT (creator_id, campaign_id) DO UPDATE
        SET match_score  = EXCLUDED.match_score,
            score_reason = EXCLUDED.score_reason
      WHERE matches.status = 'suggested'
     RETURNING id`,
    params,
  );

  return rows.length;
}

/** Calcula los matches de una campaña contra todos los creadores elegibles. */
export async function generateMatchesForCampaign(
  campaignId: string,
): Promise<GenerationResult> {
  const campaigns = await query<CampaignRow>(
    `SELECT id, target_niche, min_followers FROM campaigns
      WHERE id = $1 AND status IN ('published', 'active')`,
    [campaignId],
  );

  const campaignRow = campaigns[0];
  if (!campaignRow) return { evaluated: 0, created: 0 };

  const campaign = toCampaignFacts(campaignRow);

  // Prefiltro en SQL: descarta de golpe a quien no llega al mínimo o está
  // marcado por fraude. El nicho lo filtra el algoritmo, que conoce los
  // nichos afines.
  const creators = await query<CreatorRow>(
    `SELECT id, niche, follower_count, engagement_rate, is_verified, fraud_score, bio
       FROM creators
      WHERE niche IS NOT NULL
        AND coalesce(follower_count, 0) >= $1
        AND (fraud_score IS NULL OR fraud_score <= 0.7)`,
    [campaign.minFollowers],
  );

  const pairs = creators.flatMap((row) => {
    const result = scoreMatch(toCreatorFacts(row), campaign);
    if (!result.eligible) return [];
    return [
      {
        creatorId: row.id,
        campaignId: campaignRow.id,
        score: result.score,
        reason: { breakdown: result.breakdown, notes: result.notes },
      },
    ];
  });

  return { evaluated: creators.length, created: await upsertMatches(pairs) };
}

/** Calcula los matches de un creador contra todas las campañas abiertas. */
export async function generateMatchesForCreator(
  userId: string,
): Promise<GenerationResult> {
  const creators = await query<CreatorRow>(
    `SELECT id, niche, follower_count, engagement_rate, is_verified, fraud_score, bio
       FROM creators WHERE user_id = $1`,
    [userId],
  );

  const creatorRow = creators[0];
  if (!creatorRow || !creatorRow.niche) return { evaluated: 0, created: 0 };

  const creator = toCreatorFacts(creatorRow);

  const campaigns = await query<CampaignRow>(
    `SELECT id, target_niche, min_followers
       FROM campaigns
      WHERE status IN ('published', 'active')
        AND target_niche IS NOT NULL
        AND coalesce(min_followers, 0) <= $1`,
    [creator.followerCount],
  );

  const pairs = campaigns.flatMap((row) => {
    const result = scoreMatch(creator, toCampaignFacts(row));
    if (!result.eligible) return [];
    return [
      {
        creatorId: creatorRow.id,
        campaignId: row.id,
        score: result.score,
        reason: { breakdown: result.breakdown, notes: result.notes },
      },
    ];
  });

  return { evaluated: campaigns.length, created: await upsertMatches(pairs) };
}

/** Recalcula todo. Para el script de mantenimiento tras tocar los pesos. */
export async function regenerateAllMatches(): Promise<GenerationResult> {
  const campaigns = await query<{ id: string }>(
    `SELECT id FROM campaigns WHERE status IN ('published', 'active')`,
  );

  let evaluated = 0;
  let created = 0;
  for (const campaign of campaigns) {
    const result = await generateMatchesForCampaign(campaign.id);
    evaluated += result.evaluated;
    created += result.created;
  }

  return { evaluated, created };
}
