import { queryOne } from "@/lib/db";
import type { BrandProfileInput, CreatorProfileInput } from "@/lib/validators";

export interface CreatorProfile {
  id: string;
  username: string | null;
  bio: string | null;
  niche: string | null;
  followerCount: number;
  engagementRate: number | null;
  profileImageUrl: string | null;
  isVerified: boolean;
}

export interface BrandProfile {
  id: string;
  companyName: string | null;
  industry: string | null;
  monthlyBudget: number | null;
  logoUrl: string | null;
}

export async function getCreatorProfile(
  userId: string,
): Promise<CreatorProfile | null> {
  const row = await queryOne<{
    id: string;
    username: string | null;
    bio: string | null;
    niche: string | null;
    follower_count: number | null;
    engagement_rate: string | null;
    profile_image_url: string | null;
    is_verified: boolean;
  }>(
    `SELECT id, username, bio, niche, follower_count, engagement_rate,
            profile_image_url, is_verified
       FROM creators WHERE user_id = $1`,
    [userId],
  );

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    niche: row.niche,
    followerCount: row.follower_count ?? 0,
    // DECIMAL llega como string desde node-postgres.
    engagementRate: row.engagement_rate ? Number(row.engagement_rate) : null,
    profileImageUrl: row.profile_image_url,
    isVerified: row.is_verified,
  };
}

export async function getBrandProfile(
  userId: string,
): Promise<BrandProfile | null> {
  const row = await queryOne<{
    id: string;
    company_name: string | null;
    industry: string | null;
    monthly_budget: string | null;
    logo_url: string | null;
  }>(
    `SELECT id, company_name, industry, monthly_budget, logo_url
       FROM brands WHERE user_id = $1`,
    [userId],
  );

  if (!row) return null;

  return {
    id: row.id,
    companyName: row.company_name,
    industry: row.industry,
    monthlyBudget: row.monthly_budget ? Number(row.monthly_budget) : null,
    logoUrl: row.logo_url,
  };
}

/** Error de username ya cogido. La ruta lo traduce a un 409. */
export class UsernameTakenError extends Error {
  constructor() {
    super("Ese nombre de usuario ya está en uso");
    this.name = "UsernameTakenError";
  }
}

export async function updateCreatorProfile(
  userId: string,
  input: CreatorProfileInput,
): Promise<CreatorProfile> {
  // El username lo pide UNIQUE en la tabla. En vez de comprobar antes
  // (que deja una ventana de carrera entre el SELECT y el UPDATE), dejamos
  // que salte la constraint y traducimos el error 23505.
  try {
    const row = await queryOne<{ id: string }>(
      `UPDATE creators
          SET username = $2,
              bio = $3,
              niche = $4,
              follower_count = $5,
              engagement_rate = $6,
              -- COALESCE y no asignación directa: el formulario solo manda
              -- la foto cuando se acaba de subir una. Sin esto, guardar
              -- cualquier otro campo borraría la que ya hubiera.
              profile_image_url = coalesce($7, profile_image_url)
        WHERE user_id = $1
        RETURNING id`,
      [
        userId,
        input.username.toLowerCase(),
        input.bio ?? null,
        input.niche,
        input.followerCount,
        input.engagementRate ?? null,
        input.profileImageUrl ?? null,
      ],
    );

    if (!row) throw new Error("No existe perfil de creador para este usuario");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new UsernameTakenError();
    }
    throw error;
  }

  const updated = await getCreatorProfile(userId);
  if (!updated) throw new Error("Perfil no encontrado tras actualizar");
  return updated;
}

export async function updateBrandProfile(
  userId: string,
  input: BrandProfileInput,
): Promise<BrandProfile> {
  const row = await queryOne<{ id: string }>(
    `UPDATE brands
        SET company_name = $2,
            industry = $3,
            monthly_budget = $4,
            -- Mismo motivo que con la foto del creador: solo se pisa si
            -- viene un logo nuevo.
            logo_url = coalesce($5, logo_url)
      WHERE user_id = $1
      RETURNING id`,
    [
      userId,
      input.companyName,
      input.industry,
      input.monthlyBudget ?? null,
      input.logoUrl ?? null,
    ],
  );

  if (!row) throw new Error("No existe perfil de marca para este usuario");

  const updated = await getBrandProfile(userId);
  if (!updated) throw new Error("Perfil no encontrado tras actualizar");
  return updated;
}
