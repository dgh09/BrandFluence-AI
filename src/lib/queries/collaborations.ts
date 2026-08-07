import { randomUUID } from "node:crypto";

import { query, queryOne } from "@/lib/db";
import {
  METRIC_KEYS,
  parseMetrics,
  type PerformanceMetrics,
} from "@/lib/metrics";
import type {
  DeliverablesInput,
  PerformanceMetricsInput,
} from "@/lib/validators";

export type { MetricKey, PerformanceMetrics } from "@/lib/metrics";

/**
 * Acceso a datos de las colaboraciones.
 *
 * Una colaboración tiene DOS dueños legítimos —el creador y la marca— y eso
 * gobierna todo el fichero: cada consulta lleva en su WHERE qué parte puede
 * ejecutarla. No hay una comprobación previa en TypeScript que se pueda
 * olvidar; si quien pregunta no es parte, la consulta afecta a cero filas.
 */

export type CollaborationStatus = "active" | "completed" | "cancelled";
export type ViewerRole = "creator" | "brand";

export interface Deliverable {
  id: string;
  title: string;
  done: boolean;
  doneAt: string | null;
}

export interface CollaborationRow {
  id: string;
  status: string;
  paymentStatus: string;
  agreedAmount: number | null;
  campaignTitle: string;
  counterpartName: string | null;
  /** Entregados / totales. Para pintar el progreso sin traer la lista entera. */
  deliverablesDone: number;
  deliverablesTotal: number;
}

export interface CollaborationDetail extends CollaborationRow {
  campaignDescription: string | null;
  deliverables: Deliverable[];
  /** null mientras el creador no haya reportado nada. */
  metrics: PerformanceMetrics | null;
  /** Qué papel juega quien está mirando. Decide qué acciones se ofrecen. */
  viewerRole: ViewerRole;
  createdAt: string;
}

/**
 * Lee el JSONB defensivamente: puede ser null, o venir de una versión
 * anterior del formato. Una fila mal formada se descarta en vez de tumbar
 * la página entera.
 */
function parseDeliverables(raw: unknown): Deliverable[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { id, title, done, doneAt } = item as Record<string, unknown>;
    if (typeof id !== "string" || typeof title !== "string") return [];
    return [
      {
        id,
        title,
        done: done === true,
        doneAt: typeof doneAt === "string" ? doneAt : null,
      },
    ];
  });
}

/** Cuenta entregables sin traerlos: se usa en las dos listas. */
const PROGRESS_COLUMNS = `
  coalesce(jsonb_array_length(co.deliverables), 0)::int AS deliverables_total,
  (SELECT count(*)::int
     FROM jsonb_array_elements(coalesce(co.deliverables, '[]'::jsonb)) AS d
    WHERE (d->>'done')::boolean) AS deliverables_done`;

interface ListRow {
  id: string;
  status: string;
  payment_status: string;
  agreed_amount: string | null;
  campaign_title: string;
  counterpart_name: string | null;
  deliverables_total: number;
  deliverables_done: number;
}

function toCollaborationRow(row: ListRow): CollaborationRow {
  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    agreedAmount: row.agreed_amount ? Number(row.agreed_amount) : null,
    campaignTitle: row.campaign_title,
    counterpartName: row.counterpart_name,
    deliverablesDone: row.deliverables_done,
    deliverablesTotal: row.deliverables_total,
  };
}

/** Las colaboraciones del creador. La contraparte es la marca. */
export async function listCreatorCollaborations(
  userId: string,
): Promise<CollaborationRow[]> {
  const rows = await query<ListRow>(
    `SELECT co.id, co.status, co.payment_status, co.agreed_amount,
            c.title AS campaign_title,
            b.company_name AS counterpart_name,
            ${PROGRESS_COLUMNS}
       FROM collaborations co
       JOIN matches   m  ON m.id  = co.match_id
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
      WHERE cr.user_id = $1
      ORDER BY (co.status <> 'active'), co.created_at DESC`,
    [userId],
  );

  return rows.map(toCollaborationRow);
}

/** Las colaboraciones de la marca. La contraparte es el creador. */
export async function listBrandCollaborations(
  userId: string,
): Promise<CollaborationRow[]> {
  const rows = await query<ListRow>(
    `SELECT co.id, co.status, co.payment_status, co.agreed_amount,
            c.title AS campaign_title,
            cr.username AS counterpart_name,
            ${PROGRESS_COLUMNS}
       FROM collaborations co
       JOIN matches   m  ON m.id  = co.match_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
       JOIN creators  cr ON cr.id = m.creator_id
      WHERE b.user_id = $1
      ORDER BY (co.status <> 'active'), co.created_at DESC`,
    [userId],
  );

  return rows.map(toCollaborationRow);
}

