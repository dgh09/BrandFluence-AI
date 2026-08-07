import { z } from "zod";

import { INTERACTION_KEYS } from "./metrics";
import { INDUSTRY_VALUES, NICHE_VALUES } from "./taxonomy";
import { UPLOAD_PURPOSES } from "./uploads";

/**
 * Esquemas Zod compartidos por API routes y formularios.
 * Cuando llegue la app Expo, este fichero se mueve a un paquete compartido
 * y se reutiliza tal cual en móvil.
 */

export const userTypeSchema = z.enum(["creator", "brand"]);

export const signupSchema = z.object({
  email: z.email("Email no válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "Máximo 72 caracteres"), // bcrypt trunca a 72 bytes
  name: z.string().min(2, "Nombre demasiado corto").max(255),
  userType: userTypeSchema,
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const creatorProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo"),
  bio: z.string().max(1000).optional(),
  // Vocabulario cerrado: si esto fuera texto libre el matching por igualdad
  // de nicho dejaría de encontrar nada.
  niche: z.enum(NICHE_VALUES, { message: "Elige un nicho de la lista" }),
  followerCount: z.number().int().min(0).max(1_000_000_000),
  engagementRate: z.number().min(0).max(100).optional(),
  profileImageUrl: z.url().optional(),
});

export const brandProfileSchema = z.object({
  companyName: z.string().min(2).max(255),
  industry: z.enum(INDUSTRY_VALUES, { message: "Elige un sector de la lista" }),
  monthlyBudget: z.number().min(0).optional(),
  logoUrl: z.url().optional(),
});

export const campaignSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  objective: z.string().max(100).optional(),
  // Mismo vocabulario cerrado que el nicho del creador: es contra lo que
  // se compara en el matching.
  targetNiche: z.enum(NICHE_VALUES, { message: "Elige un nicho de la lista" }),
  minFollowers: z.number().int().min(0).default(0),
  budget: z.number().min(0),
});

/**
 * Entregables de una colaboración. La marca manda la lista entera, no un
 * diff: es lo que un editor de filas produce de forma natural, y evita tener
 * que inventar operaciones de "mover" o "renombrar".
 *
 * El `id` viaja de vuelta en las filas que ya existían. Es lo que permite
 * conservar su estado de entregado cuando la marca reordena o edita títulos.
 */
export const deliverablesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.uuid().optional(),
        title: z.string().trim().min(2, "Título demasiado corto").max(200),
      }),
    )
    .max(20, "Máximo 20 entregables"),
});

export const deliverableDoneSchema = z.object({ done: z.boolean() });

/** Los dos estados terminales. A 'active' se llega solo aceptando el match. */
export const collaborationStatusSchema = z.object({
  status: z.enum(["completed", "cancelled"]),
});

/**
 * Métricas de rendimiento de una colaboración, que reporta el creador.
 *
 * Todas opcionales: no todas las plataformas dan lo mismo, y obligar a
 * rellenar un campo que no existe se resuelve inventándoselo.
 */
const metricCount = z
  .number({ message: "Tiene que ser un número" })
  .int("Sin decimales")
  .min(0, "No puede ser negativo")
  .max(10_000_000_000)
  .optional();

export const performanceMetricsSchema = z
  .object({
    views: metricCount,
    likes: metricCount,
    comments: metricCount,
    shares: metricCount,
    saves: metricCount,
  })
  // Nadie da más likes que visualizaciones. No es una regla de negocio, es
  // un cazador de erratas: el fallo típico es un cero de más al teclear.
  .refine(
    (m) =>
      m.views === undefined ||
      INTERACTION_KEYS.every((key) => m[key] === undefined || m[key] <= m.views!),
    { message: "Ninguna interacción puede superar las visualizaciones" },
  );

/**
 * Petición de permiso de subida.
 *
 * No lleva ruta ni nombre de fichero: la ruta la construye el servidor desde
 * la sesión. Si el cliente pudiera proponerla, podría escribir en la carpeta
 * de otra persona o salirse del bucket con un `../`.
 */
export const uploadRequestSchema = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive(),
  /** Obligatorio solo cuando el propósito es 'deliverable'. */
  collaborationId: z.uuid().optional(),
});

/** Referencia al fichero entregado. Se guarda dentro del entregable. */
export const mediaRefSchema = z.object({
  path: z.string().min(1).max(500),
  contentType: z.string().min(1).max(100),
  name: z.string().max(255).optional(),
});

/**
 * Cambio sobre un entregable. Los dos campos son opcionales pero hay que
 * mandar al menos uno: un PATCH vacío no significa nada.
 *
 * `media: null` desadjunta el fichero, que es distinto de no mandar el campo.
 */
export const deliverablePatchSchema = z
  .object({
    done: z.boolean().optional(),
    media: mediaRefSchema.nullable().optional(),
  })
  .refine((p) => p.done !== undefined || p.media !== undefined, {
    message: "No hay nada que cambiar",
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>;
export type BrandProfileInput = z.infer<typeof brandProfileSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type DeliverablesInput = z.infer<typeof deliverablesSchema>;
export type PerformanceMetricsInput = z.infer<typeof performanceMetricsSchema>;
export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
export type MediaRef = z.infer<typeof mediaRefSchema>;
export type DeliverablePatchInput = z.infer<typeof deliverablePatchSchema>;
export type CollaborationStatusInput = z.infer<typeof collaborationStatusSchema>;