/**
 * Detalle para cualquiera de las dos partes.
 *
 * El OR del WHERE es lo que hace que la pantalla sea una sola para los dos
 * roles, y el CASE devuelve cuál de los dos está mirando. Quien no es parte
 * no recibe fila, así que la página responde 404 igual que si no existiera:
 * no se puede sondear qué colaboraciones hay probando identificadores.
 */
export async function getCollaboration(
  userId: string,
  collaborationId: string,
): Promise<CollaborationDetail | null> {
  const row = await queryOne<
    ListRow & {
      campaign_description: string | null;
      deliverables: unknown;
      performance_metrics: unknown;
      viewer_role: ViewerRole;
      created_at: Date;
    }
  >(
    `SELECT co.id, co.status, co.payment_status, co.agreed_amount,
            co.deliverables, co.performance_metrics, co.created_at,
            c.title AS campaign_title,
            c.description AS campaign_description,
            CASE WHEN b.user_id = $1 THEN cr.username ELSE b.company_name END
              AS counterpart_name,
            CASE WHEN b.user_id = $1 THEN 'brand' ELSE 'creator' END
              AS viewer_role,
            ${PROGRESS_COLUMNS}
       FROM collaborations co
       JOIN matches   m  ON m.id  = co.match_id
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
      WHERE co.id = $2
        AND (cr.user_id = $1 OR b.user_id = $1)`,
    [userId, collaborationId],
  );

  if (!row) return null;

  return {
    ...toCollaborationRow(row),
    campaignDescription: row.campaign_description,
    deliverables: parseDeliverables(row.deliverables),
    metrics: parseMetrics(row.performance_metrics),
    viewerRole: row.viewer_role,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * El creador reporta cómo funcionó el contenido.
 *
 * Aquí no hace falta el merge en SQL que sí necesitan los entregables: en
 * esta columna escribe una sola persona, así que sustituir el objeto entero
 * no puede pisarle nada a nadie.
 *
 * Se admite también con la colaboración `completed`, y no solo `active`. Los
 * números de un vídeo siguen subiendo días después de publicarlo, y la marca
 * suele dar por cerrada la colaboración antes de que se estabilicen; atarlo
 * a 'active' condenaría a que las cifras finales no se pudieran registrar
 * nunca. En una cancelada no hay nada que medir.
 *
 * Mandar todos los campos vacíos borra el reporte: es la forma natural de
 * deshacer una equivocación desde el mismo formulario.
 */
export async function setPerformanceMetrics(
  userId: string,
  collaborationId: string,
  input: PerformanceMetricsInput,
): Promise<{ metrics: PerformanceMetrics | null } | null> {
  const reported = METRIC_KEYS.some((key) => input[key] !== undefined);
  const payload = reported
    ? JSON.stringify({ ...input, reportedAt: new Date().toISOString() })
    : null;

  const row = await queryOne<{ performance_metrics: unknown }>(
    `UPDATE collaborations co
        SET performance_metrics = $3::jsonb
       FROM matches  m
       JOIN creators cr ON cr.id = m.creator_id
      WHERE co.match_id = m.id
        AND co.id = $2
        AND cr.user_id = $1
        AND co.status <> 'cancelled'
      RETURNING co.performance_metrics`,
    [userId, collaborationId, payload],
  );

  // El envoltorio existe porque hay dos "vacíos" distintos: no volver
  // ninguna fila es "no autorizado", y volver una fila con la columna a null
  // es "reporte borrado con éxito". Devolver `null` a secas los confundiría
  // y el endpoint respondería 404 a un borrado que sí funcionó.
  return row ? { metrics: parseMetrics(row.performance_metrics) } : null;
}

/**
 * La marca fija la lista de entregables. Solo la marca, y solo mientras la
 * colaboración siga activa.
 *
 * El merge ocurre DENTRO del UPDATE, no en TypeScript. Si leyéramos el JSONB,
 * lo mezcláramos aquí y lo escribiéramos de vuelta, un creador marcando un
 * entregable en ese hueco perdería su cambio: la marca escribiría encima con
 * la foto vieja. Al leer `co.deliverables` en la propia sentencia, Postgres
 * bloquea la fila y, si otra transacción se adelantó, reevalúa el UPDATE
 * contra la versión nueva.
 *
 * Los ids los genera el servidor: si vinieran del cliente, una marca podría
 * colar el id de otra fila y arrastrar su `done` a un entregable distinto.
 * Los que llegan se conservan solo si ya estaban en esta colaboración —el
 * LEFT JOIN no encuentra nada para un id inventado y el entregable nace
 * pendiente.
 */
export async function setDeliverables(
  userId: string,
  collaborationId: string,
  input: DeliverablesInput,
): Promise<Deliverable[] | null> {
  const incoming = input.items.map((item) => ({
    id: item.id ?? randomUUID(),
    title: item.title,
  }));

  const row = await queryOne<{ deliverables: unknown }>(
    `UPDATE collaborations co
        SET deliverables = (
              SELECT coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id',     incoming->>'id',
                    'title',  incoming->>'title',
                    'done',   coalesce(previous.done, false),
                    'doneAt', to_jsonb(previous.done_at)
                  ) ORDER BY ord),
                '[]'::jsonb)
                FROM jsonb_array_elements($3::jsonb)
                     WITH ORDINALITY AS t(incoming, ord)
                LEFT JOIN LATERAL (
                  SELECT (d->>'done')::boolean AS done, d->>'doneAt' AS done_at
                    FROM jsonb_array_elements(
                           coalesce(co.deliverables, '[]'::jsonb)) AS d
                   WHERE d->>'id' = incoming->>'id'
                   LIMIT 1
                ) AS previous ON true
            )
       FROM matches   m
       JOIN campaigns c ON c.id = m.campaign_id
       JOIN brands    b ON b.id = c.brand_id
      WHERE co.match_id = m.id
        AND co.id = $2
        AND b.user_id = $1
        AND co.status = 'active'
      RETURNING co.deliverables`,
    [userId, collaborationId, JSON.stringify(incoming)],
  );

  return row ? parseDeliverables(row.deliverables) : null;
}

/**
 * El creador marca un entregable como hecho, o se desdice.
 *
 * Reescribe el array elemento a elemento en vez de sustituirlo entero: así
 * dos entregables marcados a la vez no se pisan, y una edición de títulos
 * concurrente de la marca tampoco se pierde.
 *
 * El `@>` del final es lo que distingue "no existe ese entregable" de "lo he
 * marcado": sin él, un id inventado dejaría la fila intacta y devolvería un
 * 200 mintiendo.
 */
export async function setDeliverableDone(
  userId: string,
  collaborationId: string,
  deliverableId: string,
  done: boolean,
): Promise<Deliverable[] | null> {
  const row = await queryOne<{ deliverables: unknown }>(
    `UPDATE collaborations co
        SET deliverables = (
              SELECT jsonb_agg(
                CASE WHEN d->>'id' = $3
                     THEN d || jsonb_build_object(
                            'done', $4::boolean,
                            'doneAt', CASE WHEN $4::boolean
                                           THEN to_jsonb(now())
                                           ELSE 'null'::jsonb END)
                     ELSE d END
                ORDER BY ord)
                FROM jsonb_array_elements(
                       coalesce(co.deliverables, '[]'::jsonb))
                     WITH ORDINALITY AS t(d, ord)
            )
       FROM matches  m
       JOIN creators cr ON cr.id = m.creator_id
      WHERE co.match_id = m.id
        AND co.id = $2
        AND cr.user_id = $1
        AND co.status = 'active'
        AND coalesce(co.deliverables, '[]'::jsonb)
              @> jsonb_build_array(jsonb_build_object('id', $3::text))
      RETURNING co.deliverables`,
    [userId, collaborationId, deliverableId, done],
  );

  return row ? parseDeliverables(row.deliverables) : null;
}

/**
 * Cierra la colaboración.
 *
 * Quién puede hacer qué va en el WHERE, no en un if: la marca puede darla
 * por completada o cancelarla; el creador solo cancelar. Dar por buena una
 * colaboración es aceptar el trabajo recibido, y eso le toca a quien lo
 * encargó.
 *
 * `co.status = 'active'` hace que los dos estados sean terminales: una
 * colaboración cancelada no se puede resucitar como completada.
 */
export async function closeCollaboration(
  userId: string,
  collaborationId: string,
  status: Exclude<CollaborationStatus, "active">,
): Promise<{ id: string; status: string } | null> {
  return queryOne<{ id: string; status: string }>(
    `UPDATE collaborations co
        SET status = $3
       FROM matches   m
       JOIN creators  cr ON cr.id = m.creator_id
       JOIN campaigns c  ON c.id  = m.campaign_id
       JOIN brands    b  ON b.id  = c.brand_id
      WHERE co.match_id = m.id
        AND co.id = $2
        AND co.status = 'active'
        AND (b.user_id = $1
             OR (cr.user_id = $1 AND $3::text = 'cancelled'))
      RETURNING co.id, co.status`,
    [userId, collaborationId, status],
  );
}
